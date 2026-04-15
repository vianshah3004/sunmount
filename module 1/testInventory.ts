import "dotenv/config";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { writeFile } from "fs/promises";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { app } from "./src/app";
import { initSocket } from "./src/common/socket";
import { registerInventoryEventHandlers } from "./src/modules/inventory/inventory.events";
import { db, pool, verifyDatabaseConnection } from "./src/db";
import { inventoryLogs, products } from "./src/db/schema";

type TestSectionKey =
  | "dbConnectivity"
  | "productCrud"
  | "inventoryLogic"
  | "inventoryLogs"
  | "transactions"
  | "lowStockAlert"
  | "performance"
  | "errorHandling"
  | "apiEndpoints";

type SectionResult = {
  passed: boolean;
  details: string[];
};

type ApiResponse<T = unknown> = {
  status: number;
  data: T | null;
  text: string;
  durationMs: number;
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

const results: Record<TestSectionKey, SectionResult> = {
  dbConnectivity: { passed: true, details: [] },
  productCrud: { passed: true, details: [] },
  inventoryLogic: { passed: true, details: [] },
  inventoryLogs: { passed: true, details: [] },
  transactions: { passed: true, details: [] },
  lowStockAlert: { passed: true, details: [] },
  performance: { passed: true, details: [] },
  errorHandling: { passed: true, details: [] },
  apiEndpoints: { passed: true, details: [] }
};

let server: Server | null = null;
let baseUrl = "";
let cleanupProductId: string | null = null;

const record = (section: TestSectionKey, passed: boolean, detail: string) => {
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

const sleep = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const withRetry = async <T>(
  operation: () => Promise<T>,
  attempts: number,
  delayMs: number,
  label: string
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.warn(`${label} attempt ${attempt} failed. Retrying...`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
};

const requestJson = async <T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> => {
  const start = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
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

  return {
    status: response.status,
    data,
    text,
    durationMs
  };
};

const getSuccessData = <T>(response: ApiResponse<SuccessEnvelope<T>>): T => {
  const envelope = response.data;
  if (!envelope || typeof envelope !== "object" || (envelope as { success?: boolean }).success !== true) {
    throw new Error(`Expected success envelope, got: ${response.text}`);
  }

  return (envelope as SuccessEnvelope<T>).data;
};

const getErrorData = (response: ApiResponse<ErrorEnvelope>) => {
  const envelope = response.data;
  if (!envelope || typeof envelope !== "object" || (envelope as { success?: boolean }).success !== false) {
    throw new Error(`Expected error envelope, got: ${response.text}`);
  }
  return (envelope as ErrorEnvelope).error;
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
  console.log(`Test server started at ${baseUrl}`);
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
  const sections = [
    {
      title: "1. Database Connectivity",
      key: "dbConnectivity" as const
    },
    {
      title: "2. Product CRUD",
      key: "productCrud" as const
    },
    {
      title: "3. Inventory Logic",
      key: "inventoryLogic" as const
    },
    {
      title: "4. Inventory Logs",
      key: "inventoryLogs" as const
    },
    {
      title: "5. Transactions",
      key: "transactions" as const
    },
    {
      title: "6. Low Stock Alert",
      key: "lowStockAlert" as const
    },
    {
      title: "7. Performance",
      key: "performance" as const
    },
    {
      title: "8. Error Handling",
      key: "errorHandling" as const
    }
  ];

  const allPass = Object.values(results).every((section) => section.passed);
  const issues: string[] = [];

  if (!results.errorHandling.passed) {
    issues.push("Error handling responses are generic and hide root causes.");
  }
  if (!results.inventoryLogs.passed) {
    issues.push("Inventory logging validations failed for one or more event types.");
  }
  if (!results.transactions.passed) {
    issues.push("Transaction rollback safety could not be validated fully.");
  }

  if (issues.length === 0) {
    issues.push("No critical functional issues found in this test run.");
  }

  const recommendations = [
    "Return more specific API error messages for known validation and business rule failures.",
    "Serialize Error objects with message and stack in logger to avoid empty {} payloads.",
    "Add this test script to CI and run against a dedicated Neon branch before release."
  ];

  const markdown = [
    "# Inventory Module Test Report",
    "",
    ...sections.flatMap(({ title, key }) => [
      `## ${title}`,
      "",
      `${results[key].passed ? "✔ Passed" : "❌ Failed"}`,
      "Details:",
      ...results[key].details.map((detail) => `- ${detail}`),
      "",
      "---",
      ""
    ]),
    "## 9. Final Verdict",
    "",
    `- System Status: ${allPass ? "READY" : "NEEDS FIXES"}`,
    "- Issues Found:",
    ...issues.map((issue) => `- ${issue}`),
    "- Recommendations:",
    ...recommendations.map((recommendation) => `- ${recommendation}`),
    ""
  ].join("\n");

  await writeFile("inventory_test_report.md", markdown, "utf8");
};

const run = async () => {
  const uniqueSuffix = Date.now();
  const productCode = `SKU-QA-${uniqueSuffix}`;

  await startTestServer();

  try {
    console.log("Running Database Connectivity tests...");
    await withRetry(() => verifyDatabaseConnection(), 5, 2_000, "DB connectivity");
    const dbCheck = await withRetry(() => db.execute(sql`select 1 as ok`), 5, 2_000, "SELECT 1");
    assertCondition(dbCheck.rowCount === 1, "SELECT 1 did not return expected row count");
    record("dbConnectivity", true, "DB connection and SELECT 1 query succeeded.");

    console.log("Running Product CRUD tests...");
    const createRes = await requestJson<SuccessEnvelope<{ id: string; productCode: string }>>(
      "POST",
      "/products",
      {
      productCode,
      name: "QA Product",
      description: "created by testInventory.ts",
      weight: 0.25,
      price: 49.99,
      quantity: 20,
      lowStockThreshold: 10
      }
    );

    assertCondition(createRes.status === 201, `Create product expected 201, got ${createRes.status}`);
    const createdProduct = getSuccessData(createRes);
    assertCondition(Boolean(createdProduct.id), "Created product missing id");
    cleanupProductId = createdProduct.id;
    record("productCrud", true, "Create product API returned 201 and persisted entity.");

    const listRes = await requestJson<SuccessEnvelope<Array<{ id: string; productCode: string }>>>(
      "GET",
      "/products"
    );
    assertCondition(listRes.status === 200, `List products expected 200, got ${listRes.status}`);
    const listProducts = getSuccessData(listRes);
    assertCondition(
      Boolean(listProducts.some((product) => product.productCode === productCode)),
      "Created product not found in product listing"
    );
    record("productCrud", true, "Fetch products API returned created product.");

    const duplicateRes = await requestJson("POST", "/products", {
      productCode,
      name: "QA Product Duplicate",
      price: 10
    });
    assertCondition(duplicateRes.status === 400, `Duplicate product expected 400, got ${duplicateRes.status}`);
    record("productCrud", true, "Unique productCode constraint enforced at API level.");

    const updateRes = await requestJson<SuccessEnvelope<{ quantity: number; price: string }>>(
      "PUT",
      `/products/${cleanupProductId}`,
      {
        quantity: 18,
        price: 44.5
      }
    );
    assertCondition(updateRes.status === 200, `Update product expected 200, got ${updateRes.status}`);
    const updatedProduct = getSuccessData(updateRes);
    assertCondition(updatedProduct.quantity === 18, "Updated quantity was not persisted correctly");
    record("productCrud", true, "Update product API persisted mutable fields.");

    console.log("Running Inventory Logic tests...");
    const inventoryCases = [
      { type: "SALE", quantity: 3, expected: 15, referenceId: "QA-SALE-001" },
      { type: "PURCHASE", quantity: 4, expected: 19, referenceId: "QA-PUR-001" },
      { type: "WIP_RAW", quantity: 2, expected: 17, referenceId: "QA-WIPRAW-001" },
      { type: "WIP_OUTPUT", quantity: 5, expected: 22, referenceId: "QA-WIPOUT-001" }
    ] as const;

    for (const testCase of inventoryCases) {
      const inventoryRes = await requestJson<SuccessEnvelope<{ newQuantity: number }>>(
        "POST",
        "/inventory/update",
        {
        productCode,
        type: testCase.type,
        quantity: testCase.quantity,
        referenceId: testCase.referenceId
        }
      );

      assertCondition(
        inventoryRes.status === 200,
        `${testCase.type} expected 200, got ${inventoryRes.status}`
      );
      const inventoryResult = getSuccessData(inventoryRes);
      assertCondition(
        inventoryResult.newQuantity === testCase.expected,
        `${testCase.type} expected quantity ${testCase.expected}, got ${inventoryResult.newQuantity}`
      );
    }
    record("inventoryLogic", true, "SALE, PURCHASE, WIP_RAW, and WIP_OUTPUT stock math is correct.");

    console.log("Running Inventory Logs tests...");
    const logRows = await db
      .select({ changeType: inventoryLogs.changeType, referenceId: inventoryLogs.referenceId })
      .from(inventoryLogs)
      .where(eq(inventoryLogs.productId, String(cleanupProductId)));

    const expectedTypes = new Set<"SALE" | "PURCHASE" | "WIP_RAW" | "WIP_OUTPUT">([
      "SALE",
      "PURCHASE",
      "WIP_RAW",
      "WIP_OUTPUT"
    ]);
    const actualTypes = new Set(logRows.map((row) => row.changeType));
    assertCondition(logRows.length >= 4, "Expected at least 4 inventory log entries");
    for (const type of expectedTypes) {
      assertCondition(actualTypes.has(type), `Missing inventory log type: ${type}`);
    }
    assertCondition(
      logRows.some((row) => Boolean(row.referenceId)),
      "Reference IDs were not persisted in logs"
    );
    record("inventoryLogs", true, "Inventory logs captured each change type with reference IDs.");

    console.log("Running Transactions tests...");
    const [beforeFailedSale] = await db
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, String(cleanupProductId)))
      .limit(1);

    const [{ count: beforeLogCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryLogs)
      .where(eq(inventoryLogs.productId, String(cleanupProductId)));

    const failedSaleRes = await requestJson("POST", "/inventory/update", {
      productCode,
      type: "SALE",
      quantity: 10_000,
      referenceId: "QA-ROLLBACK-001"
    });

    assertCondition(
      failedSaleRes.status === 400,
      `Expected failed SALE to return 400, got ${failedSaleRes.status}`
    );

    const [afterFailedSale] = await db
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, String(cleanupProductId)))
      .limit(1);

    const [{ count: afterLogCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inventoryLogs)
      .where(eq(inventoryLogs.productId, String(cleanupProductId)));

    assertCondition(
      beforeFailedSale.quantity === afterFailedSale.quantity,
      "Quantity changed after failed transactional operation"
    );
    assertCondition(
      beforeLogCount === afterLogCount,
      "Inventory log count changed after failed transactional operation"
    );
    record("transactions", true, "Failed inventory updates rollback without partial writes.");

    console.log("Running Low Stock Alert tests...");
    const lowStockRes = await requestJson<SuccessEnvelope<{ newQuantity: number }>>(
      "POST",
      "/inventory/update",
      {
      productCode,
      type: "SALE",
      quantity: 13,
      referenceId: "QA-LOWSTOCK-001"
      }
    );

    assertCondition(lowStockRes.status === 200, `Low stock test expected 200, got ${lowStockRes.status}`);
    const lowStockResult = getSuccessData(lowStockRes);
    assertCondition(lowStockResult.newQuantity === 9, "Low stock quantity expectation mismatch");

    const [lowStockProduct] = await db
      .select({ quantity: products.quantity, lowStockThreshold: products.lowStockThreshold })
      .from(products)
      .where(eq(products.id, String(cleanupProductId)))
      .limit(1);

    assertCondition(
      lowStockProduct.quantity < lowStockProduct.lowStockThreshold,
      "Quantity did not drop below threshold in low stock scenario"
    );
    record("lowStockAlert", true, "Low stock scenario reached and warning path was exercised.");

    console.log("Running Performance tests...");
    const performanceDurations: number[] = [];

    for (let i = 0; i < 20; i += 1) {
      const perfRes = await requestJson("POST", "/inventory/update", {
        productCode,
        type: "PURCHASE",
        quantity: 1,
        referenceId: `QA-PERF-${i}`
      });
      performanceDurations.push(perfRes.durationMs);
      assertCondition(perfRes.status === 200, `Performance request ${i} failed with ${perfRes.status}`);
    }

    const maxDuration = Math.max(...performanceDurations);
    assertCondition(maxDuration < 3_000, `Performance max response ${maxDuration}ms exceeded 3000ms`);
    record(
      "performance",
      true,
      `20 updates executed. Max response time ${maxDuration}ms (target < 3000ms).`
    );

    console.log("Running Error Handling and API Endpoint tests...");
    const missingFieldsRes = await requestJson<ErrorEnvelope>("POST", "/products", {
      description: "missing required fields"
    });
    const invalidQtyRes = await requestJson<ErrorEnvelope>("POST", "/inventory/update", {
      productCode,
      type: "SALE",
      quantity: 0,
      referenceId: "QA-INVALID-QTY"
    });
    const invalidCodeRes = await requestJson<ErrorEnvelope>("POST", "/inventory/update", {
      productCode: "SKU-DOES-NOT-EXIST",
      type: "SALE",
      quantity: 1,
      referenceId: "QA-BAD-CODE"
    });

    const missingFieldsError = getErrorData(missingFieldsRes);
    const invalidQtyError = getErrorData(invalidQtyRes);
    const invalidCodeError = getErrorData(invalidCodeRes);

    record(
      "errorHandling",
      missingFieldsRes.status === 400,
      `Missing product fields returned status ${missingFieldsRes.status}.`
    );
    record(
      "errorHandling",
      invalidQtyRes.status === 400,
      `Invalid quantity returned status ${invalidQtyRes.status}.`
    );
    record(
      "errorHandling",
      invalidCodeRes.status === 404,
      `Invalid productCode returned status ${invalidCodeRes.status}.`
    );

    const specificErrorsCorrect =
      missingFieldsError.type === "VALIDATION_ERROR" &&
      invalidQtyError.type === "VALIDATION_ERROR" &&
      invalidCodeError.type === "NOT_FOUND";

    record(
      "errorHandling",
      specificErrorsCorrect,
      `Error types returned: missingFields=${missingFieldsError.type}, invalidQuantity=${invalidQtyError.type}, invalidProductCode=${invalidCodeError.type}.`
    );

    const productsEndpointRes = await requestJson<SuccessEnvelope<unknown>>("GET", "/products");
    const inventoryEndpointRes = await requestJson<SuccessEnvelope<unknown>>("POST", "/inventory/update", {
      productCode,
      type: "PURCHASE",
      quantity: 1,
      referenceId: "QA-ENDPOINT-001"
    });

    record(
      "apiEndpoints",
      productsEndpointRes.status === 200,
      `GET /products returned ${productsEndpointRes.status}.`
    );
    record(
      "apiEndpoints",
      inventoryEndpointRes.status === 200,
      `POST /inventory/update returned ${inventoryEndpointRes.status}.`
    );

    const deleteRes = await requestJson("DELETE", `/products/${cleanupProductId}`);
    assertCondition(deleteRes.status === 200, `Delete product expected 200, got ${deleteRes.status}`);
    cleanupProductId = null;
    record("productCrud", true, "Delete product API removed test product cleanly.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown test failure";

    for (const key of Object.keys(results) as TestSectionKey[]) {
      if (results[key].details.length === 0) {
        record(key, false, `Section aborted due to earlier failure: ${message}`);
      }
    }

    console.error("Test execution failed:", message);
  } finally {
    await writeReport();
    await stopTestServer();

    console.log("\n=== Inventory QA Summary ===");
    for (const [key, value] of Object.entries(results)) {
      console.log(`${key}: ${value.passed ? "PASSED" : "FAILED"}`);
      for (const detail of value.details) {
        console.log(`  - ${detail}`);
      }
    }
    console.log("Report written to inventory_test_report.md");
  }
};

void run();
