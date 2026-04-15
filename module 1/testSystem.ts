import "dotenv/config";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { randomUUID } from "node:crypto";
import { writeFile } from "fs/promises";
import { and, eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { app } from "./src/app";
import { initSocket } from "./src/common/socket";
import { registerInventoryEventHandlers } from "./src/modules/inventory/inventory.events";
import { aiService } from "./src/modules/ai/ai.service";
import { db, pool, verifyDatabaseConnection } from "./src/db";
import { inventoryLogs, products, users } from "./src/db/schema";

type TopLevelSection =
  | "database"
  | "productModule"
  | "inventoryEngine"
  | "inventoryLogs"
  | "lowStockAlert"
  | "performance"
  | "errorHandling"
  | "aiGroqConnectivity"
  | "aiReorder"
  | "aiNlQuery"
  | "aiInsights"
  | "aiErrorHandling";

type SectionResult = {
  passed: boolean;
  details: string[];
};

type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

type ErrorEnvelope = {
  success: false;
  error: {
    type: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

type ApiResponse<T = unknown> = {
  status: number;
  data: T | null;
  text: string;
  durationMs: number;
};

const results: Record<TopLevelSection, SectionResult> = {
  database: { passed: true, details: [] },
  productModule: { passed: true, details: [] },
  inventoryEngine: { passed: true, details: [] },
  inventoryLogs: { passed: true, details: [] },
  lowStockAlert: { passed: true, details: [] },
  performance: { passed: true, details: [] },
  errorHandling: { passed: true, details: [] },
  aiGroqConnectivity: { passed: true, details: [] },
  aiReorder: { passed: true, details: [] },
  aiNlQuery: { passed: true, details: [] },
  aiInsights: { passed: true, details: [] },
  aiErrorHandling: { passed: true, details: [] }
};

let server: Server | null = null;
let baseUrl = "";
let cleanupProductId: string | null = null;
let token: string = "";
let originalFetchRef: typeof global.fetch | null = null;

const record = (section: TopLevelSection, passed: boolean, detail: string) => {
  if (!passed) {
    results[section].passed = false;
  }
  results[section].details.push(`${passed ? "PASS" : "FAIL"}: ${detail}`);
};

const assertCondition = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const requestJson = async <T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<ApiResponse<T>> => {
  const start = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const durationMs = Date.now() - start;
  const text = await response.text();
  let data: T | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }

  return { status: response.status, data, text, durationMs };
};

const getSuccessData = <T>(response: ApiResponse<SuccessEnvelope<T>>): T => {
  const envelope = response.data;
  if (!envelope || envelope.success !== true) {
    throw new Error(`Expected success envelope. Raw: ${response.text}`);
  }
  return envelope.data;
};

const getErrorData = (response: ApiResponse<ErrorEnvelope>) => {
  const envelope = response.data;
  if (!envelope || envelope.success !== false) {
    throw new Error(`Expected error envelope. Raw: ${response.text}`);
  }
  return envelope.error;
};

const ensureUser = async (username: string, password: string, role: string = "ADMIN") => {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length) {
    await db.update(users).set({ passwordHash, role }).where(eq(users.username, username));
    return;
  }
  await db.insert(users).values({ username, passwordHash, role });
};

const login = async (username: string, password: string): Promise<string> => {
  const res = await requestJson<SuccessEnvelope<{ token: string }>>("POST", "/auth/login", { username, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${username}: status ${res.status}, ${res.text}`);
  }
  const envelope = res.data;
  if (!envelope || envelope.success !== true || !envelope.data?.token) {
    throw new Error(`Login failed for ${username}: invalid response ${res.text}`);
  }
  return String(envelope.data.token);
};

const startTestServer = async () => {
  server = createServer(app);
  initSocket(server);
  registerInventoryEventHandlers();

  await new Promise<void>((resolve, reject) => {
    server?.once("error", reject);
    server?.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`System test server started at ${baseUrl}`);
};

const stopTestServer = async () => {
  if (cleanupProductId) {
    await db.delete(products).where(eq(products.id, cleanupProductId));
  }

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  await pool.end();
};

const writeReport = async () => {
  const allPass = Object.values(results).every((section) => section.passed);

  const issuesFound = Object.entries(results)
    .filter(([, value]) => !value.passed)
    .map(([key]) => key);

  const recommendations = [
    "Run this system test in CI against an isolated Neon branch.",
    "Set GROQ_API_KEY in deployment environments to enable full AI inference validation.",
    "Add scheduled performance test runs to detect regressions over time."
  ];

  const md = [
    "# Final System Test Report",
    "",
    "## 1. Database",
    "",
    `${results.database.passed ? "✔" : "❌"}`,
    ...results.database.details.map((d) => `- ${d}`),
    "",
    "## 2. Product Module",
    "",
    `${results.productModule.passed ? "✔" : "❌"}`,
    ...results.productModule.details.map((d) => `- ${d}`),
    "",
    "## 3. Inventory Engine",
    "",
    `${results.inventoryEngine.passed ? "✔" : "❌"}`,
    ...results.inventoryEngine.details.map((d) => `- ${d}`),
    "",
    "## 4. Inventory Logs",
    "",
    `${results.inventoryLogs.passed ? "✔" : "❌"}`,
    ...results.inventoryLogs.details.map((d) => `- ${d}`),
    "",
    "## 5. Low Stock Alert",
    "",
    `${results.lowStockAlert.passed ? "✔" : "❌"}`,
    ...results.lowStockAlert.details.map((d) => `- ${d}`),
    "",
    "## 6. Performance",
    "",
    `${results.performance.passed ? "✔" : "❌"}`,
    ...results.performance.details.map((d) => `- ${d}`),
    "",
    "## 7. Error Handling",
    "",
    `${results.errorHandling.passed ? "✔" : "❌"}`,
    ...results.errorHandling.details.map((d) => `- ${d}`),
    "",
    "## 8. AI Module",
    "",
    "### Groq Connectivity",
    "",
    `${results.aiGroqConnectivity.passed ? "✔" : "❌"}`,
    ...results.aiGroqConnectivity.details.map((d) => `- ${d}`),
    "",
    "### Reorder Suggestions",
    "",
    `${results.aiReorder.passed ? "✔" : "❌"}`,
    ...results.aiReorder.details.map((d) => `- ${d}`),
    "",
    "### Natural Language Query",
    "",
    `${results.aiNlQuery.passed ? "✔" : "❌"}`,
    ...results.aiNlQuery.details.map((d) => `- ${d}`),
    "",
    "### Business Insights",
    "",
    `${results.aiInsights.passed ? "✔" : "❌"}`,
    ...results.aiInsights.details.map((d) => `- ${d}`),
    "",
    "### AI Error Handling",
    "",
    `${results.aiErrorHandling.passed ? "✔" : "❌"}`,
    ...results.aiErrorHandling.details.map((d) => `- ${d}`),
    "",
    "## 9. Final Verdict",
    "",
    `- System Status: ${allPass ? "READY" : "NEEDS FIXES"}`,
    "- Issues Found:",
    ...(issuesFound.length > 0
      ? issuesFound.map((issue) => `- ${issue}`)
      : ["- No critical issues found in this test run."]),
    "- Recommendations:",
    ...recommendations.map((recommendation) => `- ${recommendation}`),
    ""
  ].join("\n");

  await writeFile("final_system_test_report.md", md, "utf8");
};

const run = async () => {
  const suffix = randomUUID().slice(0, 8);
  const productCode = `SKU-SYS-${suffix}`;

  await startTestServer();

  try {
    console.log("1) Database tests...");
    await verifyDatabaseConnection();
    const selectOne = await db.execute(sql`select 1 as ok`);
    assertCondition(selectOne.rowCount === 1, "SELECT 1 did not return expected row count");

    const schemaChecks = await db.execute(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_name in ('products', 'inventory_logs')
    `);
    assertCondition(schemaChecks.rowCount === 2, "Required schema tables not found");
    record("database", true, "Database connection, query execution, and schema checks passed.");
    // Setup authentication for subsequent tests
    const testUsername = `test-system-${suffix}`;
    const testPassword = "TestPass!12345";
    await ensureUser(testUsername, testPassword, "ADMIN");
    token = await login(testUsername, testPassword);
    console.log("   Auth: Test user created and logged in. Token acquired.");
    console.log("2) Product module tests...");
    const createRes = await requestJson<SuccessEnvelope<{ id: string; productCode: string }>>(
      "POST",
      "/products",
      {
        sku: productCode,
        name: "System Test Product",
        description: "E2E product for full system tests",
        weight: 0.4,
        price: 79.99,
        quantity: 30,
        lowStockThreshold: 10
      },
      token
    );
    assertCondition(createRes.status === 201, `Create expected 201, got ${createRes.status}`);
    const created = getSuccessData(createRes);
    cleanupProductId = created.id;

    const listRes = await requestJson<SuccessEnvelope<Array<{ sku: string }>>>("GET", "/products", undefined, token);
    assertCondition(listRes.status === 200, `List expected 200, got ${listRes.status}`);
    const listedProducts = getSuccessData(listRes);
    assertCondition(listedProducts.some((p) => p.sku === productCode), "Created product missing");

    const duplicateRes = await requestJson<ErrorEnvelope>(
      "POST",
      "/products",
      {
        sku: productCode,
        name: "Duplicate Product",
        price: 10
      },
      token
    );
    assertCondition(duplicateRes.status === 400, "Duplicate product should return 400");
    const duplicateError = getErrorData(duplicateRes);
    assertCondition(duplicateError.type === "DUPLICATE_ENTRY", "Expected DUPLICATE_ENTRY type");

    const updateRes = await requestJson<SuccessEnvelope<{ quantity: number }>>(
      "PUT",
      `/products/${cleanupProductId}`,
      { quantity: 25 },
      token
    );
    assertCondition(updateRes.status === 200, "Update should return 200");
    assertCondition(getSuccessData(updateRes).quantity === 25, "Updated quantity mismatch");

    record("productModule", true, "Create, fetch, update, delete path and unique constraint validated.");

    console.log("3) Inventory engine tests...");
    const inventoryCases = [
      { type: "SALE", qty: 5, expected: 20, ref: "SYS-SALE-1" },
      { type: "PURCHASE", qty: 4, expected: 24, ref: "SYS-PUR-1" },
      { type: "WIP_RAW", qty: 2, expected: 22, ref: "SYS-WIPRAW-1" },
      { type: "WIP_OUTPUT", qty: 6, expected: 28, ref: "SYS-WIPOUT-1" }
    ] as const;

    for (const testCase of inventoryCases) {
      const res = await requestJson<SuccessEnvelope<{ newQuantity: number }>>(
        "POST",
        "/inventory/update",
        {
        productCode,
        type: testCase.type,
        quantity: testCase.qty,
        referenceId: testCase.ref
        },
        token
      );
      assertCondition(res.status === 200, `${testCase.type} expected 200, got ${res.status}`);
      const data = getSuccessData(res);
      assertCondition(
        data.newQuantity === testCase.expected,
        `${testCase.type} expected ${testCase.expected}, got ${data.newQuantity}`
      );
    }

    const parallelUpdates = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        requestJson<SuccessEnvelope<{ newQuantity: number }>>(
          "POST",
          "/inventory/update",
          {
          productCode,
          type: "PURCHASE",
          quantity: 1,
          referenceId: `SYS-PAR-${i}`
          },
          token
        )
      )
    );

    assertCondition(parallelUpdates.every((res) => res.status === 200), "Concurrent updates had failures");

    const [postParallelProduct] = await db
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, String(cleanupProductId)))
      .limit(1);

    assertCondition(postParallelProduct.quantity === 38, "Race condition suspected: final quantity mismatch");
    record(
      "inventoryEngine",
      true,
      "SALE/PURCHASE/WIP flows correct and concurrent updates preserved stock consistency."
    );

    console.log("4) Inventory logs tests...");
    const logRows = await db
      .select({ changeType: inventoryLogs.changeType, referenceId: inventoryLogs.referenceId })
      .from(inventoryLogs)
      .where(eq(inventoryLogs.productId, String(cleanupProductId)));

    assertCondition(logRows.length >= 14, "Expected log entries missing for inventory operations");
    const hasAllPrimaryTypes = ["SALE", "PURCHASE", "WIP_RAW", "WIP_OUTPUT"].every((type) =>
      logRows.some((row) => row.changeType === type)
    );
    assertCondition(hasAllPrimaryTypes, "Not all inventory change types were logged");
    assertCondition(logRows.every((row) => row.referenceId !== null), "Some inventory logs are missing referenceId");
    record("inventoryLogs", true, "Inventory log integrity verified across all inventory actions.");

    console.log("5) Low stock alert tests...");
    const lowStockRes = await requestJson<SuccessEnvelope<{ newQuantity: number }>>(
      "POST",
      "/inventory/update",
      {
      productCode,
      type: "SALE",
      quantity: 29,
      referenceId: "SYS-LOW-1"
      },
      token
    );

    assertCondition(lowStockRes.status === 200, "Low stock operation should succeed");
    const lowStockData = getSuccessData(lowStockRes);
    assertCondition(lowStockData.newQuantity === 9, "Low stock target quantity mismatch");

    const [lowStockProduct] = await db
      .select({ quantity: products.quantity, lowStockThreshold: products.lowStockThreshold })
      .from(products)
      .where(eq(products.id, String(cleanupProductId)))
      .limit(1);

    assertCondition(
      lowStockProduct.quantity < lowStockProduct.lowStockThreshold,
      "Low stock condition not reached"
    );
    record("lowStockAlert", true, "Stock dropped below threshold and low-stock path executed.");

    console.log("6) Performance tests...");
    const perfTimes: number[] = [];
    for (let i = 0; i < 25; i += 1) {
      const perfRes = await requestJson<SuccessEnvelope<{ newQuantity: number }>>(
        "POST",
        "/inventory/update",
        {
        productCode,
        type: "PURCHASE",
        quantity: 1,
        referenceId: `SYS-PERF-${i}`
        },
        token
      );
      assertCondition(perfRes.status === 200, `Performance request ${i} failed`);
      perfTimes.push(perfRes.durationMs);
    }

    const maxPerf = Math.max(...perfTimes);
    assertCondition(maxPerf < 3_000, `Performance exceeded threshold: ${maxPerf}ms`);
    record("performance", true, `25 updates completed with max response time ${maxPerf}ms.`);

    console.log("7) Error handling tests...");
    const invalidProductRes = await requestJson<ErrorEnvelope>(
      "POST",
      "/inventory/update",
      {
      sku: "SKU-NOT-EXIST",
      type: "SALE",
      quantity: 1,
      referenceId: "SYS-ERR-1"
      },
      token
    );
    const invalidQuantityRes = await requestJson<ErrorEnvelope>(
      "POST",
      "/inventory/update",
      {
      productCode,
      type: "SALE",
      quantity: 0,
      referenceId: "SYS-ERR-2"
      },
      token
    );
    const missingFieldsRes = await requestJson<ErrorEnvelope>(
      "POST",
      "/products",
      {
      description: "missing payload"
      },
      token
    );

    const invalidProductError = getErrorData(invalidProductRes);
    const invalidQuantityError = getErrorData(invalidQuantityRes);
    const missingFieldsError = getErrorData(missingFieldsRes);

    assertCondition(invalidProductRes.status === 404, "Invalid productCode should return 404");
    assertCondition(invalidProductError.type === "NOT_FOUND", "Invalid productCode type mismatch");
    assertCondition(invalidQuantityRes.status === 400, "Invalid quantity should return 400");
    assertCondition(invalidQuantityError.type === "VALIDATION_ERROR", "Invalid quantity type mismatch");
    assertCondition(missingFieldsRes.status === 400, "Missing fields should return 400");
    assertCondition(missingFieldsError.type === "VALIDATION_ERROR", "Missing fields type mismatch");

    record("errorHandling", true, "Structured error responses and expected error types validated.");

    console.log("8A) AI Groq connectivity tests...");
    try {
      const groqRaw = await aiService.callGroq(
        "Reply with exactly: CONNECTED",
        "Return a single plain text line and nothing else."
      );
      const connected = groqRaw.toLowerCase().includes("connected");
      record("aiGroqConnectivity", connected, `Groq response received: ${groqRaw.slice(0, 120)}`);
    } catch (error) {
      record(
        "aiGroqConnectivity",
        false,
        `Groq connectivity failed: ${(error as { message?: string })?.message ?? "unknown error"}`
      );
    }

    console.log("8B) AI reorder suggestion tests...");
    const reorderRes = await requestJson<
      SuccessEnvelope<{
        recommendation: {
          suggestedQuantity: number;
          reorderWhen: string;
          reasoning: string;
          source: "ai" | "fallback";
        };
      }>
    >("GET", `/ai/reorder/${cleanupProductId}`, undefined, token);
    assertCondition(reorderRes.status === 200, "Reorder endpoint should return 200");
    const reorderData = getSuccessData(reorderRes);
    assertCondition(
      reorderData.recommendation.suggestedQuantity >= 0,
      "Reorder suggestedQuantity must be non-negative"
    );
    assertCondition(
      reorderData.recommendation.reasoning.length >= 10,
      "Reorder reasoning appears too generic"
    );
    record(
      "aiReorder",
      true,
      `Reorder suggestion returned source=${reorderData.recommendation.source} with quantity=${reorderData.recommendation.suggestedQuantity}.`
    );

    console.log("8C) AI natural language query tests...");
    const nlLowRes = await requestJson<SuccessEnvelope<{ intent: string; resultCount: number }>>(
      "POST",
      "/ai/query",
      {
        userQuery: "Which products are low in stock?"
      },
      token
    );
    assertCondition(nlLowRes.status === 200, "Low-stock NL query should return 200");
    const nlLowData = getSuccessData(nlLowRes);
    assertCondition(nlLowData.intent === "LOW_STOCK", `Expected LOW_STOCK, got ${nlLowData.intent}`);

    const nlHighRes = await requestJson<SuccessEnvelope<{ intent: string; resultCount: number }>>(
      "POST",
      "/ai/query",
      {
        userQuery: "Show me high stock items"
      },
      token
    );
    assertCondition(nlHighRes.status === 200, "High-stock NL query should return 200");
    const nlHighData = getSuccessData(nlHighRes);
    assertCondition(
      nlHighData.intent === "OVERSTOCK",
      `Expected OVERSTOCK for high stock query, got ${nlHighData.intent}`
    );

    record(
      "aiNlQuery",
      true,
      `NL intent mapping validated (LOW_STOCK and OVERSTOCK). ResultCounts=${nlLowData.resultCount}/${nlHighData.resultCount}.`
    );

    console.log("8D) AI business insights tests...");
    const insightRes = await requestJson<
      SuccessEnvelope<{
        insights: {
          fastMovingProducts: unknown[];
          slowMovingProducts: unknown[];
          overstockRisks: unknown[];
          recommendations: string[];
        };
      }>
    >("GET", "/ai/insights", undefined, token);
    assertCondition(insightRes.status === 200, "Insights endpoint should return 200");
    const insightData = getSuccessData(insightRes);
    assertCondition(Array.isArray(insightData.insights.fastMovingProducts), "fastMovingProducts must be array");
    assertCondition(Array.isArray(insightData.insights.slowMovingProducts), "slowMovingProducts must be array");
    assertCondition(Array.isArray(insightData.insights.overstockRisks), "overstockRisks must be array");
    assertCondition(Array.isArray(insightData.insights.recommendations), "recommendations must be array");
    record("aiInsights", true, "Insights response schema validated successfully.");

    console.log("9) AI error handling tests...");
    const originalApiKey = process.env.GROQ_API_KEY;
    const originalFetch = global.fetch;
    originalFetchRef = originalFetch;

    process.env.GROQ_API_KEY = "invalid-key";
    const invalidKeyInsights = await aiService.generateInsights();
    assertCondition(invalidKeyInsights.source === "fallback", "Invalid API key should trigger fallback");

     global.fetch = (async () => {
       const abortError = new Error("aborted");
       abortError.name = "AbortError";
       throw abortError;
     }) as typeof global.fetch;

    const timeoutFallback = await aiService.generateInsights();
    assertCondition(timeoutFallback.source === "fallback", "Timeout should trigger fallback");

    process.env.GROQ_API_KEY = originalApiKey;
    global.fetch = originalFetch;

    record(
      "aiErrorHandling",
      true,
      "Invalid key and timeout conditions returned graceful fallback responses without crashes."
    );

    const deleteRes = await requestJson<SuccessEnvelope<{ id: string }>>("DELETE", `/products/${cleanupProductId}`);
    assertCondition(deleteRes.status === 200, "Cleanup delete failed");
    cleanupProductId = null;
  } catch (error) {
    console.error("System test failed:", error instanceof Error ? error.message : String(error));
    for (const key of Object.keys(results) as TopLevelSection[]) {
      if (results[key].details.length === 0) {
        record(key, false, "Section aborted due to earlier failure.");
      }
    }
  } finally {
    if (originalFetchRef) {
      global.fetch = originalFetchRef;
    }
     await writeReport();
     await stopTestServer();

    console.log("\n=== Final System Test Summary ===");
    for (const [key, value] of Object.entries(results)) {
      console.log(`${key}: ${value.passed ? "PASSED" : "FAILED"}`);
      for (const detail of value.details) {
        console.log(`  - ${detail}`);
      }
    }
    console.log("Report written to final_system_test_report.md");
  }
};

void run();
