import "dotenv/config";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { randomUUID } from "node:crypto";
import { writeFile } from "fs/promises";
import { io as createSocketClient, Socket } from "socket.io-client";
import { eq } from "drizzle-orm";
import { app } from "./src/app";
import { initSocket } from "./src/common/socket";
import { registerInventoryEventHandlers } from "./src/modules/inventory/inventory.events";
import { db, pool, verifyDatabaseConnection } from "./src/db";
import { products } from "./src/db/schema";

type SectionKey =
  | "connection"
  | "inventoryUpdateEvent"
  | "lowStockEvent"
  | "multipleEventHandling"
  | "errorHandling";

type SectionResult = {
  passed: boolean;
  details: string[];
};

type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

type ApiResponse<T = unknown> = {
  status: number;
  data: T | null;
  text: string;
};

const results: Record<SectionKey, SectionResult> = {
  connection: { passed: true, details: [] },
  inventoryUpdateEvent: { passed: true, details: [] },
  lowStockEvent: { passed: true, details: [] },
  multipleEventHandling: { passed: true, details: [] },
  errorHandling: { passed: true, details: [] }
};

let httpServer: Server | null = null;
let baseUrl = "";
let clientSocket: Socket | null = null;
let cleanupProductId: string | null = null;

const inventoryUpdateEvents: Array<{ productCode: string; newQuantity: number }> = [];
const lowStockEvents: Array<{ productCode: string; quantity: number; lowStockThreshold: number }> = [];

const record = (section: SectionKey, passed: boolean, detail: string) => {
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

const wait = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const requestJson = async <T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

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
    text
  };
};

const getSuccessData = <T>(res: ApiResponse<SuccessEnvelope<T>>): T => {
  const envelope = res.data;
  if (!envelope || envelope.success !== true) {
    throw new Error(`Expected success response envelope. Raw: ${res.text}`);
  }
  return envelope.data;
};

const startServer = async () => {
  httpServer = createServer(app);
  initSocket(httpServer);
  registerInventoryEventHandlers();

  await verifyDatabaseConnection();

  await new Promise<void>((resolve, reject) => {
    httpServer?.once("error", reject);
    httpServer?.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Socket test server started at ${baseUrl}`);
};

const connectClient = async () => {
  await new Promise<void>((resolve, reject) => {
    clientSocket = createSocketClient(baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 200,
      timeout: 5_000
    });

    clientSocket.on("connect", () => resolve());
    clientSocket.on("connect_error", (error) => reject(error));

    clientSocket.on("inventory:update", (payload) => {
      inventoryUpdateEvents.push(payload as { productCode: string; newQuantity: number });
    });

    clientSocket.on("low_stock", (payload) => {
      lowStockEvents.push(payload as {
        productCode: string;
        quantity: number;
        lowStockThreshold: number;
      });
    });
  });
};

const writeReport = async () => {
  const allPass = Object.values(results).every((entry) => entry.passed);
  const issues = Object.entries(results)
    .filter(([, value]) => !value.passed)
    .map(([key]) => key);

  const markdown = [
    "# Socket.IO Test Report",
    "",
    "## 1. Connection",
    "",
    `${results.connection.passed ? "✔" : "❌"}`,
    ...results.connection.details.map((d) => `- ${d}`),
    "",
    "## 2. inventory:update Event",
    "",
    `${results.inventoryUpdateEvent.passed ? "✔" : "❌"}`,
    "Details:",
    ...results.inventoryUpdateEvent.details.map((d) => `- ${d}`),
    "",
    "## 3. low_stock Event",
    "",
    `${results.lowStockEvent.passed ? "✔" : "❌"}`,
    "Details:",
    ...results.lowStockEvent.details.map((d) => `- ${d}`),
    "",
    "## 4. Multiple Event Handling",
    "",
    `${results.multipleEventHandling.passed ? "✔" : "❌"}`,
    ...results.multipleEventHandling.details.map((d) => `- ${d}`),
    "",
    "## 5. Error Handling",
    "",
    `${results.errorHandling.passed ? "✔" : "❌"}`,
    ...results.errorHandling.details.map((d) => `- ${d}`),
    "",
    "---",
    "",
    "## Final Verdict",
    "",
    `- Real-time System Status: ${allPass ? "WORKING" : "NEEDS FIXES"}`,
    "- Issues Found:",
    ...(issues.length > 0 ? issues.map((issue) => `- ${issue}`) : ["- No critical realtime issues found."]),
    "- Recommendations:",
    "- Add this Socket.IO test to CI for regression protection.",
    "- Track event delivery latency and dropped events in production metrics.",
    "- Validate websocket behavior behind your production reverse proxy/load balancer.",
    ""
  ].join("\n");

  await writeFile("socket_test_report.md", markdown, "utf8");
};

const cleanup = async () => {
  if (clientSocket) {
    clientSocket.disconnect();
  }

  if (cleanupProductId) {
    await db.delete(products).where(eq(products.id, cleanupProductId));
  }

  if (httpServer) {
    await new Promise<void>((resolve, reject) => {
      httpServer?.close((err) => {
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

const run = async () => {
  const productCode = `SKU-SOCKET-${randomUUID().slice(0, 8)}`;

  try {
    console.log("Starting Socket.IO end-to-end tests...");
    await startServer();

    console.log("1) Connection test...");
    await connectClient();
    assertCondition(Boolean(clientSocket?.connected), "Socket client did not connect");
    record("connection", true, "Socket client connected successfully.");

    console.log("Preparing product for websocket tests...");
    const createProductRes = await requestJson<
      SuccessEnvelope<{ id: string; productCode: string; quantity: number }>
    >("POST", "/products", {
      productCode,
      name: "Socket Test Product",
      description: "Realtime event testing",
      weight: 0.2,
      price: 20,
      quantity: 20,
      lowStockThreshold: 10
    });

    assertCondition(createProductRes.status === 201, "Failed to create product for socket tests");
    const createdProduct = getSuccessData(createProductRes);
    cleanupProductId = createdProduct.id;

    console.log("2) inventory:update event test...");
    const saleRes = await requestJson<SuccessEnvelope<{ newQuantity: number }>>("POST", "/inventory/update", {
      productCode,
      type: "SALE",
      quantity: 3,
      referenceId: "SOCKET-SALE-1"
    });
    assertCondition(saleRes.status === 200, "Inventory update API failed during socket test");

    await wait(400);

    const lastInventoryEvent = inventoryUpdateEvents.at(-1);
    assertCondition(Boolean(lastInventoryEvent), "No inventory:update event received");
    assertCondition(lastInventoryEvent?.productCode === productCode, "inventory:update productCode mismatch");

    const [dbProductAfterSale] = await db
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, createdProduct.id))
      .limit(1);

    assertCondition(
      lastInventoryEvent?.newQuantity === dbProductAfterSale.quantity,
      "inventory:update quantity does not match database state"
    );
    record(
      "inventoryUpdateEvent",
      true,
      `inventory:update received with quantity=${lastInventoryEvent?.newQuantity} matching DB.`
    );

    console.log("3) low_stock event test...");
    const lowStockRes = await requestJson<SuccessEnvelope<{ newQuantity: number }>>("POST", "/inventory/update", {
      productCode,
      type: "SALE",
      quantity: 8,
      referenceId: "SOCKET-LOW-1"
    });

    assertCondition(lowStockRes.status === 200, "Low stock triggering update failed");
    await wait(500);

    const lowStockEvent = lowStockEvents.at(-1);
    assertCondition(Boolean(lowStockEvent), "No low_stock event received");
    assertCondition(lowStockEvent?.productCode === productCode, "low_stock productCode mismatch");
    assertCondition(lowStockEvent!.quantity < lowStockEvent!.lowStockThreshold, "low_stock threshold condition mismatch");
    record(
      "lowStockEvent",
      true,
      `low_stock received with quantity=${lowStockEvent?.quantity}, threshold=${lowStockEvent?.lowStockThreshold}.`
    );

    console.log("4) Multiple/rapid event handling test...");
    const baselineEventCount = inventoryUpdateEvents.length;
    const rapidOps = 10;

    await Promise.all(
      Array.from({ length: rapidOps }).map((_, index) =>
        requestJson<SuccessEnvelope<{ newQuantity: number }>>("POST", "/inventory/update", {
          productCode,
          type: "PURCHASE",
          quantity: 1,
          referenceId: `SOCKET-RAPID-${index}`
        })
      )
    );

    await wait(700);

    const eventsReceived = inventoryUpdateEvents.length - baselineEventCount;
    assertCondition(
      eventsReceived >= rapidOps,
      `Expected at least ${rapidOps} inventory:update events, received ${eventsReceived}`
    );
    record(
      "multipleEventHandling",
      true,
      `Rapid updates received ${eventsReceived} inventory:update events for ${rapidOps} operations.`
    );

    console.log("5) Socket error handling test...");
    assertCondition(Boolean(clientSocket), "Socket instance missing for error tests");
    clientSocket?.disconnect();
    await wait(300);
    assertCondition(clientSocket?.connected === false, "Socket did not disconnect cleanly");

    const badServerSocket = createSocketClient("http://127.0.0.1:1", {
      transports: ["websocket"],
      timeout: 1_000,
      reconnection: false
    });

    const badServerErrorMessage = await new Promise<string>((resolve) => {
      badServerSocket.on("connect_error", (error) => {
        resolve(error.message);
      });
    });

    badServerSocket.disconnect();

    assertCondition(Boolean(badServerErrorMessage), "No connect_error captured for unavailable server");

    await connectClient();
    assertCondition(Boolean(clientSocket?.connected), "Socket did not reconnect after disconnect");
    record(
      "errorHandling",
      true,
      "Disconnect/reconnect flow and server-unavailable connect_error handling verified."
    );
  } catch (error) {
    console.error("Socket test failed:", error instanceof Error ? error.message : String(error));

    for (const key of Object.keys(results) as SectionKey[]) {
      if (results[key].details.length === 0) {
        record(key, false, "Section aborted due to earlier failure.");
      }
    }
  } finally {
    await writeReport();
    await cleanup();

    console.log("\n=== Socket.IO QA Summary ===");
    for (const [section, result] of Object.entries(results)) {
      console.log(`${section}: ${result.passed ? "PASSED" : "FAILED"}`);
      for (const detail of result.details) {
        console.log(`  - ${detail}`);
      }
    }
    console.log("Report written to socket_test_report.md");
  }
};

void run();
