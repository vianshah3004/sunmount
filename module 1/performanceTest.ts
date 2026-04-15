import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.PERF_BASE_URL ?? "http://localhost:4000";
const AUTH_ENABLED = (process.env.AUTH_ENABLED ?? "false").toLowerCase() === "true";
const SHARED_USERNAME = process.env.SHARED_USERNAME ?? "";
const SHARED_PASSWORD = process.env.SHARED_PASSWORD ?? "";

const nowMs = () => Number(process.hrtime.bigint() / BigInt(1_000_000));

const requestJson = async <T>(
  method: string,
  endpoint: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: T }> => {
  const started = nowMs();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const json = (await response.json()) as T;
  const elapsed = nowMs() - started;

  return {
    status: response.status,
    data: {
      ...(json as Record<string, unknown>),
      _elapsedMs: elapsed
    } as T
  };
};

const loginIfRequired = async () => {
  if (!AUTH_ENABLED) {
    return "";
  }

  const loginRes = await requestJson<{ data?: { token?: string } }>("POST", "/auth/login", {
    username: SHARED_USERNAME,
    password: SHARED_PASSWORD
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    throw new Error(`Auth login failed for performance test. status=${loginRes.status}`);
  }

  return loginRes.data.data.token;
};

const buildItems = (count: number, codes: string[]) =>
  Array.from({ length: count }).map((_, index) => ({
    productCode: codes[index % codes.length],
    quantity: 1,
    price: 10
  }));

const getExistingProductCodes = async (token: string) => {
  const res = await requestJson<{ data?: Array<{ sku?: string; productCode?: string }> }>(
    "GET",
    "/products?limit=200",
    undefined,
    token
  );
  if (res.status !== 200 || !res.data.data || res.data.data.length === 0) {
    throw new Error("Performance test requires at least one product in database");
  }

  const codes = res.data.data
    .map((item) => item.sku ?? item.productCode)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (codes.length === 0) {
    throw new Error("Performance test could not derive product codes from /products response");
  }

  return codes;
};

const createHighVolumeOrder = async (token: string) => {
  const productCodes = await getExistingProductCodes(token);
  const payload = {
    type: "SALE",
    partyId: "PERF-CUSTOMER-1",
    products: buildItems(120, productCodes),
    status: "QUOTATION",
    notes: "performance test"
  };

  const started = nowMs();
  const res = await requestJson<{ success: boolean }>("POST", "/orders", payload, token);
  const elapsed = nowMs() - started;

  return {
    status: res.status,
    elapsedMs: elapsed,
    pass: res.status === 201 && elapsed < 3000,
    response: res.data
  };
};

const measureDashboard = async (token: string) => {
  const started = nowMs();
  const res = await requestJson<{ success: boolean }>("GET", "/dashboard/summary", undefined, token);
  const elapsed = nowMs() - started;

  return {
    status: res.status,
    elapsedMs: elapsed,
    pass: res.status === 200 && elapsed < 2000
  };
};

const main = async () => {
  const token = await loginIfRequired();

  const orderResult = await createHighVolumeOrder(token);
  const dashboardResult = await measureDashboard(token);

  const generatedAt = new Date().toISOString();
  const report = [
    "# Performance Report",
    "",
    `- Generated At: ${generatedAt}`,
    `- Base URL: ${BASE_URL}`,
    `- Auth Enabled: ${AUTH_ENABLED}`,
    "",
    "## Test Cases",
    "",
    "### 1. Create order with 100+ products",
    `- Status: ${orderResult.status}`,
    `- Elapsed: ${orderResult.elapsedMs} ms`,
    `- Requirement: < 3000 ms`,
    `- Result: ${orderResult.pass ? "PASS" : "FAIL"}`,
    `${orderResult.pass ? "" : `- Error Payload: ${JSON.stringify(orderResult.response)}`}`,
    "",
    "### 2. Dashboard summary API",
    `- Status: ${dashboardResult.status}`,
    `- Elapsed: ${dashboardResult.elapsedMs} ms`,
    `- Requirement: < 2000 ms`,
    `- Result: ${dashboardResult.pass ? "PASS" : "FAIL"}`,
    "",
    "## Overall",
    `- Result: ${orderResult.pass && dashboardResult.pass ? "PASS" : "FAIL"}`
  ].join("\n");

  const reportPath = path.join(process.cwd(), "performance_report.md");
  await fs.writeFile(reportPath, report, "utf8");

  console.log(report);

  if (!orderResult.pass || !dashboardResult.pass) {
    process.exitCode = 1;
  }
};

void main();
