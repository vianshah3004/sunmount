import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { AppError } from "../../common/errors/AppError";
import { logger } from "../../common/logger";
import { db } from "../../db";
import { erpOrders, inventoryLogs, products } from "../../db/schema";

type ReorderSuggestion = {
  suggestedQuantity: number;
  reorderWhen: string;
  reasoning: string;
  confidence?: string;
  source: "ai" | "fallback";
};

type QueryIntent = {
  intent: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERSTOCK" | "COUNT_PRODUCTS" | "LIST_PRODUCTS";
  sqlLikeIntent: string;
};

type ProductInsight = {
  productId: string;
  productCode: string;
  name: string;
  quantity: number;
  lowStockThreshold: number;
  soldUnits: number;
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const readGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError("GROQ_API_KEY is missing", 500, "CONFIGURATION_ERROR", {
      env: "GROQ_API_KEY"
    });
  }
  return apiKey;
};

const parseJsonFromText = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T;
  } catch {
    const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
};

const callGroq = async (prompt: string, systemPrompt: string) => {
  const apiKey = readGroqApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      throw new AppError("Groq API request failed", 502, "EXTERNAL_API_ERROR", {
        status: response.status,
        body
      });
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new AppError("Groq response was empty", 502, "EXTERNAL_API_ERROR");
    }

    return content;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if ((error as { name?: string }).name === "AbortError") {
      throw new AppError("Groq API request timed out", 504, "EXTERNAL_API_ERROR");
    }

    throw new AppError("Unable to reach Groq API", 502, "EXTERNAL_API_ERROR", {
      message: (error as { message?: string })?.message
    });
  } finally {
    clearTimeout(timeout);
  }
};

const getFallbackReorderSuggestion = (
  product: {
    quantity: number;
    lowStockThreshold: number;
  },
  salesData: Array<{ unitsSold: number }>
): ReorderSuggestion => {
  const totalUnitsSold = salesData.reduce((sum, point) => sum + point.unitsSold, 0);
  const avgDailySales = salesData.length > 0 ? totalUnitsSold / salesData.length : 0;
  const leadTimeDays = 7;
  const safetyBuffer = Math.max(product.lowStockThreshold * 2, 5);
  const targetStock = Math.ceil(avgDailySales * leadTimeDays + safetyBuffer);
  const suggestedQuantity = Math.max(targetStock - product.quantity, 0);

  return {
    suggestedQuantity,
    reorderWhen: product.quantity <= product.lowStockThreshold ? "Immediately" : "Within 3-5 days",
    reasoning: "Fallback calculation based on average sales, lead time, and safety stock.",
    confidence: "medium",
    source: "fallback"
  };
};

const mapIntentFallback = (userQuery: string): QueryIntent => {
  const normalized = userQuery.toLowerCase();

  if (normalized.includes("low") && normalized.includes("stock")) {
    return {
      intent: "LOW_STOCK",
      sqlLikeIntent: "SELECT * FROM products WHERE quantity < low_stock_threshold"
    };
  }

  if (normalized.includes("out of stock") || normalized.includes("zero stock")) {
    return {
      intent: "OUT_OF_STOCK",
      sqlLikeIntent: "SELECT * FROM products WHERE quantity = 0"
    };
  }

  if (
    normalized.includes("overstock") ||
    normalized.includes("over stock") ||
    normalized.includes("high stock")
  ) {
    return {
      intent: "OVERSTOCK",
      sqlLikeIntent: "SELECT * FROM products WHERE quantity > low_stock_threshold * 3"
    };
  }

  if (normalized.includes("count") || normalized.includes("how many")) {
    return {
      intent: "COUNT_PRODUCTS",
      sqlLikeIntent: "SELECT COUNT(*) FROM products"
    };
  }

  return {
    intent: "LIST_PRODUCTS",
    sqlLikeIntent: "SELECT * FROM products ORDER BY updated_at DESC LIMIT 50"
  };
};

const executeIntent = async (queryIntent: QueryIntent) => {
  switch (queryIntent.intent) {
    case "LOW_STOCK": {
      const rows = await db
        .select({
          id: products.id,
          productCode: products.productCode,
          name: products.name,
          quantity: products.quantity,
          lowStockThreshold: products.lowStockThreshold
        })
        .from(products)
        .where(lt(products.quantity, products.lowStockThreshold))
        .orderBy(products.quantity);

      return {
        resultCount: rows.length,
        rows
      };
    }
    case "OUT_OF_STOCK": {
      const rows = await db
        .select({
          id: products.id,
          productCode: products.productCode,
          name: products.name,
          quantity: products.quantity
        })
        .from(products)
        .where(eq(products.quantity, 0));

      return {
        resultCount: rows.length,
        rows
      };
    }
    case "OVERSTOCK": {
      const rows = await db
        .select({
          id: products.id,
          productCode: products.productCode,
          name: products.name,
          quantity: products.quantity,
          lowStockThreshold: products.lowStockThreshold
        })
        .from(products)
        .where(sql`${products.quantity} > ${products.lowStockThreshold} * 3`)
        .orderBy(desc(products.quantity));

      return {
        resultCount: rows.length,
        rows
      };
    }
    case "COUNT_PRODUCTS": {
      const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(products);
      const count = countRows[0]?.count ?? 0;
      return {
        resultCount: 1,
        rows: [{ totalProducts: count }]
      };
    }
    case "LIST_PRODUCTS":
    default: {
      const rows = await db
        .select({
          id: products.id,
          productCode: products.productCode,
          name: products.name,
          quantity: products.quantity,
          lowStockThreshold: products.lowStockThreshold,
          updatedAt: products.updatedAt
        })
        .from(products)
        .orderBy(desc(products.updatedAt))
        .limit(50);

      return {
        resultCount: rows.length,
        rows
      };
    }
  }
};

const getProductsWithSales = async () => {
  const productRows = await db
    .select({
      id: products.id,
      productCode: products.productCode,
      name: products.name,
      quantity: products.quantity,
      lowStockThreshold: products.lowStockThreshold
    })
    .from(products);

  const salesRows = await db
    .select({
      productId: inventoryLogs.productId,
      soldUnits: sql<number>`coalesce(sum(${inventoryLogs.quantity}), 0)::int`
    })
    .from(inventoryLogs)
    .where(eq(inventoryLogs.changeType, "SALE"))
    .groupBy(inventoryLogs.productId);

  const salesMap = new Map(salesRows.map((row) => [row.productId, row.soldUnits]));

  return productRows.map((product) => ({
    productId: product.id,
    productCode: product.productCode,
    name: product.name,
    quantity: product.quantity,
    lowStockThreshold: product.lowStockThreshold,
    soldUnits: salesMap.get(product.id) ?? 0
  })) satisfies ProductInsight[];
};

export const aiService = {
  callGroq,

  async getReorderSuggestion(productId: string, lookbackDays = 30) {
    const [product] = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        name: products.name,
        quantity: products.quantity,
        lowStockThreshold: products.lowStockThreshold
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND", { productId });
    }

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const salesRows = await db
      .select({
        createdAt: inventoryLogs.createdAt,
        unitsSold: inventoryLogs.quantity
      })
      .from(inventoryLogs)
      .where(
        and(
          eq(inventoryLogs.productId, product.id),
          eq(inventoryLogs.changeType, "SALE"),
          gte(inventoryLogs.createdAt, lookbackDate)
        )
      )
      .orderBy(desc(inventoryLogs.createdAt));

    const salesData = salesRows.map((row) => ({
      date: row.createdAt.toISOString(),
      unitsSold: row.unitsSold
    }));

    const prompt = [
      "Analyze inventory and sales data.",
      "Respond only as JSON with keys: suggestedQuantity (number), reorderWhen (string), reasoning (string), confidence (string).",
      `Product: ${JSON.stringify(product)}`,
      `RecentSalesData: ${JSON.stringify(salesData)}`,
      "Goal: Suggest reorder units and timing to avoid stockout and overstock."
    ].join("\n");

    try {
      const aiRawResponse = await callGroq(
        prompt,
        "You are an operations planning assistant. Return concise, practical inventory recommendations in strict JSON."
      );

      const parsed = parseJsonFromText<{
        suggestedQuantity?: number;
        reorderWhen?: string;
        reasoning?: string;
        confidence?: string;
      }>(aiRawResponse);

      if (!parsed) {
        throw new AppError("Unable to parse AI response", 502, "EXTERNAL_API_ERROR", {
          aiRawResponse
        });
      }

      const fallback = getFallbackReorderSuggestion(product, salesData);

      return {
        product,
        salesData,
        recommendation: {
          suggestedQuantity: parsed.suggestedQuantity ?? fallback.suggestedQuantity,
          reorderWhen: parsed.reorderWhen ?? fallback.reorderWhen,
          reasoning: parsed.reasoning ?? fallback.reasoning,
          confidence: parsed.confidence ?? "medium",
          source: "ai"
        } satisfies ReorderSuggestion
      };
    } catch (error) {
      logger.warn("Falling back to deterministic reorder suggestion", {
        productId,
        reason: (error as { message?: string })?.message
      });

      return {
        product,
        salesData,
        recommendation: getFallbackReorderSuggestion(product, salesData)
      };
    }
  },

  async processUserQuery(userQuery: string) {
    let queryIntent = mapIntentFallback(userQuery);

    const prompt = [
      "Convert this user query into one of the intents: LOW_STOCK, OUT_OF_STOCK, OVERSTOCK, COUNT_PRODUCTS, LIST_PRODUCTS.",
      "Return strict JSON with keys: intent, sqlLikeIntent.",
      `UserQuery: ${userQuery}`
    ].join("\n");

    try {
      const aiRawResponse = await callGroq(
        prompt,
        "You are a SQL intent extraction engine for inventory analytics."
      );
      const aiIntent = parseJsonFromText<QueryIntent>(aiRawResponse);
      if (aiIntent?.intent && aiIntent?.sqlLikeIntent) {
        queryIntent = aiIntent;
      }
    } catch (error) {
      logger.warn("Falling back to rule-based query intent mapping", {
        userQuery,
        reason: (error as { message?: string })?.message
      });
    }

    const executionResult = await executeIntent(queryIntent);

    return {
      userQuery,
      intent: queryIntent.intent,
      sqlLikeIntent: queryIntent.sqlLikeIntent,
      resultCount: executionResult.resultCount,
      results: executionResult.rows
    };
  },

  async generateInsights(productsData?: ProductInsight[]) {
    const dataset = productsData ?? (await getProductsWithSales());
    const [openOrderStats] = await db
      .select({
        pendingCount: sql<number>`count(*)::int`,
        delayedCount:
          sql<number>`count(*) filter (where ${erpOrders.deliveryDate} is not null and ${erpOrders.deliveryDate} < now() and ${erpOrders.status} not in ('COMPLETED','CANCELLED'))::int`
      })
      .from(erpOrders)
      .where(sql`${erpOrders.status} not in ('COMPLETED','CANCELLED')`);

    const prompt = [
      "Analyze this inventory dataset and return JSON.",
      "Required keys: fastMovingProducts (array), slowMovingProducts (array), overstockRisks (array), recommendations (array).",
      `Dataset: ${JSON.stringify(dataset)}`
    ].join("\n");

    try {
      const aiRawResponse = await callGroq(
        prompt,
        "You are an inventory analytics assistant. Return only JSON with actionable business insights."
      );
      const parsed = parseJsonFromText<{
        fastMovingProducts?: unknown[];
        slowMovingProducts?: unknown[];
        overstockRisks?: unknown[];
        recommendations?: string[];
      }>(aiRawResponse);

      if (!parsed) {
        throw new AppError("Unable to parse AI response", 502, "EXTERNAL_API_ERROR");
      }

      return {
        source: "ai",
        datasetSize: dataset.length,
        orderSignals: {
          pendingOrders: openOrderStats?.pendingCount ?? 0,
          delayedOrders: openOrderStats?.delayedCount ?? 0
        },
        insights: {
          fastMovingProducts: parsed.fastMovingProducts ?? [],
          slowMovingProducts: parsed.slowMovingProducts ?? [],
          overstockRisks: parsed.overstockRisks ?? [],
          recommendations: parsed.recommendations ?? []
        }
      };
    } catch (error) {
      logger.warn("Falling back to deterministic inventory insights", {
        reason: (error as { message?: string })?.message
      });

      const fastMovingProducts = dataset
        .filter((item) => item.soldUnits >= 10)
        .map((item) => ({ productCode: item.productCode, soldUnits: item.soldUnits }));
      const slowMovingProducts = dataset
        .filter((item) => item.soldUnits <= 2)
        .map((item) => ({ productCode: item.productCode, soldUnits: item.soldUnits }));
      const overstockRisks = dataset
        .filter((item) => item.quantity > item.lowStockThreshold * 3)
        .map((item) => ({ productCode: item.productCode, quantity: item.quantity }));

      return {
        source: "fallback",
        datasetSize: dataset.length,
        orderSignals: {
          pendingOrders: openOrderStats?.pendingCount ?? 0,
          delayedOrders: openOrderStats?.delayedCount ?? 0
        },
        insights: {
          fastMovingProducts,
          slowMovingProducts,
          overstockRisks,
          recommendations: [
            "Review reorder parameters weekly for fast-moving SKUs.",
            "Run discount or bundling campaigns for slow-moving stock.",
            "Reduce purchase frequency for overstocked products until quantity normalizes.",
            (openOrderStats?.delayedCount ?? 0) > 0
              ? `Prioritize execution for ${openOrderStats?.delayedCount ?? 0} delayed ERP orders.`
              : "No delayed ERP orders detected in current snapshot."
          ]
        }
      };
    }
  }
};
