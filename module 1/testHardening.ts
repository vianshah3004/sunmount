import "dotenv/config";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { app } from "./src/app";
import { db, pool, verifyDatabaseConnection } from "./src/db";
import { users, transitionLogs } from "./src/db/schema";

type UserRole = "ADMIN" | "OPERATOR" | "ACCOUNTANT";

type LoginResponse = {
  success: boolean;
  data?: {
    token: string;
  };
};

type TestResult = {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
};

const testUsers = {
  operator: {
    username: `hardening-operator-${Date.now()}`,
    role: "OPERATOR" as UserRole,
    password: "HardeningPass!123"
  },
  accountant: {
    username: `hardening-accountant-${Date.now()}`,
    role: "ACCOUNTANT" as UserRole,
    password: "HardeningPass!123"
  },
  admin: {
    username: `hardening-admin-${Date.now()}`,
    role: "ADMIN" as UserRole,
    password: "HardeningPass!123"
  }
};

const results: TestResult[] = [];

let server: Server | null = null;
let baseUrl = "";

const runTest = async (name: string, fn: () => Promise<string>) => {
  try {
    const detail = await fn();
    results.push({ name, status: "PASS", detail });
    console.log(`[PASS] ${name}`);
  } catch (error) {
    const detail = (error as Error)?.stack ?? String(error);
    results.push({ name, status: "FAIL", detail });
    console.error(`[FAIL] ${name}`);
  }
};

const expect = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const request = async (
  method: string,
  path: string,
  options: {
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
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
  let json: unknown = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch {
      json = null;
    }
  }

  return {
    status: response.status,
    json,
    raw
  };
};

const ensureUser = async (username: string, password: string, role: UserRole) => {
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    await db.update(users).set({ passwordHash, role }).where(eq(users.username, username));
    return;
  }

  await db.insert(users).values({ username, passwordHash, role });
};

const ensureHardeningSchema = async () => {
  const checks = await Promise.all([
    pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_name = 'users' AND column_name = 'role'
       ) AS exists`
    ),
    pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_name = 'transition_logs'
       ) AS exists`
    )
  ]);

  const roleExists = Boolean(checks[0].rows?.[0]?.exists);
  const transitionLogsExists = Boolean(checks[1].rows?.[0]?.exists);

  if (!roleExists || !transitionLogsExists) {
    throw new Error(
      "Hardening schema is missing. Run `npm run db:migrate` and `npm run db:migrate:hardening` before `npm run test:hardening`."
    );
  }
};

const login = async (username: string, password: string) => {
  const response = await request("POST", "/auth/login", {
    body: { username, password }
  });

  expect(response.status === 200, `Login failed for ${username}: ${response.raw}`);
  const payload = response.json as LoginResponse;
  expect(Boolean(payload?.data?.token), `Missing token for ${username}`);
  return payload.data!.token;
};

const start = async () => {
  await verifyDatabaseConnection();
  await ensureHardeningSchema();

  await Promise.all([
    ensureUser(testUsers.operator.username, testUsers.operator.password, testUsers.operator.role),
    ensureUser(testUsers.accountant.username, testUsers.accountant.password, testUsers.accountant.role),
    ensureUser(testUsers.admin.username, testUsers.admin.password, testUsers.admin.role)
  ]);

  server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server?.once("error", reject);
    server?.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
};

const stop = async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
    server = null;
  }

  await pool.end();
};

const main = async () => {
  await start();

  const [operatorToken, accountantToken, adminToken] = await Promise.all([
    login(testUsers.operator.username, testUsers.operator.password),
    login(testUsers.accountant.username, testUsers.accountant.password),
    login(testUsers.admin.username, testUsers.admin.password)
  ]);

  await runTest("RBAC denies accountant for manufacturing start", async () => {
    const response = await request("POST", "/api/manufacturing/batches/non-existent/start", {
      token: accountantToken
    });

    expect(response.status === 403, `Expected 403, got ${response.status} with ${response.raw}`);
    return "Accountant blocked from manufacturing transition endpoint";
  });

  await runTest("RBAC denies operator for purchase completion", async () => {
    const response = await request("POST", "/api/purchase/orders/non-existent/complete", {
      token: operatorToken
    });

    expect(response.status === 403, `Expected 403, got ${response.status} with ${response.raw}`);
    return "Operator blocked from finance-only completion endpoint";
  });

  await runTest("RBAC allows admin role through role gate", async () => {
    const response = await request("POST", "/api/purchase/orders/non-existent/complete", {
      token: adminToken
    });

    expect(response.status !== 403, `Admin unexpectedly forbidden: ${response.raw}`);
    return `Admin passed role gate, downstream status=${response.status}`;
  });

  await runTest("Idempotency suppresses duplicate transition logs", async () => {
    const idempotencyKey = `hardening-idem-${Date.now()}`;

    const first = await request("POST", "/api/purchase/orders/non-existent/complete", {
      token: adminToken,
      headers: { "Idempotency-Key": idempotencyKey }
    });

    const second = await request("POST", "/api/purchase/orders/non-existent/complete", {
      token: adminToken,
      headers: { "Idempotency-Key": idempotencyKey }
    });

    expect(first.status === second.status, "Duplicate request changed transport outcome unexpectedly");

    const rows = await db
      .select({ id: transitionLogs.id })
      .from(transitionLogs)
      .where(
        and(
          eq(transitionLogs.entityType, "order"),
          eq(transitionLogs.entityId, "non-existent"),
          eq(transitionLogs.action, "status_transition"),
          eq(transitionLogs.idempotencyKey, idempotencyKey)
        )
      );

    expect(rows.length <= 1, `Expected at most one transition log, found ${rows.length}`);
    return `Duplicate transition requests produced ${rows.length} log entries`;
  });

  await runTest("High-concurrency endpoint remains stable under burst", async () => {
    const burst = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        request("GET", "/health", {
          headers: { "x-burst-id": `burst-${index}` }
        })
      )
    );

    const failed = burst.filter((row) => row.status !== 200);
    expect(failed.length === 0, `Expected all health checks to pass, failures=${failed.length}`);
    return `Burst request count=${burst.length}, failures=${failed.length}`;
  });

  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.length - passed;

  console.log("\n=== Hardening Test Summary ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    for (const result of results.filter((row) => row.status === "FAIL")) {
      console.error(`\n[FAIL] ${result.name}\n${result.detail}`);
    }
    process.exitCode = 1;
  }

  await stop();
};

void main().catch(async (error) => {
  console.error("Hardening test runner failed", error);
  process.exitCode = 1;
  await stop();
});
