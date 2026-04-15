import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pool } from "../db";
import { logger } from "../common/logger";

type CheckRow = {
  check: string;
  issueCount: number;
  status: "PASS" | "FAIL";
};

const args = process.argv.slice(2);
const reportPathArg = args.find((arg) => arg.startsWith("--report="));
const reportPath = reportPathArg ? resolve(reportPathArg.split("=")[1] ?? "") : null;
const failOnIssues = args.includes("--fail-on-issues");

const run = async () => {
  const client = await pool.connect();

  try {
    const checks: Array<{ key: string; sql: string }> = [
      {
        key: "orders_missing_or_invalid_version",
        sql: `SELECT COUNT(*)::int AS count FROM erp_orders WHERE version IS NULL OR version < 1`
      },
      {
        key: "non_draft_orders_marked_draft",
        sql: `SELECT COUNT(*)::int AS count FROM erp_orders WHERE status <> 'DRAFT' AND is_draft = true`
      },
      {
        key: "completed_purchase_not_paid",
        sql: `SELECT COUNT(*)::int AS count FROM erp_orders WHERE type = 'PURCHASE' AND status = 'COMPLETED' AND payment_status <> 'PAID'`
      },
      {
        key: "completed_batch_without_end_date",
        sql: `SELECT COUNT(*)::int AS count FROM manufacturing_batches WHERE status = 'COMPLETED' AND end_date IS NULL`
      },
      {
        key: "completed_batch_material_not_consumed",
        sql: `SELECT COUNT(*)::int AS count FROM manufacturing_batches WHERE status = 'COMPLETED' AND material_consumed = false`
      },
      {
        key: "completed_batch_output_not_added",
        sql: `SELECT COUNT(*)::int AS count FROM manufacturing_batches WHERE status = 'COMPLETED' AND output_added = false`
      }
    ];

    const rows: CheckRow[] = [];

    for (const check of checks) {
      const result = await client.query(check.sql);
      const issueCount = Number(result.rows[0]?.count ?? 0);
      rows.push({
        check: check.key,
        issueCount,
        status: issueCount === 0 ? "PASS" : "FAIL"
      });
    }

    const report = {
      generatedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
      checks: rows,
      summary: {
        totalChecks: rows.length,
        failedChecks: rows.filter((row) => row.status === "FAIL").length,
        issueCount: rows.reduce((sum, row) => sum + row.issueCount, 0)
      }
    };

    logger.info("Production migration verification report", report);

    if (reportPath) {
      await mkdir(dirname(reportPath), { recursive: true });
      await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
      logger.info("Migration verification report written", { reportPath });
    }

    if (failOnIssues && report.summary.failedChecks > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    logger.error("Migration verification failed", { error });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

void run();
