import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { AppError, isAppError, mapDatabaseError } from "../../common/errors/AppError";
import { toProductView } from "../../common/presenters";
import { logger } from "../../common/logger";
import { db } from "../../db";
import { NewProduct, products } from "../../db/schema";

export type CreateProductInput = {
  sku: string;
  name: string;
  unit?: string;
  description?: string;
  weight?: number;
  price: number;
  quantity?: number;
  lowStockThreshold?: number;
};

export type UpdateProductInput = Partial<CreateProductInput>;

const mapCreateInput = (input: CreateProductInput): NewProduct => ({
  productCode: input.sku,
  name: input.name,
  unit: input.unit ?? "pcs",
  description: input.description,
  weight: input.weight !== undefined ? input.weight.toString() : undefined,
  price: input.price.toString(),
  quantity: input.quantity ?? 0,
  lowStockThreshold: input.lowStockThreshold ?? 10
});

export const productService = {
  async createProduct(input: CreateProductInput) {
    try {
      const [createdProduct] = await db
        .insert(products)
        .values(mapCreateInput(input))
        .returning();

      return createdProduct;
    } catch (error) {
      logger.error("DB error while creating product", {
        error,
        productCode: input.sku
      });
      throw mapDatabaseError(error, "Failed to create product");
    }
  },

  async listProducts(filters: { page: number; limit: number; q?: string }) {
    try {
      const where = filters.q
        ? and(
            sql`${products.productCode} ilike ${`%${filters.q}%`} or ${products.name} ilike ${
              `%${filters.q}%`
            }`
          )
        : undefined;

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(where ?? sql`true`);

      const rows = await db
        .select()
        .from(products)
        .where(where ?? sql`true`)
        .orderBy(desc(products.updatedAt))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);

      return {
        data: rows.map(toProductView).map((row) => ({
          id: row.id,
          name: row.name,
          sku: row.sku,
          quantity: row.quantity,
          unit: row.unit,
          displayPrice: row.displayPrice,
          lowStockFlag: row.lowStockFlag,
          statusTag: row.statusTag,
          lastUpdated: row.lastUpdated
        })),
        page: filters.page,
        limit: filters.limit,
        total: countRow?.count ?? 0
      };
    } catch (error) {
      logger.error("DB error while listing products", { error });
      throw mapDatabaseError(error, "Failed to list products");
    }
  },

  async getProductById(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND", { productId: id });
    }

    return toProductView(product);
  },

  async updateProduct(id: string, input: UpdateProductInput) {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({
          ...(input.sku ? { productCode: input.sku } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.unit ? { unit: input.unit } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.weight !== undefined ? { weight: input.weight.toString() } : {}),
          ...(input.price !== undefined ? { price: input.price.toString() } : {}),
          ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
          ...(input.lowStockThreshold !== undefined
            ? { lowStockThreshold: input.lowStockThreshold }
            : {}),
          updatedAt: new Date()
        })
        .where(eq(products.id, id))
        .returning();

      if (!updatedProduct) {
        throw new AppError("Product not found", 404, "NOT_FOUND", { productId: id });
      }

      return toProductView(updatedProduct);
    } catch (error) {
      logger.error("DB error while updating product", { error, productId: id });
      if (isAppError(error)) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to update product");
    }
  },

  async deleteProduct(id: string) {
    try {
      const [deletedProduct] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning({ id: products.id, productCode: products.productCode });

      if (!deletedProduct) {
        throw new AppError("Product not found", 404, "NOT_FOUND", { productId: id });
      }

      return deletedProduct;
    } catch (error) {
      logger.error("DB error while deleting product", { error, productId: id });
      if (isAppError(error)) {
        throw error;
      }
      throw mapDatabaseError(error, "Failed to delete product");
    }
  }
};
