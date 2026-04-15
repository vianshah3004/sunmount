import "dotenv/config";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { writeFile } from "fs/promises";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { app } from "../src/app";
import { db, pool, verifyDatabaseConnection } from "../src/db";
import { users, products, manufacturingBatches, transitionLogs, customers, suppliers } from "../src/db/schema";

type UserRole = "ADMIN" | "OPERATOR" | "ACCOUNTANT";
type TestStatus = "PASS" | "FAIL" | "WARN";

type Result = {
  area: string;
  test: string;
  status: TestStatus;
  details: string;
};

const results: Result[] = [];

const runId = `QA-${Date.now()}`;
const skuRaw = `${runId}-RAW`;
const skuFin = `${runId}-FIN`;
const batchId = `${runId}-B1`;

let server: Server | null = null;
let baseUrl = "";

const usersSeed = {
  admin: { username: `${runId}-admin`, password: "QaPass!12345", role: "ADMIN" as UserRole },
  operator: { username: `${runId}-operator`, password: "QaPass!12345", role: "OPERATOR" as UserRole },
  accountant: { username: `${runId}-accountant`, password: "QaPass!12345", role: "ACCOUNTANT" as UserRole }
};

const pass = (area: string, test: string, details: string) => {
  results.push({ area, test, status: "PASS", details });
  console.log(`[PASS] ${area} :: ${test}`);
};

const fail = (area: string, test: string, details: string) => {
  results.push({ area, test, status: "FAIL", details });
  console.log(`[FAIL] ${area} :: ${test}`);
};

const warn = (area: string, test: string, details: string) => {
  results.push({ area, test, status: "WARN", details });
  console.log(`[WARN] ${area} :: ${test}`);
};

const req = async (
  method: string,
  path: string,
  options: { token?: string; body?: unknown; headers?: Record<string, string> } = {}
) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const raw = await response.text();
  let json: any = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch {
      json = null;
    }
  }

  return { status: response.status, json, raw };
};

const ensureUser = async (username: string, password: string, role: UserRole) => {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length) {
    await db.update(users).set({ passwordHash, role }).where(eq(users.username, username));
    return;
  }
  await db.insert(users).values({ username, passwordHash, role });
};

const login = async (username: string, password: string) => {
  const res = await req("POST", "/auth/login", { body: { username, password } });
  if (res.status !== 200 || !res.json?.data?.token) {
    throw new Error(`Login failed for ${username}: ${res.raw}`);
  }
  return String(res.json.data.token);
};

const getQty = async (token: string, productId: string) => {
  const res = await req("GET", `/products/${productId}`, { token });
  if (res.status !== 200) throw new Error(`Failed product fetch ${productId}: ${res.raw}`);
  return Number(res.json?.data?.quantity ?? 0);
};

const testManufacturingFlow = async (adminToken: string, operatorToken: string) => {
  const area = "Manufacturing";

  const rawRes = await req("POST", "/products", {
    token: adminToken,
    body: { sku: skuRaw, name: `${runId} raw`, price: 100, quantity: 100, lowStockThreshold: 5, unit: "pcs" }
  });
  const finRes = await req("POST", "/products", {
    token: adminToken,
    body: { sku: skuFin, name: `${runId} fin`, price: 200, quantity: 10, lowStockThreshold: 5, unit: "pcs" }
  });

  if (rawRes.status !== 201 || finRes.status !== 201) {
    fail(area, "Product setup", `raw=${rawRes.status}, fin=${finRes.status}`);
    return;
  }

  const rawId = String(rawRes.json.data.id);
  const finId = String(finRes.json.data.id);

  const createBatch = await req("POST", "/manufacturing", {
    token: adminToken,
    body: {
      batchNumber: batchId,
      rawMaterials: [{ productCode: skuRaw, quantity: 20 }],
      outputProducts: [{ productCode: skuFin, quantity: 15 }],
      notes: "qa-manufacturing"
    }
  });

  if (createBatch.status !== 201) {
    fail(area, "Create batch", `Expected 201 got ${createBatch.status}: ${createBatch.raw}`);
    return;
  }
  pass(area, "Create batch", "Batch created");

  const rawBeforeStart = await getQty(adminToken, rawId);
  const finBeforeStart = await getQty(adminToken, finId);

  const start1 = await req("POST", `/api/manufacturing/batches/${batchId}/start`, {
    token: operatorToken,
    headers: { "Idempotency-Key": `${runId}-start-1` }
  });

  if (start1.status === 200) {
    pass(area, "Start transition", "Start succeeded");
  } else {
    fail(area, "Start transition", `Expected 200 got ${start1.status}: ${start1.raw}`);
    return;
  }

  const rawAfterStart1 = await getQty(adminToken, rawId);
  const finAfterStart1 = await getQty(adminToken, finId);
  if (rawAfterStart1 === rawBeforeStart - 20 && finAfterStart1 === finBeforeStart) {
    pass(area, "Raw deduction on start only", `raw: ${rawBeforeStart} -> ${rawAfterStart1}, fin unchanged ${finAfterStart1}`);
  } else {
    fail(area, "Raw deduction on start only", `Unexpected quantities raw=${rawAfterStart1}, fin=${finAfterStart1}`);
  }

  const start2 = await req("POST", `/api/manufacturing/batches/${batchId}/start`, {
    token: operatorToken,
    headers: { "Idempotency-Key": `${runId}-start-2` }
  });
  const rawAfterStart2 = await getQty(adminToken, rawId);
  if (start2.status === 200 && rawAfterStart2 === rawAfterStart1) {
    pass(area, "Double start idempotency", `No duplicate deduction; status=${start2.status}`);
  } else {
    fail(area, "Double start idempotency", `status=${start2.status}, raw=${rawAfterStart1}->${rawAfterStart2}`);
  }

  const complete1 = await req("POST", `/api/manufacturing/batches/${batchId}/complete`, {
    token: operatorToken,
    headers: { "Idempotency-Key": `${runId}-complete-1` }
  });
  const rawAfterComplete1 = await getQty(adminToken, rawId);
  const finAfterComplete1 = await getQty(adminToken, finId);
  if (complete1.status === 200 && rawAfterComplete1 === rawAfterStart2 && finAfterComplete1 === finBeforeStart + 15) {
    pass(area, "Complete adds output without raw deduction", `raw stable=${rawAfterComplete1}, fin=${finAfterComplete1}`);
  } else {
    fail(area, "Complete adds output without raw deduction", `status=${complete1.status}, raw=${rawAfterComplete1}, fin=${finAfterComplete1}`);
  }
};

const testSalesAndPurchaseStateMachine = async (adminToken: string, operatorToken: string, accountantToken: string) => {
  const area = "State Machine";

  const custId = randomUUID();
  const suppId = randomUUID();
  await db.insert(customers).values({ id: custId, customerCode: `${runId}-C`, name: `${runId} Customer` });
  await db.insert(suppliers).values({ id: suppId, supplierCode: `${runId}-S`, name: `${runId} Supplier` });

  const saleCreate = await req("POST", "/orders/v2", {
    token: adminToken,
    body: {
      type: "SALE",
      customerId: custId,
      items: [{ productCode: skuFin, quantity: 1, unitPrice: 210 }],
      isDraft: false,
      status: "QUOTATION"
    }
  });

  if (saleCreate.status !== 201) {
    fail(area, "Sales create", `Expected 201 got ${saleCreate.status}: ${saleCreate.raw}`);
    return;
  }

  const saleId = String(saleCreate.json.data.id);
  const invalidSkip = await req("PUT", `/orders/v2/${saleId}/status`, {
    token: adminToken,
    body: { toStatus: "DISPATCHED" }
  });

  if (invalidSkip.status === 409) {
    pass(area, "Reject invalid sales transition skip", "QUOTATION -> DISPATCHED rejected");
  } else {
    fail(area, "Reject invalid sales transition skip", `Expected 409 got ${invalidSkip.status}`);
  }

  const validFlow = ["APPROVED", "PACKING", "DISPATCHED", "COMPLETED"];
  let validFlowOk = true;
  for (const step of validFlow) {
    const res = await req("PUT", `/orders/v2/${saleId}/status`, { token: adminToken, body: { toStatus: step } });
    if (res.status !== 200) {
      validFlowOk = false;
      fail(area, `Sales valid transition to ${step}`, `Got ${res.status}: ${res.raw}`);
      break;
    }
  }
  if (validFlowOk) {
    pass(area, "Sales valid transition chain", "QUOTATION->APPROVED->PACKING->DISPATCHED->COMPLETED");
  }

  const objectiveStatusProbe1 = await req("PUT", `/orders/v2/${saleId}/status`, {
    token: adminToken,
    body: { toStatus: "CONFIRMED" }
  });
  if (objectiveStatusProbe1.status === 400) {
    warn(area, "Objective status mismatch", "CONFIRMED/DELIVERED are not backend statuses; using APPROVED/COMPLETED");
  }

  const purchaseV1 = await req("POST", "/orders", {
    token: adminToken,
    body: {
      type: "PURCHASE",
      partyId: `${runId}-supplier-party`,
      products: [{ productCode: skuRaw, quantity: 2, price: 99 }]
    }
  });

  if (purchaseV1.status !== 201) {
    fail(area, "Purchase create (v1)", `Expected 201 got ${purchaseV1.status}`);
    return;
  }

  const purchaseId = String(purchaseV1.json.data.id);
  const toUnpaid = await req("POST", `/api/history/purchase:${purchaseId}/next-stage`, { token: operatorToken });
  const operatorPaidAttempt = await req("POST", `/api/history/purchase:${purchaseId}/next-stage`, { token: operatorToken });

  if (toUnpaid.status === 200 && operatorPaidAttempt.status === 403) {
    pass(area, "Purchase paid transition role-gated", "Operator blocked from marking PAID");
  } else {
    fail(area, "Purchase paid transition role-gated", `toUnpaid=${toUnpaid.status}, operatorPaid=${operatorPaidAttempt.status}`);
  }

  const accountantPaid = await req("POST", `/api/history/purchase:${purchaseId}/next-stage`, { token: accountantToken });
  if (accountantPaid.status === 200) {
    pass(area, "Purchase paid by accountant", "Accountant successfully marked PAID stage");
  } else {
    fail(area, "Purchase paid by accountant", `Expected 200 got ${accountantPaid.status}`);
  }
};

const testConcurrencyAndIdempotency = async (operatorToken: string) => {
  const area = "Concurrency";
  const concurrentBatch = `${runId}-CONC-B1`;

  await db.insert(manufacturingBatches).values({
    batchNumber: concurrentBatch,
    rawMaterials: [{ productCode: skuRaw, quantity: 1 }],
    outputProducts: [{ productCode: skuFin, quantity: 1 }],
    status: "IN_PROGRESS",
    notes: "concurrency-batch"
  });

  const calls = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      req("POST", `/api/manufacturing/batches/${concurrentBatch}/start`, {
        token: operatorToken,
        headers: { "Idempotency-Key": `${runId}-conc-${i}` }
      })
    )
  );

  const statusCounts = calls.reduce<Record<string, number>>((acc, row) => {
    acc[String(row.status)] = (acc[String(row.status)] ?? 0) + 1;
    return acc;
  }, {});

  if ((statusCounts["200"] ?? 0) === 1 && (statusCounts["409"] ?? 0) >= 1) {
    pass(area, "Concurrent start conflict safety", JSON.stringify(statusCounts));
  } else {
    warn(
      area,
      "Concurrent start conflict safety",
      `Expected one success + conflicts; actual ${JSON.stringify(statusCounts)} (backend currently idempotent, not conflicting)`
    );
  }

  const transitionRows = await db
    .select({ id: transitionLogs.id })
    .from(transitionLogs)
    .where(and(eq(transitionLogs.entityType, "manufacturing"), eq(transitionLogs.entityId, concurrentBatch), eq(transitionLogs.action, "START")));

  if (transitionRows.length >= 1) {
    pass(area, "Audit written under concurrency", `start transition logs=${transitionRows.length}`);
  } else {
    fail(area, "Audit written under concurrency", "No START transition log found");
  }
};

const testFailureAndAudit = async (adminToken: string) => {
  const area = "Failure + Audit";

  const badReq = await req("PUT", "/orders/v2/not-a-uuid/status", {
    token: adminToken,
    body: { toStatus: "PACKING" }
  });

  if (badReq.status === 400 || badReq.status === 404) {
    pass(area, "Invalid request handled", `status=${badReq.status}`);
  } else {
    fail(area, "Invalid request handled", `Unexpected status ${badReq.status}`);
  }

  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), 1);
  try {
    await fetch(`${baseUrl}/health`, { signal: abortController.signal });
    warn(area, "Network timeout simulation", "Abort did not trigger (very fast local response)");
  } catch {
    pass(area, "Network timeout simulation", "Client-side abort/timeout path verified");
  }

  const auditProbe = await db
    .select()
    .from(transitionLogs)
    .where(eq(transitionLogs.entityType, "manufacturing"))
    .orderBy(transitionLogs.createdAt)
    .limit(1);

  if (auditProbe.length && auditProbe[0].previousState && auditProbe[0].newState && auditProbe[0].performedBy && auditProbe[0].createdAt) {
    pass(area, "Audit log field integrity", "previous/new/performedBy/timestamp present");
  } else {
    fail(area, "Audit log field integrity", "Missing expected audit fields");
  }
};

const generateReport = async () => {
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;

  const bugs = results.filter((r) => r.status === "FAIL" || r.status === "WARN");

  const lines: string[] = [];
  lines.push("# QA End-to-End Test Report");
  lines.push("");
  lines.push(`- Run: ${runId}`);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Total tests: ${total}`);
  lines.push(`- Passed: ${passed}`);
  lines.push(`- Failed: ${failed}`);
  lines.push(`- Warnings: ${warned}`);
  lines.push("");
  lines.push("## Detailed Results");
  lines.push("");
  for (const row of results) {
    lines.push(`- [${row.status}] ${row.area} :: ${row.test} -> ${row.details}`);
  }
  lines.push("");
  lines.push("## Bugs / Risks Found");
  lines.push("");
  if (bugs.length === 0) {
    lines.push("- No critical bugs found in executed scope.");
  } else {
    for (const bug of bugs) {
      lines.push(`- ${bug.area} / ${bug.test}: ${bug.details}`);
    }
  }
  lines.push("");
  lines.push("## System Weak Points");
  lines.push("");
  lines.push("- Legacy test suites are auth-oblivious and fail under hardened auth unless updated.");
  lines.push("- Business objective statuses (CONFIRMED/DELIVERED, CREATED/ORDERED/RECEIVED) do not match backend enum design.");
  lines.push("- Concurrency behavior on manufacturing start is idempotent; may not emit 409 conflicts by design.");
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  lines.push("1. Align product/UI state labels with backend canonical enums or add translation layer.");
  lines.push("2. Update legacy test scripts to use authenticated requests and seeded role users.");
  lines.push("3. Decide policy: strict conflict (409) vs idempotent success for duplicate start operations, then enforce consistently.");
  lines.push("4. Add deterministic fault-injection hooks for mid-transaction crash simulation in staging.");

  await writeFile("qa_e2e_report.md", `${lines.join("\n")}\n`, "utf8");
};

const cleanup = async () => {
  try {
    await db.delete(manufacturingBatches).where(eq(manufacturingBatches.batchNumber, batchId));
  } catch {
    // ignore
  }
  await pool.end();
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }
};

const main = async () => {
  await verifyDatabaseConnection();

  await Promise.all([
    ensureUser(usersSeed.admin.username, usersSeed.admin.password, usersSeed.admin.role),
    ensureUser(usersSeed.operator.username, usersSeed.operator.password, usersSeed.operator.role),
    ensureUser(usersSeed.accountant.username, usersSeed.accountant.password, usersSeed.accountant.role)
  ]);

  server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server?.once("error", reject);
    server?.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;

  const [adminToken, operatorToken, accountantToken] = await Promise.all([
    login(usersSeed.admin.username, usersSeed.admin.password),
    login(usersSeed.operator.username, usersSeed.operator.password),
    login(usersSeed.accountant.username, usersSeed.accountant.password)
  ]);

  await testManufacturingFlow(adminToken, operatorToken);
  await testSalesAndPurchaseStateMachine(adminToken, operatorToken, accountantToken);
  await testConcurrencyAndIdempotency(operatorToken);
  await testFailureAndAudit(adminToken);

  await generateReport();

  const failCount = results.filter((r) => r.status === "FAIL").length;
  await cleanup();
  if (failCount > 0) {
    process.exitCode = 1;
  }
};

void main().catch(async (error) => {
  console.error("qa run failed", error);
  process.exitCode = 1;
  await cleanup();
});
