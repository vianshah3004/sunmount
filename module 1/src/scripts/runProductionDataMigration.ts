import { randomUUID } from "node:crypto";
import { pool } from "../db";
import { logger } from "../common/logger";

const MIGRATION_KEY = "2026-04-hardening-state-normalization-v1";

const run = async () => {
  const client = await pool.connect();
  const executionId = randomUUID();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS hardening_data_migrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        migration_key varchar(128) NOT NULL UNIQUE,
        execution_id uuid NOT NULL,
        executed_at timestamptz NOT NULL DEFAULT now(),
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `);

    const existing = await client.query(
      `SELECT id FROM hardening_data_migrations WHERE migration_key = $1 LIMIT 1`,
      [MIGRATION_KEY]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      logger.info("Data migration already applied; skipping", { migrationKey: MIGRATION_KEY });
      await client.query("ROLLBACK");
      return;
    }

    const updates: Record<string, number> = {};

    const ensureOrderVersion = await client.query(
      `UPDATE erp_orders SET version = 1 WHERE version IS NULL OR version < 1`
    );
    updates.ensureOrderVersion = ensureOrderVersion.rowCount ?? 0;

    const alignDraftFlag = await client.query(
      `UPDATE erp_orders SET is_draft = false WHERE status <> 'DRAFT' AND is_draft = true`
    );
    updates.alignDraftFlag = alignDraftFlag.rowCount ?? 0;

    const completedPurchasesPaid = await client.query(
      `UPDATE erp_orders SET payment_status = 'PAID'
       WHERE type = 'PURCHASE' AND status = 'COMPLETED' AND payment_status <> 'PAID'`
    );
    updates.completedPurchasesPaid = completedPurchasesPaid.rowCount ?? 0;

    const fixManufacturingEndDate = await client.query(
      `UPDATE manufacturing_batches
       SET end_date = COALESCE(end_date, updated_at, now())
       WHERE status = 'COMPLETED' AND end_date IS NULL`
    );
    updates.fixManufacturingEndDate = fixManufacturingEndDate.rowCount ?? 0;

    const fixManufacturingMaterialFlags = await client.query(
      `UPDATE manufacturing_batches
       SET material_consumed = true
       WHERE status = 'COMPLETED' AND material_consumed = false`
    );
    updates.fixManufacturingMaterialFlags = fixManufacturingMaterialFlags.rowCount ?? 0;

    const fixManufacturingOutputFlags = await client.query(
      `UPDATE manufacturing_batches
       SET output_added = true
       WHERE status = 'COMPLETED' AND output_added = false`
    );
    updates.fixManufacturingOutputFlags = fixManufacturingOutputFlags.rowCount ?? 0;

    await client.query(
      `INSERT INTO hardening_data_migrations (migration_key, execution_id, metadata)
       VALUES ($1, $2, $3::jsonb)`,
      [MIGRATION_KEY, executionId, JSON.stringify({ updates })]
    );

    await client.query("COMMIT");

    logger.info("Production data migration completed", {
      migrationKey: MIGRATION_KEY,
      executionId,
      updates
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("Production data migration failed", {
      migrationKey: MIGRATION_KEY,
      executionId,
      error
    });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

void run();