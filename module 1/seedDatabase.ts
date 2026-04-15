/**
 * Database Seed Script
 * Populates the database with realistic sample data for development/testing
 * Run with: npx tsx seedDatabase.ts
 */

import { db } from "./src/db";
import {
  customers,
  suppliers,
  products,
  erpOrders,
  erpOrderItems,
  manufacturingBatches,
  settings
} from "./src/db/schema";

const SEED_PREFIX = "SEED";

const SEED_RUN = Date.now().toString().slice(-8);
const SEED_CODE = `${SEED_PREFIX}-${SEED_RUN}`;

interface SeedConfig {
  includeOrders?: boolean;
  includeManufacturing?: boolean;
  productCount?: number;
  customerCount?: number;
  supplierCount?: number;
}

const defaultConfig: SeedConfig = {
  includeOrders: true,
  includeManufacturing: true,
  productCount: 8,
  customerCount: 3,
  supplierCount: 3
};

async function seedSettings() {
  console.log("🔧 Seeding settings...");
  try {
    // Settings has a singleton pattern, try to upsert with ID 1
    await db
      .insert(settings)
      .values({
        id: 1,
        organization: "Manufacturing Demo Corp",
        primaryContactEmail: "admin@manufdemo.com",
        currency: "INR",
        timezone: "Asia/Kolkata"
      })
      .onConflictDoUpdate({
        target: settings.id,
        set: {
          organization: "Manufacturing Demo Corp",
          primaryContactEmail: "admin@manufdemo.com",
          currency: "INR",
          timezone: "Asia/Kolkata"
        }
      });

    console.log("✓ Settings seeded/updated");
  } catch (error) {
    console.error("⚠ Settings seed skipped (entry may already exist)");
  }
}

async function seedCustomers(count: number) {
  console.log(`🏢 Seeding ${count} customers...`);
  try {
    const customerList = [];
    for (let i = 1; i <= count; i++) {
      customerList.push({
        customerCode: `${SEED_CODE}-C${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `98765${String(i).padStart(5, "0")}`,
        taxId: `TAX${String(i).padStart(8, "0")}`,
        metadata: {
          address: `${i} Business Street, City`,
          city: "Metro",
          state: "State"
        }
      });
    }

    const inserted = await db.insert(customers).values(customerList).returning();
    console.log(`✓ ${inserted.length} customers seeded`);
    return inserted;
  } catch (error) {
    console.error("✗ Customers seed failed:", error);
    return [];
  }
}

async function seedSuppliers(count: number) {
  console.log(`🏭 Seeding ${count} suppliers...`);
  try {
    const supplierList = [];
    for (let i = 1; i <= count; i++) {
      supplierList.push({
        supplierCode: `${SEED_CODE}-S${i}`,
        name: `Supplier ${i}`,
        email: `supplier${i}@example.com`,
        phone: `97654${String(i).padStart(5, "0")}`,
        taxId: `STAX${String(i).padStart(7, "0")}`,
        metadata: {
          address: `${i} Supply Street, Industry Zone`,
          city: "Manufacturing Hub",
          state: "State"
        }
      });
    }

    const inserted = await db.insert(suppliers).values(supplierList).returning();
    console.log(`✓ ${inserted.length} suppliers seeded`);
    return inserted;
  } catch (error) {
    console.error("✗ Suppliers seed failed:", error);
    return [];
  }
}

async function seedProducts(count: number) {
  console.log(`📦 Seeding ${count} products...`);
  try {
    const productList = [];

    // Raw materials
    for (let i = 1; i <= Math.floor(count / 2); i++) {
      productList.push({
        productCode: `${SEED_CODE}-RM${i}`,
        name: `Raw Material ${i}`,
        unit: "kg",
        description: `Raw material for production`,
        weight: String(1 + i * 0.5),
        price: String(50 + i * 10),
        quantity: 100 + i * 20,
        lowStockThreshold: 20
      });
    }

    // Finished goods
    for (let i = 1; i <= Math.floor(count / 2); i++) {
      productList.push({
        productCode: `${SEED_CODE}-FG${i}`,
        name: `Finished Good ${i}`,
        unit: "pcs",
        description: `Finished product, ready for sale`,
        weight: String(0.5 + i * 0.25),
        price: String(200 + i * 50),
        quantity: 30 + i * 10,
        lowStockThreshold: 10
      });
    }

    const inserted = await db.insert(products).values(productList).returning();
    console.log(`✓ ${inserted.length} products seeded`);
    return inserted;
  } catch (error) {
    console.error("✗ Products seed failed:", error);
    return [];
  }
}

async function seedOrders(
  customerIds: string[],
  supplierIds: string[],
  productList: typeof products.$inferSelect[]
) {
  console.log("📋 Seeding orders...");
  try {
    if (customerIds.length === 0 || supplierIds.length === 0 || productList.length === 0) {
      console.log("⚠ Skipping orders: missing customers, suppliers, or products");
      return;
    }

    // Create a few sales orders
    for (let i = 0; i < 3; i++) {
      const customerId = customerIds[i % customerIds.length];
      const midPoint = Math.floor(productList.length / 2);
      const selectedProducts = productList.slice(midPoint).slice(0, 2); // Use finished goods

      if (selectedProducts.length === 0) continue;

      const totalAmount = selectedProducts.reduce((sum, p) => sum + (5 + i) * Number(p.price), 0);

      const [order] = await db
        .insert(erpOrders)
        .values({
          orderNumber: `SO-${SEED_PREFIX}-${Date.now()}-${i}`,
          type: "SALE",
          status: ["QUOTATION", "APPROVED", "DISPATCHED"][i % 3] as any,
          paymentStatus: "UNPAID",
          customerId,
          subtotalAmount: String(totalAmount),
          grandTotal: String(totalAmount),
          notes: `Sales order ${i + 1}`,
          isDraft: false
        })
        .returning();

      if (order) {
        for (const product of selectedProducts) {
          await db.insert(erpOrderItems).values({
            orderId: order.id,
            lineNumber: selectedProducts.indexOf(product) + 1,
            productId: product.id,
            sku: product.productCode,
            name: product.name,
            quantity: 5 + i,
            unitPrice: String(product.price),
            discountAmount: "0",
            taxRate: "0",
            taxAmount: "0",
            lineTotal: String((5 + i) * Number(product.price))
          });
        }
      }
    }

    // Create a few purchase orders
    for (let i = 0; i < 2; i++) {
      const supplierId = supplierIds[i % supplierIds.length];
      const midPoint = Math.floor(productList.length / 2);
      const selectedProducts = productList.slice(0, midPoint).slice(0, 2); // Use raw materials

      if (selectedProducts.length === 0) continue;

      const totalAmount = selectedProducts.reduce((sum, p) => sum + (10 + i * 5) * Number(p.price), 0);

      const [order] = await db
        .insert(erpOrders)
        .values({
          orderNumber: `PO-${SEED_PREFIX}-${Date.now()}-${i}`,
          type: "PURCHASE",
          status: ["QUOTATION", "APPROVED"][i % 2] as any,
          paymentStatus: "UNPAID",
          supplierId,
          subtotalAmount: String(totalAmount),
          grandTotal: String(totalAmount),
          notes: `Purchase order ${i + 1}`,
          isDraft: false
        })
        .returning();

      if (order) {
        for (const product of selectedProducts) {
          await db.insert(erpOrderItems).values({
            orderId: order.id,
            lineNumber: selectedProducts.indexOf(product) + 1,
            productId: product.id,
            sku: product.productCode,
            name: product.name,
            quantity: 10 + i * 5,
            unitPrice: String(product.price),
            discountAmount: "0",
            taxRate: "0",
            taxAmount: "0",
            lineTotal: String((10 + i * 5) * Number(product.price))
          });
        }
      }
    }

    console.log("✓ Orders seeded");
  } catch (error) {
    console.error("✗ Orders seed failed:", error);
  }
}

async function seedManufacturing(productList: typeof products.$inferSelect[]) {
  console.log("⚙️ Seeding manufacturing batches...");
  try {
    if (productList.length < 2) {
      console.log("⚠ Skipping manufacturing: need at least 2 products");
      return;
    }

    const midPoint = Math.floor(productList.length / 2);
    const rawMaterials = productList.slice(0, midPoint);
    const finishedGoods = productList.slice(midPoint);

    if (rawMaterials.length === 0 || finishedGoods.length === 0) {
      console.log("⚠ Skipping manufacturing: need both raw materials and finished goods");
      return;
    }

    for (let i = 0; i < 2; i++) {
      const rawMaterial = rawMaterials[i % rawMaterials.length];
      const finishedGood = finishedGoods[i % finishedGoods.length];

      await db
        .insert(manufacturingBatches)
        .values({
          batchNumber: `${SEED_CODE}-B${i + 1}`,
          status: ["IN_PROGRESS", "COMPLETED"][i % 2] as any,
          rawMaterials: [{ productCode: rawMaterial.productCode, quantity: 50 - i * 10 }],
          outputProducts: [{ productCode: finishedGood.productCode, quantity: 20 - i * 5 }],
          notes: `Manufacturing batch ${i + 1}`
        })
        .returning();
    }

    console.log("✓ Manufacturing batches seeded");
  } catch (error) {
    console.error("✗ Manufacturing seed failed:", error);
  }
}

async function main() {
  console.log("\n🌱 Starting Database Seed...\n");

  const config: SeedConfig = {
    ...defaultConfig,
    ...Object.fromEntries(
      process.argv
        .slice(2)
        .map((arg) => {
          const [key, value] = arg.split("=");
          return [key, isNaN(Number(value)) ? value : Number(value)];
        })
    )
  };

  console.log("📊 Seed Configuration:", config);
  console.log("");

  try {
    // Seed core data
    await seedSettings();
    const seededCustomers = await seedCustomers(config.customerCount || 3);
    const seededSuppliers = await seedSuppliers(config.supplierCount || 3);
    const seededProducts = await seedProducts(config.productCount || 8);

    const customerIds = seededCustomers.map((c) => c.id);
    const supplierIds = seededSuppliers.map((s) => s.id);

    // Seed optional data
    if (config.includeOrders) {
      await seedOrders(customerIds, supplierIds, seededProducts);
    }

    if (config.includeManufacturing) {
      await seedManufacturing(seededProducts);
    }

    console.log("\n✅ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`  - Settings: 1 entry`);
    console.log(`  - Customers: ${seededCustomers.length}`);
    console.log(`  - Suppliers: ${seededSuppliers.length}`);
    console.log(`  - Products: ${seededProducts.length}`);
    console.log(`  - Orders: ${config.includeOrders ? "5" : "0"}`);
    console.log(`  - Manufacturing Batches: ${config.includeManufacturing ? "2" : "0"}`);
    console.log("\n💡 You can now view this data on the Dashboard!\n");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
