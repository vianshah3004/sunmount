import "dotenv/config";
import { createServer } from "http";
import { AddressInfo } from "net";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { app } from "../src/app";
import { db, pool, verifyDatabaseConnection } from "../src/db";
import { users, manufacturingBatches } from "../src/db/schema";

const runId = `CONC-${Date.now()}`;

const ensureUser = async (username: string, password: string) => {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length) {
    await db.update(users).set({ passwordHash, role: "OPERATOR" }).where(eq(users.username, username));
    return;
  }
  await db.insert(users).values({ username, passwordHash, role: "OPERATOR" });
};

const main = async () => {
  await verifyDatabaseConnection();

  const username = `${runId}-operator`;
  const password = "ConcPass!123";
  await ensureUser(username, password);

  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const loginJson: any = await loginRes.json();
  const token = String(loginJson?.data?.token ?? "");
  if (!token) throw new Error("Unable to authenticate");

  const batchNumber = `${runId}-B1`;
  await db.insert(manufacturingBatches).values({
    batchNumber,
    rawMaterials: [{ productCode: "missing-sku", quantity: 1 }],
    outputProducts: [{ productCode: "missing-sku", quantity: 1 }],
    status: "IN_PROGRESS",
    notes: "concurrency probe"
  });

  const responses = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      fetch(`${baseUrl}/api/manufacturing/batches/${batchNumber}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": `${runId}-${i}`
        }
      }).then(async (res) => ({ status: res.status, body: await res.text() }))
    )
  );

  const counts = responses.reduce<Record<string, number>>((acc, row) => {
    acc[String(row.status)] = (acc[String(row.status)] ?? 0) + 1;
    return acc;
  }, {});

  console.log("Concurrency status counts:", counts);

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
};

void main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
