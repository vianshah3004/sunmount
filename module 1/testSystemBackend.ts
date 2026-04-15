import "dotenv/config";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { io as createSocketClient, Socket } from "socket.io-client";
import { sql } from "drizzle-orm";
import { app } from "./src/app";
import { initSocket } from "./src/common/socket";
import { db, pool, verifyDatabaseConnection } from "./src/db";
import { registerInventoryEventHandlers } from "./src/modules/inventory/inventory.events";

type SocketEventName = "inventory:update" | "low_stock" | "order:update" | "manufacturing:update";

type TestStatus = "PASS" | "FAIL";

type TestResult = {
  id: number;
  name: string;
  status: TestStatus;
  output: string;
};

type HttpResponse<T = unknown> = {
  status: number;
  durationMs: number;
  json: T | null;
  raw: string;
};

type SuccessEnvelope<T = unknown> = {
  success: true;
  message: string | null;
  data: T;
  meta: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  } | null;
  error: null;
};

type ErrorEnvelope = {
  success: false;
  message: string;
  data: null;
  error: {
    code: string;
    details: unknown[];
  };
};

const BASE_PREFIX = `E2E-${randomUUID().slice(0, 8)}`;
const SKU_RAW = `${BASE_PREFIX}-RAW`;
const SKU_FIN = `${BASE_PREFIX}-FIN`;
const BATCH_ID = `${BASE_PREFIX}-B1`;
const CUSTOMER_ID = `${BASE_PREFIX}-CUST-1`;
const SUPPLIER_ID = `${BASE_PREFIX}-SUP-1`;
const OMS_CUSTOMER_CODE = `${BASE_PREFIX}-OMS-CUST`;
const OMS_SUPPLIER_CODE = `${BASE_PREFIX}-OMS-SUP`;
const OMS_OWNER = `${BASE_PREFIX}-OMS-OWNER`;
const omsSeedSkus = Array.from({ length: 10 }, (_, index) =>
  `${BASE_PREFIX}-OMS-SKU-${String(index + 1).padStart(2, "0")}`
);

let testCounter = 0;
const testResults: TestResult[] = [];
let adapterTestCounter = 0;
const adapterTestResults: TestResult[] = [];

let server: Server | null = null;
let socketClient: Socket | null = null;
let baseUrl = "";

let rawProductId = "";
let finishedProductId = "";
let saleOrderId = "";
let purchaseOrderId = "";
let adapterBatchId = "";
let adapterOrderId = "";
let omsCustomerId = "";
let omsSupplierId = "";
let omsSaleOrderId = "";
let omsPurchaseOrderId = "";
let omsSeedProductIds: string[] = [];

const socketEvents: Record<SocketEventName, unknown[]> = {
  "inventory:update": [],
  low_stock: [],
  "order:update": [],
  "manufacturing:update": []
};

const pushResult = (name: string, status: TestStatus, output: string) => {
  testCounter += 1;
  testResults.push({
    id: testCounter,
    name,
    status,
    output
  });
  const icon = status === "PASS" ? "PASS" : "FAIL";
  console.log(`[${icon}] ${name}`);
};

const pushAdapterResult = (name: string, status: TestStatus, output: string) => {
  adapterTestCounter += 1;
  adapterTestResults.push({
    id: adapterTestCounter,
    name,
    status,
    output
  });
  const icon = status === "PASS" ? "PASS" : "FAIL";
  console.log(`[${icon}] [API-ADAPTER] ${name}`);
};

const formatOutput = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const assertTrue = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const truncate = (text: string, max = 1200) => (text.length <= max ? text : `${text.slice(0, max)} ...<truncated>`);

const requestJson = async <T = unknown>(method: string, path: string, body?: unknown): Promise<HttpResponse<T>> => {
  const started = Date.now();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const raw = await res.text();
  let json: T | null = null;
  if (raw) {
    try {
      json = JSON.parse(raw) as T;
    } catch {
      json = null;
    }
  }

  return {
    status: res.status,
    durationMs: Date.now() - started,
    json,
    raw
  };
};

const expectSuccess = <T>(response: HttpResponse<SuccessEnvelope<T>>) => {
  const payload = response.json;
  assertTrue(Boolean(payload), `Expected JSON response, got: ${response.raw}`);
  assertTrue((payload as SuccessEnvelope<T>).success === true, `Expected success=true, got: ${response.raw}`);
  return (payload as SuccessEnvelope<T>).data;
};

const expectError = (response: HttpResponse<ErrorEnvelope>) => {
  const payload = response.json;
  assertTrue(Boolean(payload), `Expected JSON error response, got: ${response.raw}`);
  assertTrue((payload as ErrorEnvelope).success === false, `Expected success=false, got: ${response.raw}`);
  return payload as ErrorEnvelope;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForEvent = async (eventName: SocketEventName, minCount: number, timeoutMs = 3000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (socketEvents[eventName].length >= minCount) {
      return true;
    }
    await wait(50);
  }
  return false;
};

const runTest = async (name: string, fn: () => Promise<unknown>) => {
  try {
    const output = await fn();
    pushResult(name, "PASS", truncate(formatOutput(output)));
  } catch (error) {
    pushResult(name, "FAIL", truncate((error as Error)?.stack ?? String(error)));
  }
};

const runAdapterTest = async (name: string, fn: () => Promise<unknown>) => {
  try {
    const output = await fn();
    pushAdapterResult(name, "PASS", truncate(formatOutput(output)));
  } catch (error) {
    pushAdapterResult(name, "FAIL", truncate((error as Error)?.stack ?? String(error)));
  }
};

const startSystem = async () => {
  server = createServer(app);
  initSocket(server);
  registerInventoryEventHandlers();

  await verifyDatabaseConnection();

  await new Promise<void>((resolve, reject) => {
    server?.once("error", reject);
    server?.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;

  socketClient = createSocketClient(baseUrl, {
    transports: ["websocket"],
    timeout: 5000
  });

  await new Promise<void>((resolve, reject) => {
    socketClient?.once("connect", () => resolve());
    socketClient?.once("connect_error", reject);
  });

  (Object.keys(socketEvents) as SocketEventName[]).forEach((eventName) => {
    socketClient?.on(eventName, (payload) => {
      socketEvents[eventName].push(payload);
    });
  });
};

const cleanupData = async () => {
  try {
    await db.execute(
      sql`delete from attachments where order_id in (select id from erp_orders where owner like ${`${BASE_PREFIX}%`})`
    );
    await db.execute(
      sql`delete from order_events where order_id in (select id from erp_orders where owner like ${`${BASE_PREFIX}%`} or notes like ${`${BASE_PREFIX}%`})`
    );
    await db.execute(sql`delete from erp_orders where owner like ${`${BASE_PREFIX}%`} or notes like ${`${BASE_PREFIX}%`}`);
    await db.execute(sql`delete from customers where customer_code like ${`${BASE_PREFIX}%`}`);
    await db.execute(sql`delete from suppliers where supplier_code like ${`${BASE_PREFIX}%`}`);
  } catch {
    // OMS tables may be unavailable before migrations are applied.
  }
  await db.execute(sql`delete from manufacturing_batches where batch_number like ${`${BASE_PREFIX}%`}`);
  await db.execute(sql`delete from orders where party_id like ${`${BASE_PREFIX}%`}`);
  await db.execute(sql`delete from products where product_code like ${`${BASE_PREFIX}%`}`);
};

const shutdown = async () => {
  try {
    socketClient?.disconnect();
  } catch {}

  try {
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
  } finally {
    await pool.end();
  }
};

const generateReport = async () => {
  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;

  const endpointMap = [
    "GET /health",
    "GET /api/settings",
    "PUT /api/settings",
    "GET /api/settings/health",
    "GET /api/entities",
    "GET /api/entities/:id",
    "GET /api/entities/lookup/:entityCode",
    "GET /api/customers/:customerId",
    "GET /api/suppliers/:supplierId",
    "POST /api/orders/from-entity/:id",
    "POST /products",
    "GET /products",
    "GET /products/:id",
    "PUT /products/:id",
    "DELETE /products/:id",
    "POST /inventory/update",
    "POST /orders",
    "GET /orders",
    "GET /orders/:id",
    "PUT /orders/:id",
    "DELETE /orders/:id",
    "POST /orders/v2",
    "GET /orders/v2",
    "GET /orders/v2/:id",
    "PUT /orders/v2/:id/items",
    "PUT /orders/v2/:id/status",
    "POST /manufacturing",
    "GET /manufacturing",
    "GET /manufacturing/:id",
    "PUT /manufacturing/:id",
    "PUT /manufacturing/:id/status",
    "POST /manufacturing/:id/complete",
    "DELETE /manufacturing/:id",
    "GET /history",
    "GET /dashboard/summary",
    "GET /lookup/products",
    "GET /lookup/customers",
    "GET /lookup/suppliers",
    "GET /ai/reorder/:productId",
    "POST /ai/query",
    "GET /ai/insights"
  ];

  const socketMap = ["inventory:update", "low_stock", "order:update", "manufacturing:update"];
  const aiFunctions = ["getReorderSuggestion", "processUserQuery", "generateInsights"];
  const inventoryLogic = [
    "SALE decrements stock",
    "PURCHASE increments stock",
    "DISPATCHED applies SALE inventory once",
    "COMPLETED purchase applies PURCHASE inventory once",
    "WIP completion decrements raw and increments finished",
    "history filters include sale/purchase/manufacturing"
  ];

  const lines: string[] = [];
  lines.push("# Backend E2E Test Report");
  lines.push("");
  lines.push(`- Run ID: ${BASE_PREFIX}`);
  lines.push(`- Generated At: ${new Date().toISOString()}`);
  lines.push(`- Overall Result: ${failed === 0 ? "PASS" : "FAIL"}`);
  lines.push(`- Total Tests: ${testResults.length}`);
  lines.push(`- Passed: ${passed}`);
  lines.push(`- Failed: ${failed}`);
  lines.push("");

  lines.push("## Step 1 - System Understanding");
  lines.push("");
  lines.push("### API Endpoints Identified");
  endpointMap.forEach((e) => lines.push(`- ${e}`));
  lines.push("");

  lines.push("### Socket Events Identified");
  socketMap.forEach((e) => lines.push(`- ${e}`));
  lines.push("");

  lines.push("### AI Functions Identified");
  aiFunctions.forEach((f) => lines.push(`- ${f}`));
  lines.push("");

  lines.push("### Inventory Update Logic Identified");
  inventoryLogic.forEach((i) => lines.push(`- ${i}`));
  lines.push("");

  lines.push("## Step 2 - Full System Flow Execution");
  lines.push("");
  lines.push("### Socket Event Capture Counts");
  (Object.keys(socketEvents) as SocketEventName[]).forEach((key) => {
    lines.push(`- ${key}: ${socketEvents[key].length}`);
  });
  lines.push("");

  lines.push("## Test Results (Pass and Fail with Output)");
  lines.push("");
  testResults.forEach((result) => {
    lines.push(`### ${result.id}. ${result.name}`);
    lines.push(`- Status: ${result.status}`);
    lines.push("- Output:");
    lines.push("```text");
    lines.push(result.output || "(no output)");
    lines.push("```");
    lines.push("");
  });

  if (failed > 0) {
    lines.push("## Failed Test Summary");
    lines.push("");
    testResults
      .filter((r) => r.status === "FAIL")
      .forEach((r) => lines.push(`- [FAIL] ${r.name}`));
    lines.push("");
  }

  await writeFile("backend_e2e_test_report.md", lines.join("\n"), "utf8");
};

const generateAdapterReport = async () => {
  const passed = adapterTestResults.filter((r) => r.status === "PASS").length;
  const failed = adapterTestResults.filter((r) => r.status === "FAIL").length;

  const lines: string[] = [];
  lines.push("# API Adapter Contract Compliance Report");
  lines.push("");
  lines.push(`- Run ID: ${BASE_PREFIX}`);
  lines.push(`- Generated At: ${new Date().toISOString()}`);
  lines.push(`- Overall Result: ${failed === 0 ? "PASS" : "FAIL"}`);
  lines.push(`- Total Adapter Tests: ${adapterTestResults.length}`);
  lines.push(`- Passed: ${passed}`);
  lines.push(`- Failed: ${failed}`);
  lines.push("");

  lines.push("## Contract Endpoints Covered");
  lines.push("- GET /api/inventory");
  lines.push("- PATCH /api/inventory/:id/quantity");
  lines.push("- GET /api/sales/orders");
  lines.push("- GET /api/sales/orders/:id/lines");
  lines.push("- PUT /api/sales/orders/:id/lines");
  lines.push("- POST /api/sales/orders/:id/finalize-dispatch");
  lines.push("- GET /api/purchase/orders");
  lines.push("- GET /api/purchase/orders/:id/lines");
  lines.push("- PUT /api/purchase/orders/:id/lines");
  lines.push("- POST /api/purchase/orders/:id/complete");
  lines.push("- GET /api/manufacturing/batches");
  lines.push("- PATCH /api/manufacturing/batches/:id");
  lines.push("- DELETE /api/manufacturing/batches/:id");
  lines.push("- POST /api/manufacturing/batches/:id/complete");
  lines.push("- GET /api/history");
  lines.push("- PATCH /api/history/:id");
  lines.push("- POST /api/history/:id/next-stage");
  lines.push("- DELETE /api/history/:id");
  lines.push("- GET /api/dashboard/metrics");
  lines.push("- GET /api/entities");
  lines.push("- GET /api/entities/:id");
  lines.push("- GET /api/entities/lookup/:entityCode");
  lines.push("");

  lines.push("## Adapter Test Results");
  lines.push("");
  adapterTestResults.forEach((result) => {
    lines.push(`### ${result.id}. ${result.name}`);
    lines.push(`- Status: ${result.status}`);
    lines.push("- Output:");
    lines.push("```text");
    lines.push(result.output || "(no output)");
    lines.push("```");
    lines.push("");
  });

  await writeFile("api_adapter_contract_report.md", lines.join("\n"), "utf8");
};

const main = async () => {
  try {
    await cleanupData();
    await startSystem();

    await runTest("Health endpoint returns success envelope", async () => {
      const res = await requestJson<SuccessEnvelope<{ status: string; timestamp: string }>>("GET", "/health");
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(data.status === "ok", `Unexpected health status: ${data.status}`);
      return { status: res.status, body: res.json };
    });

    await runTest("Seed OMS v2 master data and 10 dummy products", async () => {
      omsCustomerId = randomUUID();
      omsSupplierId = randomUUID();

      await db.execute(sql`
        insert into customers (id, customer_code, name, email)
        values (${omsCustomerId}, ${OMS_CUSTOMER_CODE}, ${`${BASE_PREFIX} OMS Customer`}, ${`${BASE_PREFIX}-customer@example.com`})
      `);

      await db.execute(sql`
        insert into suppliers (id, supplier_code, name, email)
        values (${omsSupplierId}, ${OMS_SUPPLIER_CODE}, ${`${BASE_PREFIX} OMS Supplier`}, ${`${BASE_PREFIX}-supplier@example.com`})
      `);

      const productIds: string[] = [];

      for (const [index, sku] of omsSeedSkus.entries()) {
        const createRes = await requestJson<SuccessEnvelope<{ id: string }>>("POST", "/products", {
          sku,
          name: `${BASE_PREFIX} OMS Product ${index + 1}`,
          description: `OMS seed product ${index + 1}`,
          price: 100 + index * 10,
          quantity: 150 + index,
          lowStockThreshold: 5,
          unit: "pcs"
        });
        assertTrue(createRes.status === 201, `Expected 201 for ${sku}, got ${createRes.status}`);
        productIds.push(expectSuccess(createRes).id);
      }

      omsSeedProductIds = productIds;

      return {
        customerId: omsCustomerId,
        supplierId: omsSupplierId,
        seededProducts: omsSeedProductIds.length
      };
    });

    await runTest("Sunmount entities and settings endpoints", async () => {
      const entitiesRes = await requestJson<
        SuccessEnvelope<Array<{ id: string; entityCode: string; type: string; name: string }>>
      >("GET", "/api/entities?page=1&limit=20&sort=updatedAt&order=desc");
      assertTrue(entitiesRes.status === 200, `Expected 200, got ${entitiesRes.status}`);
      const entities = expectSuccess(entitiesRes);
      assertTrue(entities.some((entity) => entity.entityCode === OMS_CUSTOMER_CODE), "Customer entity missing");
      assertTrue(entities.some((entity) => entity.entityCode === OMS_SUPPLIER_CODE), "Supplier entity missing");

      const lookupCustomerRes = await requestJson<
        SuccessEnvelope<{ entityCode: string; entityName: string; entityType: string; id: string }>
      >("GET", `/api/entities/lookup/${OMS_CUSTOMER_CODE}`);
      assertTrue(lookupCustomerRes.status === 200, `Expected 200, got ${lookupCustomerRes.status}`);
      const lookupCustomer = expectSuccess(lookupCustomerRes);
      assertTrue(lookupCustomer.entityType === "Customer", `Expected Customer, got ${lookupCustomer.entityType}`);

      const customerRes = await requestJson<SuccessEnvelope<{ id: string; entityCode: string }>>(
        "GET",
        `/api/customers/${OMS_CUSTOMER_CODE}`
      );
      assertTrue(customerRes.status === 200, `Expected 200, got ${customerRes.status}`);
      const customer = expectSuccess(customerRes);
      assertTrue(customer.entityCode === OMS_CUSTOMER_CODE, "Customer code mismatch");

      const supplierRes = await requestJson<SuccessEnvelope<{ id: string; entityCode: string }>>(
        "GET",
        `/api/suppliers/${OMS_SUPPLIER_CODE}`
      );
      assertTrue(supplierRes.status === 200, `Expected 200, got ${supplierRes.status}`);
      const supplier = expectSuccess(supplierRes);
      assertTrue(supplier.entityCode === OMS_SUPPLIER_CODE, "Supplier code mismatch");

      const orderDraftRes = await requestJson<
        SuccessEnvelope<{ draftId: string; orderReference: string; type: string; entity: { type: string } }>
      >("POST", `/api/orders/from-entity/${omsCustomerId}`);
      assertTrue(orderDraftRes.status === 201, `Expected 201, got ${orderDraftRes.status}`);
      const orderDraft = expectSuccess(orderDraftRes);
      assertTrue(orderDraft.type === "SALE", `Expected SALE, got ${orderDraft.type}`);
      assertTrue(orderDraft.entity.type === "Customer", `Expected Customer draft, got ${orderDraft.entity.type}`);
      assertTrue(orderDraft.orderReference.startsWith("SALE-"), `Unexpected reference ${orderDraft.orderReference}`);

      const settingsRes = await requestJson<
        SuccessEnvelope<{
          organization: string;
          primaryContactEmail: string;
          currency: string;
          timezone: string;
          notificationsEnabled: boolean;
          securityFlags: Record<string, unknown>;
          sync: Record<string, unknown>;
        }>
      >("GET", "/api/settings");
      assertTrue(settingsRes.status === 200, `Expected 200, got ${settingsRes.status}`);
      const settingsData = expectSuccess(settingsRes);
      assertTrue(
        typeof settingsData.organization === "string" && settingsData.organization.trim().length > 0,
        "Expected non-empty organization"
      );

      const updatedSettingsRes = await requestJson<SuccessEnvelope<{ currency: string; sync: Record<string, unknown> }>>(
        "PUT",
        "/api/settings",
        {
          currency: "USD",
          notificationsEnabled: false,
          securityFlags: {
            sharedLoginEnabled: true
          },
          sync: {
            status: "Degraded",
            apiLatencyMs: 250
          }
        }
      );
      assertTrue(updatedSettingsRes.status === 200, `Expected 200, got ${updatedSettingsRes.status}`);
      const updatedSettings = expectSuccess(updatedSettingsRes);
      assertTrue(updatedSettings.currency === "USD", "Settings currency did not update");

      const healthRes = await requestJson<SuccessEnvelope<{ status: string; sync: Record<string, unknown> }>>(
        "GET",
        "/api/settings/health"
      );
      assertTrue(healthRes.status === 200, `Expected 200, got ${healthRes.status}`);
      const health = expectSuccess(healthRes);
      assertTrue(health.status === "OK", `Expected OK, got ${health.status}`);

      await requestJson<SuccessEnvelope<unknown>>("PUT", "/api/settings", {
        currency: "INR",
        notificationsEnabled: true,
        securityFlags: {
          sharedLoginEnabled: false
        },
        sync: {
          status: "Live",
          apiLatencyMs: 118
        }
      });

      return {
        entityCount: entities.length,
        draftType: orderDraft.type,
        healthStatus: health.status,
        currency: updatedSettings.currency
      };
    });

    await runTest("OMS v2 endpoints create/list/get/update-items/update-status", async () => {
      const saleItems = omsSeedSkus.map((sku, index) => ({
        productCode: sku,
        quantity: 1,
        unitPrice: 100 + index * 10,
        discountAmount: 0,
        taxRate: 18
      }));

      const purchaseItems = omsSeedSkus.map((sku, index) => ({
        productCode: sku,
        quantity: 2,
        unitPrice: 95 + index * 10,
        discountAmount: 0,
        taxRate: 18
      }));

      const createSaleRes = await requestJson<
        SuccessEnvelope<{ id: string; status: string; items: Array<{ productId: string }> }>
      >("POST", "/orders/v2", {
        type: "SALE",
        customerId: omsCustomerId,
        owner: OMS_OWNER,
        notes: `${BASE_PREFIX} OMS SALE ORDER`,
        isDraft: false,
        items: saleItems
      });
      assertTrue(createSaleRes.status === 201, `Expected 201, got ${createSaleRes.status}`);
      const createdSale = expectSuccess(createSaleRes);
      omsSaleOrderId = createdSale.id;
      assertTrue(createdSale.items.length === 10, `Expected 10 sale items, got ${createdSale.items.length}`);

      const createPurchaseRes = await requestJson<
        SuccessEnvelope<{ id: string; status: string; items: Array<{ productId: string }> }>
      >("POST", "/orders/v2", {
        type: "PURCHASE",
        supplierId: omsSupplierId,
        owner: OMS_OWNER,
        notes: `${BASE_PREFIX} OMS PURCHASE ORDER`,
        isDraft: false,
        items: purchaseItems
      });
      assertTrue(createPurchaseRes.status === 201, `Expected 201, got ${createPurchaseRes.status}`);
      const createdPurchase = expectSuccess(createPurchaseRes);
      omsPurchaseOrderId = createdPurchase.id;
      assertTrue(
        createdPurchase.items.length === 10,
        `Expected 10 purchase items, got ${createdPurchase.items.length}`
      );

      const listRes = await requestJson<SuccessEnvelope<Array<{ id: string; owner: string }>>>(
        "GET",
        `/orders/v2?page=1&pageSize=100&search=${encodeURIComponent(BASE_PREFIX)}`
      );
      assertTrue(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const listed = expectSuccess(listRes);
      assertTrue(listed.some((row) => row.id === omsSaleOrderId), "OMS sale order missing in list");
      assertTrue(listed.some((row) => row.id === omsPurchaseOrderId), "OMS purchase order missing in list");

      const saleDetailRes = await requestJson<SuccessEnvelope<{ id: string; items: Array<{ sku: string }> }>>(
        "GET",
        `/orders/v2/${omsSaleOrderId}`
      );
      assertTrue(saleDetailRes.status === 200, `Expected 200, got ${saleDetailRes.status}`);
      const saleDetail = expectSuccess(saleDetailRes);
      assertTrue(saleDetail.items.length === 10, `Expected 10 items in sale detail, got ${saleDetail.items.length}`);

      const updateItemsRes = await requestJson<
        SuccessEnvelope<{ id: string; items: Array<{ sku: string; quantity: number }> }>
      >("PUT", `/orders/v2/${omsSaleOrderId}/items`, {
        items: omsSeedSkus.map((sku, index) => ({
          productCode: sku,
          quantity: 2,
          unitPrice: 110 + index * 5,
          discountAmount: 0,
          taxRate: 18
        }))
      });
      assertTrue(updateItemsRes.status === 200, `Expected 200, got ${updateItemsRes.status}`);
      const updatedItems = expectSuccess(updateItemsRes);
      assertTrue(updatedItems.items.length === 10, `Expected 10 updated items, got ${updatedItems.items.length}`);

      const transitionSaleToApproved = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsSaleOrderId}/status`,
        { toStatus: "APPROVED", actor: "e2e" }
      );
      assertTrue(transitionSaleToApproved.status === 200, `Expected 200, got ${transitionSaleToApproved.status}`);

      const transitionSaleToPacking = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsSaleOrderId}/status`,
        { toStatus: "PACKING", actor: "e2e" }
      );
      assertTrue(transitionSaleToPacking.status === 200, `Expected 200, got ${transitionSaleToPacking.status}`);

      const transitionSaleToDispatched = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsSaleOrderId}/status`,
        { toStatus: "DISPATCHED", actor: "e2e" }
      );
      assertTrue(transitionSaleToDispatched.status === 200, `Expected 200, got ${transitionSaleToDispatched.status}`);
      assertTrue(
        expectSuccess(transitionSaleToDispatched).status === "DISPATCHED",
        "OMS sale order did not reach DISPATCHED"
      );

      const transitionPurchaseToApproved = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsPurchaseOrderId}/status`,
        { toStatus: "APPROVED", actor: "e2e" }
      );
      assertTrue(
        transitionPurchaseToApproved.status === 200,
        `Expected 200, got ${transitionPurchaseToApproved.status}`
      );

      const transitionPurchaseToPacking = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsPurchaseOrderId}/status`,
        { toStatus: "PACKING", actor: "e2e" }
      );
      assertTrue(
        transitionPurchaseToPacking.status === 200,
        `Expected 200, got ${transitionPurchaseToPacking.status}`
      );

      const transitionPurchaseToDispatched = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsPurchaseOrderId}/status`,
        { toStatus: "DISPATCHED", actor: "e2e" }
      );
      assertTrue(
        transitionPurchaseToDispatched.status === 200,
        `Expected 200, got ${transitionPurchaseToDispatched.status}`
      );

      const transitionPurchaseToCompleted = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/v2/${omsPurchaseOrderId}/status`,
        { toStatus: "COMPLETED", actor: "e2e" }
      );
      assertTrue(
        transitionPurchaseToCompleted.status === 200,
        `Expected 200, got ${transitionPurchaseToCompleted.status}`
      );
      assertTrue(
        expectSuccess(transitionPurchaseToCompleted).status === "COMPLETED",
        "OMS purchase order did not reach COMPLETED"
      );

      const inventoryCheckRes = await requestJson<SuccessEnvelope<{ quantity: number }>>(
        "GET",
        `/products/${omsSeedProductIds[0]}`
      );
      assertTrue(inventoryCheckRes.status === 200, `Expected 200, got ${inventoryCheckRes.status}`);
      const inventoryCheck = expectSuccess(inventoryCheckRes);
      assertTrue(
        inventoryCheck.quantity === 150,
        `Expected OMS seeded product quantity 150 after transitions, got ${inventoryCheck.quantity}`
      );

      return {
        omsSaleOrderId,
        omsPurchaseOrderId,
        seededItemsEachOrder: 10,
        sampleQuantityAfterTransitions: inventoryCheck.quantity
      };
    });

    await runTest("Create raw product", async () => {
      const res = await requestJson<SuccessEnvelope<{ id: string }>>("POST", "/products", {
        sku: SKU_RAW,
        name: `${BASE_PREFIX} Raw Material`,
        description: "Raw material for manufacturing",
        weight: 1,
        price: 100,
        quantity: 100,
        lowStockThreshold: 15,
        unit: "pcs"
      });
      assertTrue(res.status === 201, `Expected 201, got ${res.status}`);
      const data = expectSuccess(res);
      rawProductId = data.id;
      return { status: res.status, productId: rawProductId, body: res.json };
    });

    await runTest("Create finished product", async () => {
      const res = await requestJson<SuccessEnvelope<{ id: string }>>("POST", "/products", {
        sku: SKU_FIN,
        name: `${BASE_PREFIX} Finished Good`,
        description: "Finished product",
        weight: 0.5,
        price: 250,
        quantity: 10,
        lowStockThreshold: 5,
        unit: "pcs"
      });
      assertTrue(res.status === 201, `Expected 201, got ${res.status}`);
      const data = expectSuccess(res);
      finishedProductId = data.id;
      return { status: res.status, productId: finishedProductId, body: res.json };
    });

    await runTest("Product list and search include created SKUs", async () => {
      const listRes = await requestJson<SuccessEnvelope<Array<{ sku: string }>>>("GET", "/products?page=1&limit=50");
      assertTrue(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const data = expectSuccess(listRes);
      const skus = data.map((p) => p.sku);
      assertTrue(skus.includes(SKU_RAW), `${SKU_RAW} missing in list`);
      assertTrue(skus.includes(SKU_FIN), `${SKU_FIN} missing in list`);

      const searchRes = await requestJson<SuccessEnvelope<Array<{ sku: string }>>>(
        "GET",
        `/products?page=1&limit=20&q=${encodeURIComponent(BASE_PREFIX)}`
      );
      assertTrue(searchRes.status === 200, `Expected 200, got ${searchRes.status}`);
      const searchData = expectSuccess(searchRes);
      assertTrue(searchData.length >= 2, "Expected at least 2 products in search");

      return {
        listCount: data.length,
        searchCount: searchData.length
      };
    });

    await runTest("Product detail and update works", async () => {
      const getRes = await requestJson<SuccessEnvelope<{ id: string; sku: string; quantity: number }>>(
        "GET",
        `/products/${rawProductId}`
      );
      assertTrue(getRes.status === 200, `Expected 200, got ${getRes.status}`);
      const before = expectSuccess(getRes);
      assertTrue(before.sku === SKU_RAW, `Expected SKU ${SKU_RAW}, got ${before.sku}`);

      const updateRes = await requestJson<SuccessEnvelope<{ quantity: number }>>("PUT", `/products/${rawProductId}`, {
        quantity: 110
      });
      assertTrue(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
      const updated = expectSuccess(updateRes);
      assertTrue(updated.quantity === 110, `Expected quantity 110, got ${updated.quantity}`);
      return { beforeQty: before.quantity, afterQty: updated.quantity };
    });

    await runTest("Direct inventory update applies PURCHASE increment", async () => {
      const res = await requestJson<SuccessEnvelope<{ newQuantity: number }>>("POST", "/inventory/update", {
        productCode: SKU_FIN,
        type: "PURCHASE",
        quantity: 2,
        referenceId: `${BASE_PREFIX}-INV-1`
      });
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(data.newQuantity === 12, `Expected finished quantity 12, got ${data.newQuantity}`);
      return { status: res.status, body: res.json };
    });

    await runTest("Sales order create and dispatch updates inventory once", async () => {
      const createRes = await requestJson<SuccessEnvelope<{ id: string; status: string }>>("POST", "/orders", {
        type: "SALE",
        partyId: CUSTOMER_ID,
        products: [{ productCode: SKU_FIN, quantity: 3, price: 250 }],
        notes: "sale flow"
      });
      assertTrue(createRes.status === 201, `Expected 201, got ${createRes.status}`);
      const order = expectSuccess(createRes);
      saleOrderId = order.id;

      const updateRes = await requestJson<SuccessEnvelope<{ id: string; items: Array<{ productCode: string; quantity: number }> }>>("PUT", `/orders/${saleOrderId}`, {
        products: [{ productCode: SKU_FIN, quantity: 4, price: 250 }],
        notes: "sale flow edited"
      });
      assertTrue(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
      const updatedOrder = expectSuccess(updateRes);
      assertTrue(updatedOrder.items[0].quantity === 4, `Expected updated quantity 4, got ${updatedOrder.items[0].quantity}`);

      const dispatchRes = await requestJson<SuccessEnvelope<{ status: string; inventoryApplied: boolean }>>(
        "PUT",
        `/orders/${saleOrderId}`,
        { status: "DISPATCHED" }
      );
      assertTrue(dispatchRes.status === 200, `Expected 200, got ${dispatchRes.status}`);
      const dispatched = expectSuccess(dispatchRes);
      assertTrue(dispatched.status === "DISPATCHED", `Expected DISPATCHED, got ${dispatched.status}`);

      const afterFirst = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${finishedProductId}`);
      const firstQty = expectSuccess(afterFirst).quantity;
      assertTrue(firstQty === 8, `Expected 8 after dispatch, got ${firstQty}`);

      const dispatchAgainRes = await requestJson<SuccessEnvelope<{ inventoryApplied: boolean }>>(
        "PUT",
        `/orders/${saleOrderId}`,
        { status: "DISPATCHED" }
      );
      assertTrue(dispatchAgainRes.status === 200, `Expected 200, got ${dispatchAgainRes.status}`);

      const afterSecond = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${finishedProductId}`);
      const secondQty = expectSuccess(afterSecond).quantity;
      assertTrue(secondQty === 8, `Inventory applied twice unexpectedly; quantity=${secondQty}`);

      return {
        orderId: saleOrderId,
        firstQty,
        secondQty,
        body: dispatchRes.json,
        updatedOrder
      };
    });

    await runTest("Purchase order completion increments inventory once", async () => {
      const createRes = await requestJson<SuccessEnvelope<{ id: string }>>("POST", "/orders", {
        type: "PURCHASE",
        partyId: SUPPLIER_ID,
        products: [{ productCode: SKU_RAW, quantity: 7, price: 90 }],
        notes: "purchase flow"
      });
      assertTrue(createRes.status === 201, `Expected 201, got ${createRes.status}`);
      purchaseOrderId = expectSuccess(createRes).id;

      const completeRes = await requestJson<SuccessEnvelope<{ status: string }>>(
        "PUT",
        `/orders/${purchaseOrderId}`,
        { status: "COMPLETED" }
      );
      assertTrue(completeRes.status === 200, `Expected 200, got ${completeRes.status}`);
      const completed = expectSuccess(completeRes);
      assertTrue(completed.status === "COMPLETED", `Expected COMPLETED, got ${completed.status}`);

      const rawRes = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${rawProductId}`);
      const qtyAfterFirst = expectSuccess(rawRes).quantity;
      assertTrue(qtyAfterFirst === 117, `Expected raw quantity 117, got ${qtyAfterFirst}`);

      await requestJson<SuccessEnvelope<{ status: string }>>("PUT", `/orders/${purchaseOrderId}`, {
        status: "COMPLETED"
      });

      const rawAgain = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${rawProductId}`);
      const qtyAfterSecond = expectSuccess(rawAgain).quantity;
      assertTrue(qtyAfterSecond === 117, `Purchase inventory applied twice unexpectedly; qty=${qtyAfterSecond}`);

      return { orderId: purchaseOrderId, qtyAfterFirst, qtyAfterSecond };
    });

    await runTest("Manufacturing create, update, complete adjusts raw/finished inventory", async () => {
      const rawBeforeRes = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${rawProductId}`);
      const finBeforeRes = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${finishedProductId}`);
      assertTrue(rawBeforeRes.status === 200, `Expected 200, got ${rawBeforeRes.status}`);
      assertTrue(finBeforeRes.status === 200, `Expected 200, got ${finBeforeRes.status}`);
      const rawBefore = expectSuccess(rawBeforeRes).quantity;
      const finBefore = expectSuccess(finBeforeRes).quantity;

      const createRes = await requestJson<SuccessEnvelope<{ id: string; status: string }>>("POST", "/manufacturing", {
        batchNumber: BATCH_ID,
        rawMaterials: [{ productCode: SKU_RAW, quantity: 20 }],
        outputProducts: [{ productCode: SKU_FIN, quantity: 15 }],
        notes: "manufacturing flow"
      });
      assertTrue(createRes.status === 201, `Expected 201, got ${createRes.status}`);
      const created = expectSuccess(createRes);
      assertTrue(created.id === BATCH_ID, `Unexpected batch id ${created.id}`);

      const updateRes = await requestJson<SuccessEnvelope<{ notes: string }>>("PUT", `/manufacturing/${BATCH_ID}`, {
        notes: "updated note"
      });
      assertTrue(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);

      const completeRes = await requestJson<SuccessEnvelope<{ status: string; progress: number }>>(
        "POST",
        `/manufacturing/${BATCH_ID}/complete`
      );
      assertTrue(completeRes.status === 200, `Expected 200, got ${completeRes.status}`);
      const completed = expectSuccess(completeRes);
      assertTrue(completed.status === "COMPLETED", `Expected COMPLETED, got ${completed.status}`);
      assertTrue(completed.progress === 100, `Expected progress 100, got ${completed.progress}`);

      const rawRes = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${rawProductId}`);
      const finRes = await requestJson<SuccessEnvelope<{ quantity: number }>>("GET", `/products/${finishedProductId}`);
      const rawQty = expectSuccess(rawRes).quantity;
      const finQty = expectSuccess(finRes).quantity;

      assertTrue(rawQty === rawBefore - 20, `Expected raw quantity ${rawBefore - 20}, got ${rawQty}`);
      assertTrue(finQty === finBefore + 15, `Expected finished quantity ${finBefore + 15}, got ${finQty}`);

      return { batch: BATCH_ID, rawQty, finQty };
    });

    await runTest("Orders list/detail endpoint", async () => {
      const listRes = await requestJson<SuccessEnvelope<Array<{ id: string; statusLabel: string }>>>(
        "GET",
        "/orders?page=1&pageSize=20"
      );
      assertTrue(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const listData = expectSuccess(listRes);
      assertTrue(listData.some((o) => o.id === saleOrderId), "Sales order missing in list");

      const detailRes = await requestJson<SuccessEnvelope<{ id: string; currencyFormattedTotal: string }>>(
        "GET",
        `/orders/${saleOrderId}`
      );
      assertTrue(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
      const detail = expectSuccess(detailRes);
      assertTrue(detail.id === saleOrderId, "Order detail mismatch");
      assertTrue(detail.currencyFormattedTotal.startsWith("₹"), "Missing INR format");

      return {
        orderId: saleOrderId,
        statusLabel: listData.find((o) => o.id === saleOrderId)?.statusLabel ?? null,
        formattedTotal: detail.currencyFormattedTotal
      };
    });

    await runTest("Manufacturing list/detail and delete endpoint", async () => {
      const listRes = await requestJson<SuccessEnvelope<Array<{ batchNumber: string }>>>(
        "GET",
        "/manufacturing?page=1&pageSize=20"
      );
      assertTrue(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const listData = expectSuccess(listRes);
      assertTrue(listData.some((b) => b.batchNumber === BATCH_ID), "Batch missing in list");

      const detailRes = await requestJson<SuccessEnvelope<{ id: string; status: string }>>(
        "GET",
        `/manufacturing/${BATCH_ID}`
      );
      assertTrue(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
      const detail = expectSuccess(detailRes);
      assertTrue(detail.id === BATCH_ID, `Expected ${BATCH_ID}, got ${detail.id}`);

      const deleteRes = await requestJson<SuccessEnvelope<{ batchNumber: string }>>(
        "DELETE",
        `/manufacturing/${BATCH_ID}`
      );
      assertTrue(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);
      const deleted = expectSuccess(deleteRes);
      assertTrue(deleted.batchNumber === BATCH_ID, "Delete batch response mismatch");

      const getDeleted = await requestJson<ErrorEnvelope>("GET", `/manufacturing/${BATCH_ID}`);
      assertTrue(getDeleted.status === 404, `Expected 404, got ${getDeleted.status}`);

      return {
        deletedBatch: BATCH_ID,
        body: deleteRes.json
      };
    });

    await runTest("History filters return sale, purchase and manufacturing data", async () => {
      const saleRes = await requestJson<SuccessEnvelope<{ rows: Array<{ changeType: string }> }>>(
        "GET",
        "/history?type=sale&page=1&pageSize=50"
      );
      const purchaseRes = await requestJson<SuccessEnvelope<{ rows: Array<{ changeType: string }> }>>(
        "GET",
        "/history?type=purchase&page=1&pageSize=50"
      );
      const manufacturingRes = await requestJson<SuccessEnvelope<{ rows: Array<{ changeType: string }> }>>(
        "GET",
        "/history?type=manufacturing&page=1&pageSize=50"
      );

      assertTrue(saleRes.status === 200, `sale history expected 200, got ${saleRes.status}`);
      assertTrue(purchaseRes.status === 200, `purchase history expected 200, got ${purchaseRes.status}`);
      assertTrue(manufacturingRes.status === 200, `manufacturing history expected 200, got ${manufacturingRes.status}`);

      const saleRows = expectSuccess(saleRes).rows;
      const purchaseRows = expectSuccess(purchaseRes).rows;
      const manufacturingRows = expectSuccess(manufacturingRes).rows;

      assertTrue(saleRows.some((r) => r.changeType === "SALE"), "SALE history entry not found");
      assertTrue(purchaseRows.some((r) => r.changeType === "PURCHASE"), "PURCHASE history entry not found");
      assertTrue(
        manufacturingRows.some((r) => r.changeType === "WIP_RAW" || r.changeType === "WIP_OUTPUT"),
        "Manufacturing history entries not found"
      );

      return {
        saleCount: saleRows.length,
        purchaseCount: purchaseRows.length,
        manufacturingCount: manufacturingRows.length
      };
    });

    await runTest("Lookup endpoints return product/customer/supplier suggestions", async () => {
      const productLookup = await requestJson<SuccessEnvelope<Array<{ label: string }>>>(
        "GET",
        `/lookup/products?q=${encodeURIComponent(BASE_PREFIX)}`
      );
      const customerLookup = await requestJson<SuccessEnvelope<Array<{ id: string }>>>(
        "GET",
        `/lookup/customers?q=${encodeURIComponent(BASE_PREFIX)}`
      );
      const supplierLookup = await requestJson<SuccessEnvelope<Array<{ id: string }>>>(
        "GET",
        `/lookup/suppliers?q=${encodeURIComponent(BASE_PREFIX)}`
      );

      assertTrue(productLookup.status === 200, `Expected 200, got ${productLookup.status}`);
      assertTrue(customerLookup.status === 200, `Expected 200, got ${customerLookup.status}`);
      assertTrue(supplierLookup.status === 200, `Expected 200, got ${supplierLookup.status}`);

      const productData = expectSuccess(productLookup);
      const customerData = expectSuccess(customerLookup);
      const supplierData = expectSuccess(supplierLookup);

      assertTrue(productData.some((p) => p.label.includes(BASE_PREFIX)), "Product lookup missing expected label");
      assertTrue(customerData.some((c) => c.id === CUSTOMER_ID), "Customer lookup missing expected id");
      assertTrue(supplierData.some((s) => s.id === SUPPLIER_ID), "Supplier lookup missing expected id");

      return {
        products: productData.length,
        customers: customerData.length,
        suppliers: supplierData.length
      };
    });

    await runAdapterTest("GET /api/inventory returns mapped inventory schema", async () => {
      const res = await requestJson<
        SuccessEnvelope<
          Array<{
            id: string;
            code: string;
            name: string;
            price: number;
            quantity: number;
            status: string;
            lastUpdated: string;
          }>
        >
      >("GET", "/api/inventory?page=1&pageSize=20");
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      const row = data.find((x) => x.code === SKU_RAW);
      assertTrue(Boolean(row), "Mapped inventory row for raw SKU not found");
      assertTrue(typeof row?.price === "number", "price must be number");
      assertTrue(typeof row?.lastUpdated === "string" && row.lastUpdated.includes("T"), "lastUpdated must be ISO");
      return row as object;
    });

    await runAdapterTest("PATCH /api/inventory/:id/quantity returns updated object", async () => {
      const res = await requestJson<
        SuccessEnvelope<{
          id: string;
          code: string;
          quantity: number;
          status: string;
          lastUpdated: string;
        }>
      >("PATCH", `/api/inventory/${rawProductId}/quantity`, {
        delta: 2,
        reason: "reorder"
      });
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(data.id === rawProductId, "patched inventory id mismatch");
      assertTrue(typeof data.quantity === "number", "patched quantity must be number");
      return data;
    });

    await runAdapterTest("Sales adapter endpoints: queue + lines + update + finalize", async () => {
      const queueRes = await requestJson<SuccessEnvelope<Array<{ id: string; amount: number; stage: string; status: string }>>>(
        "GET",
        "/api/sales/orders?page=1&pageSize=20"
      );
      assertTrue(queueRes.status === 200, `Expected 200, got ${queueRes.status}`);
      const queue = expectSuccess(queueRes);
      const target = queue.find((row) => row.id === saleOrderId);
      assertTrue(Boolean(target), "sale order not found in /api/sales/orders");
      assertTrue(typeof target?.amount === "number", "sales amount must be number");

      const linesRes = await requestJson<SuccessEnvelope<{ lines: Array<{ code: string; unitPrice: number }> }>>(
        "GET",
        `/api/sales/orders/${saleOrderId}/lines`
      );
      assertTrue(linesRes.status === 200, `Expected 200, got ${linesRes.status}`);
      const lines = expectSuccess(linesRes);
      assertTrue(lines.lines.length > 0, "sales lines must not be empty");
      assertTrue(typeof lines.lines[0].unitPrice === "number", "unitPrice must be number");

      const updateLinesRes = await requestJson<SuccessEnvelope<{ amount: number; lines: unknown[] }>>(
        "PUT",
        `/api/sales/orders/${saleOrderId}/lines`,
        {
          lines: [{ code: SKU_FIN, quantity: 3, unitPrice: 260 }],
          note: "adapter sales line update"
        }
      );
      assertTrue(updateLinesRes.status === 200, `Expected 200, got ${updateLinesRes.status}`);
      const updated = expectSuccess(updateLinesRes);
      assertTrue(updated.amount === 780, `Expected 780 amount, got ${updated.amount}`);

      const finalizeRes = await requestJson<SuccessEnvelope<{ id: string; status: string }>>(
        "POST",
        `/api/sales/orders/${saleOrderId}/finalize-dispatch`
      );
      assertTrue(finalizeRes.status === 200, `Expected 200, got ${finalizeRes.status}`);
      const finalized = expectSuccess(finalizeRes);
      assertTrue(finalized.id === saleOrderId, "finalize-dispatch response id mismatch");
      return finalized;
    });

    await runAdapterTest("Purchase adapter endpoints: queue + lines + update + complete", async () => {
      const queueRes = await requestJson<SuccessEnvelope<Array<{ id: string; amount: number; stage: string; status: string }>>>(
        "GET",
        "/api/purchase/orders?page=1&pageSize=20"
      );
      assertTrue(queueRes.status === 200, `Expected 200, got ${queueRes.status}`);
      const queue = expectSuccess(queueRes);
      const target = queue.find((row) => row.id === purchaseOrderId);
      assertTrue(Boolean(target), "purchase order not found in /api/purchase/orders");
      assertTrue(typeof target?.amount === "number", "purchase amount must be number");

      const linesRes = await requestJson<SuccessEnvelope<{ lines: Array<{ code: string; unitPrice: number }> }>>(
        "GET",
        `/api/purchase/orders/${purchaseOrderId}/lines`
      );
      assertTrue(linesRes.status === 200, `Expected 200, got ${linesRes.status}`);
      const lines = expectSuccess(linesRes);
      assertTrue(lines.lines.length > 0, "purchase lines must not be empty");

      const updateLinesRes = await requestJson<SuccessEnvelope<{ amount: number }>>(
        "PUT",
        `/api/purchase/orders/${purchaseOrderId}/lines`,
        {
          lines: [{ code: SKU_RAW, quantity: 7, unitPrice: 100 }],
          note: "adapter purchase line update"
        }
      );
      assertTrue(updateLinesRes.status === 200, `Expected 200, got ${updateLinesRes.status}`);
      const updated = expectSuccess(updateLinesRes);
      assertTrue(updated.amount === 700, `Expected 700 amount, got ${updated.amount}`);

      const completeRes = await requestJson<SuccessEnvelope<{ id: string; status: string }>>(
        "POST",
        `/api/purchase/orders/${purchaseOrderId}/complete`
      );
      assertTrue(completeRes.status === 200, `Expected 200, got ${completeRes.status}`);
      const completed = expectSuccess(completeRes);
      assertTrue(completed.id === purchaseOrderId, "complete response id mismatch");
      return completed;
    });

    await runAdapterTest("Manufacturing adapter endpoints: list + patch + complete + delete", async () => {
      adapterBatchId = `${BASE_PREFIX}-ADAPTER-B1`;
      const createRes = await requestJson<SuccessEnvelope<{ id: string }>>("POST", "/manufacturing", {
        batchNumber: adapterBatchId,
        rawMaterials: [{ productCode: SKU_RAW, quantity: 1 }],
        outputProducts: [{ productCode: SKU_FIN, quantity: 1 }],
        notes: "adapter batch"
      });
      assertTrue(createRes.status === 201, `Expected 201, got ${createRes.status}`);

      const listRes = await requestJson<SuccessEnvelope<Array<{ id: string; progress: number }>>>(
        "GET",
        "/api/manufacturing/batches?page=1&pageSize=50"
      );
      assertTrue(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const list = expectSuccess(listRes);
      assertTrue(list.some((b) => b.id === adapterBatchId), "adapter batch missing in list");

      const patchRes = await requestJson<SuccessEnvelope<{ id: string; title: string }>>(
        "PATCH",
        `/api/manufacturing/batches/${adapterBatchId}`,
        { title: "adapter-updated", notes: "adapter-updated" }
      );
      assertTrue(patchRes.status === 200, `Expected 200, got ${patchRes.status}`);
      const patched = expectSuccess(patchRes);
      assertTrue(patched.id === adapterBatchId, "patched batch id mismatch");

      const completeRes = await requestJson<SuccessEnvelope<{ id: string; progress: number }>>(
        "POST",
        `/api/manufacturing/batches/${adapterBatchId}/complete`
      );
      assertTrue(completeRes.status === 200, `Expected 200, got ${completeRes.status}`);
      const completed = expectSuccess(completeRes);
      assertTrue(completed.progress === 100, "adapter complete should set progress=100");

      const deleteRes = await requestJson<SuccessEnvelope<{ deleted: boolean }>>(
        "DELETE",
        `/api/manufacturing/batches/${adapterBatchId}`
      );
      assertTrue(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);
      const deleted = expectSuccess(deleteRes);
      assertTrue(deleted.deleted === true, "adapter delete should return deleted=true");
      return deleted;
    });

    await runAdapterTest("History adapter endpoints: list + patch + next-stage + delete", async () => {
      const adapterCreateOrder = await requestJson<SuccessEnvelope<{ id: string }>>("POST", "/orders", {
        type: "SALE",
        partyId: `${BASE_PREFIX}-ADAPTER-CUST-DEL`,
        products: [{ productCode: SKU_FIN, quantity: 1, price: 100 }],
        notes: "adapter history base"
      });
      assertTrue(adapterCreateOrder.status === 201, `Expected 201, got ${adapterCreateOrder.status}`);
      adapterOrderId = expectSuccess(adapterCreateOrder).id;

      const listRes = await requestJson<SuccessEnvelope<Array<{ id: string; type: string; value: number; date: string }>>>(
        "GET",
        "/api/history?type=Sales&sort=date&order=desc&page=1&pageSize=20"
      );
      assertTrue(listRes.status === 200, `Expected 200, got ${listRes.status}`);
      const list = expectSuccess(listRes);
      assertTrue(list.every((h) => typeof h.value === "number"), "history value must be numeric");
      assertTrue(list.every((h) => typeof h.date === "string"), "history date must be ISO string");

      const patchRes = await requestJson<SuccessEnvelope<{ id: string; note: string | null }>>(
        "PATCH",
        `/api/history/purchase:${purchaseOrderId}`,
        { note: "adapter history patch" }
      );
      assertTrue(patchRes.status === 200, `Expected 200, got ${patchRes.status}`);

      const nextStageRes = await requestJson<SuccessEnvelope<{ id: string; status: string }>>(
        "POST",
        `/api/history/sale:${adapterOrderId}/next-stage`
      );
      assertTrue(nextStageRes.status === 200, `Expected 200, got ${nextStageRes.status}`);
      const nextStage = expectSuccess(nextStageRes);
      assertTrue(["Pending", "Approved", "Dispatched"].includes(nextStage.status), "status enum invalid");

      const deleteRes = await requestJson<SuccessEnvelope<{ deleted: boolean }>>(
        "DELETE",
        `/api/history/sale:${adapterOrderId}`
      );
      assertTrue(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);
      const deleted = expectSuccess(deleteRes);
      assertTrue(deleted.deleted === true, "history delete should return deleted=true");
      return { totalRows: list.length, deleted };
    });

    await runAdapterTest("Dashboard + Entities adapter endpoints", async () => {
      const metricsRes = await requestJson<
        SuccessEnvelope<Array<{ label: string; value: number; delta: string; icon: string; tone: string }>>
      >("GET", "/api/dashboard/metrics");
      assertTrue(metricsRes.status === 200, `Expected 200, got ${metricsRes.status}`);
      const metrics = expectSuccess(metricsRes);
      assertTrue(metrics.length >= 4, "expected at least 4 dashboard metrics");
      assertTrue(metrics.every((m) => typeof m.value === "number"), "metric value must be numeric");

      const entitiesRes = await requestJson<SuccessEnvelope<Array<{ id: string; type: string; name: string }>>>(
        "GET",
        "/api/entities?page=1&pageSize=20"
      );
      assertTrue(entitiesRes.status === 200, `Expected 200, got ${entitiesRes.status}`);
      const entities = expectSuccess(entitiesRes);
      assertTrue(entities.length > 0, "entities should not be empty");

      const entityId = entities[0].id;
      const entityRes = await requestJson<SuccessEnvelope<{ id: string; type: string }>>("GET", `/api/entities/${entityId}`);
      assertTrue(entityRes.status === 200, `Expected 200, got ${entityRes.status}`);
      const entity = expectSuccess(entityRes);
      assertTrue(entity.id === entityId, "entity details id mismatch");

      const lookupRes = await requestJson<SuccessEnvelope<{ id: string; type: string }>>(
        "GET",
        `/api/entities/lookup/${entityId}`
      );
      assertTrue(lookupRes.status === 200, `Expected 200, got ${lookupRes.status}`);
      const lookup = expectSuccess(lookupRes);
      assertTrue(lookup.id === entityId, "entity lookup id mismatch");

      return {
        metricsCount: metrics.length,
        entitiesCount: entities.length,
        sampleEntityType: entity.type
      };
    });

    await runTest("Order delete endpoint", async () => {
      const deleteRes = await requestJson<SuccessEnvelope<{ orderId: string }>>("DELETE", `/orders/${saleOrderId}`);
      assertTrue(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);

      const getDeleted = await requestJson<ErrorEnvelope>("GET", `/orders/${saleOrderId}`);
      assertTrue(getDeleted.status === 404, `Expected 404, got ${getDeleted.status}`);
      const err = expectError(getDeleted);

      return {
        deletedOrderId: saleOrderId,
        errorCodeAfterDelete: err.error.code
      };
    });

    await runTest("Dashboard summary endpoint returns KPI payload", async () => {
      const res = await requestJson<
        SuccessEnvelope<{
          totalInventoryValue: number;
          formattedInventoryValue: string;
          pendingOrders: number;
          wipCount: number;
          lowStockCount: number;
          recentActivities: unknown[];
        }>
      >("GET", "/dashboard/summary");
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(typeof data.totalInventoryValue === "number", "totalInventoryValue should be number");
      assertTrue(data.formattedInventoryValue.startsWith("₹"), "formattedInventoryValue should be INR");
      assertTrue(Array.isArray(data.recentActivities), "recentActivities should be array");
      return {
        pendingOrders: data.pendingOrders,
        wipCount: data.wipCount,
        lowStockCount: data.lowStockCount
      };
    });

    await runTest("AI query endpoint works with fallback or AI response", async () => {
      const res = await requestJson<
        SuccessEnvelope<{ intent: string; resultCount: number; results: unknown[]; sqlLikeIntent: string }>
      >("POST", "/ai/query", {
        userQuery: "show low stock products"
      });
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(typeof data.intent === "string", "intent missing");
      assertTrue(typeof data.resultCount === "number", "resultCount missing");
      return data;
    });

    await runTest("AI insights endpoint returns structured analytics", async () => {
      const res = await requestJson<
        SuccessEnvelope<{
          source: string;
          datasetSize: number;
          insights: {
            fastMovingProducts: unknown[];
            slowMovingProducts: unknown[];
            overstockRisks: unknown[];
            recommendations: string[];
          };
        }>
      >("GET", "/ai/insights");
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(typeof data.source === "string", "source missing");
      assertTrue(Array.isArray(data.insights.recommendations), "recommendations should be array");
      return {
        source: data.source,
        datasetSize: data.datasetSize,
        recommendations: data.insights.recommendations.length
      };
    });

    await runTest("AI reorder endpoint returns recommendation object", async () => {
      const res = await requestJson<
        SuccessEnvelope<{
          product: { id: string; productCode: string };
          recommendation: {
            suggestedQuantity: number;
            reorderWhen: string;
            reasoning: string;
            source: "ai" | "fallback";
          };
        }>
      >("GET", `/ai/reorder/${rawProductId}?lookbackDays=30`);
      assertTrue(res.status === 200, `Expected 200, got ${res.status}`);
      const data = expectSuccess(res);
      assertTrue(data.product.id === rawProductId, "AI reorder product mismatch");
      assertTrue(typeof data.recommendation.suggestedQuantity === "number", "suggestedQuantity missing");
      return {
        productCode: data.product.productCode,
        recommendationSource: data.recommendation.source,
        suggestedQuantity: data.recommendation.suggestedQuantity
      };
    });

    await runTest("Validation errors return global error envelope", async () => {
      const res = await requestJson<ErrorEnvelope>("POST", "/products", {
        name: "Invalid Product Without SKU",
        price: -1
      });
      assertTrue(res.status === 400, `Expected 400, got ${res.status}`);
      const error = expectError(res);
      assertTrue(error.error.code === "VALIDATION_ERROR", `Expected VALIDATION_ERROR, got ${error.error.code}`);
      return {
        status: res.status,
        body: res.json
      };
    });

    await runTest("Socket events are emitted during workflow", async () => {
      const currentProduct = await requestJson<SuccessEnvelope<{ quantity: number }>>(
        "GET",
        `/products/${finishedProductId}`
      );
      assertTrue(currentProduct.status === 200, `Expected 200, got ${currentProduct.status}`);
      const currentQty = expectSuccess(currentProduct).quantity;
      const lowStockTriggerQty = Math.max(currentQty - 4, 1);

      const forceLowStock = await requestJson<SuccessEnvelope<{ newQuantity: number }>>("POST", "/inventory/update", {
        productCode: SKU_FIN,
        type: "SALE",
        quantity: lowStockTriggerQty,
        referenceId: `${BASE_PREFIX}-LOWSOCK-1`
      });
      assertTrue(forceLowStock.status === 200, `Expected 200, got ${forceLowStock.status}`);

      const inventorySeen = await waitForEvent("inventory:update", 3, 4000);
      const lowStockSeen = await waitForEvent("low_stock", 1, 4000);
      const orderSeen = await waitForEvent("order:update", 3, 4000);
      const manufacturingSeen = await waitForEvent("manufacturing:update", 2, 4000);

      assertTrue(inventorySeen, "Expected inventory:update events not received");
      assertTrue(lowStockSeen, "Expected low_stock event not received");
      assertTrue(orderSeen, "Expected order:update events not received");
      assertTrue(manufacturingSeen, "Expected manufacturing:update events not received");

      return {
        inventoryUpdateCount: socketEvents["inventory:update"].length,
        lowStockCount: socketEvents.low_stock.length,
        orderUpdateCount: socketEvents["order:update"].length,
        manufacturingUpdateCount: socketEvents["manufacturing:update"].length
      };
    });

    await runTest("Delete products cleanup endpoints", async () => {
      const deletePurchase = await requestJson<SuccessEnvelope<{ orderId: string }>>(
        "DELETE",
        `/orders/${purchaseOrderId}`
      );
      assertTrue(deletePurchase.status === 200, `Expected 200, got ${deletePurchase.status}`);

      const delFinished = await requestJson<SuccessEnvelope<{ id: string }>>("DELETE", `/products/${finishedProductId}`);
      assertTrue(delFinished.status === 200, `Expected 200, got ${delFinished.status}`);

      const delRaw = await requestJson<SuccessEnvelope<{ id: string }>>("DELETE", `/products/${rawProductId}`);
      assertTrue(delRaw.status === 200, `Expected 200, got ${delRaw.status}`);

      const checkRaw = await requestJson<ErrorEnvelope>("GET", `/products/${rawProductId}`);
      assertTrue(checkRaw.status === 404, `Expected 404, got ${checkRaw.status}`);

      return {
        deleted: [finishedProductId, rawProductId]
      };
    });
  } catch (fatal) {
    pushResult("Fatal setup/teardown error", "FAIL", truncate((fatal as Error)?.stack ?? String(fatal)));
  } finally {
    try {
      await generateReport();
      await generateAdapterReport();
    } catch (reportErr) {
      pushResult("Report generation", "FAIL", truncate((reportErr as Error)?.stack ?? String(reportErr)));
    }

    try {
      await cleanupData();
    } catch (cleanupErr) {
      pushResult("Data cleanup", "FAIL", truncate((cleanupErr as Error)?.stack ?? String(cleanupErr)));
    }

    await shutdown();
  }

  const failCount = testResults.filter((r) => r.status === "FAIL").length;
  if (failCount > 0) {
    process.exitCode = 1;
  }
};

void main();
