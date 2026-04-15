import { NextFunction, Request, Response } from "express";
import PDFDocument from "pdfkit";
import { format } from "fast-csv";
import { z } from "zod";
import { sendSuccess } from "../../common/apiResponse";
import { historyService } from "./history.service";

const querySchema = z.object({
  type: z.enum(["sale", "purchase", "manufacturing"]).optional(),
  productCode: z.string().optional(),
  fromDate: z
    .string()
    .datetime()
    .transform((value) => new Date(value))
    .optional(),
  toDate: z
    .string()
    .datetime()
    .transform((value) => new Date(value))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20)
});

export const historyController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = querySchema.parse(req.query);
      const response = await historyService.getHistory(query);
      return sendSuccess(res, {
        data: {
          rows: response.data,
          export: response.export
        },
        pagination: {
          page: response.page,
          limit: response.pageSize,
          total: response.total
        }
      });
    } catch (error) {
      return next(error);
    }
  }
  ,

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const query = querySchema.parse(req.query);
      const rows = await historyService.getHistoryExportRows(query);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=history-export.csv");

      const csvStream = format({ headers: true });
      csvStream.pipe(res);
      for (const row of rows) {
        csvStream.write(row);
      }
      csvStream.end();
    } catch (error) {
      return next(error);
    }
  },

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const query = querySchema.parse(req.query);
      const rows = await historyService.getHistoryExportRows(query);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=history-export.pdf");

      const doc = new PDFDocument({ margin: 36, size: "A4" });
      doc.pipe(res);

      doc.fontSize(16).text("Inventory History Export");
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown(1);

      const maxRows = 300;
      const printableRows = rows.slice(0, maxRows);

      for (const row of printableRows) {
        doc
          .fontSize(9)
          .text(
            [
              `${row.createdAt}`,
              `type=${row.changeType}`,
              `product=${row.productCode}`,
              `qty=${row.quantity}`,
              `ref=${row.referenceId ?? "-"}`
            ].join(" | ")
          );
      }

      if (rows.length > maxRows) {
        doc.moveDown(1);
        doc.fontSize(9).text(`Truncated ${rows.length - maxRows} rows for PDF size safety.`);
      }

      doc.end();
    } catch (error) {
      return next(error);
    }
  }
};
