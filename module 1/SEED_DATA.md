# Database Seed Script Guide

This guide explains how to populate your database with sample data for development and testing.

## Quick Start

### 1. Run the Default Seed

The easiest way to seed the database with default data:

```bash
npx tsx seedDatabase.ts
```

This will automatically insert:
- **3 Customers** with order contact info
- **3 Suppliers** with supply chain details
- **8 Products** (4 raw materials, 4 finished goods)
- **5 Orders** (3 sales orders, 2 purchase orders)
- **2 Manufacturing Batches**
- **1 Settings** entry (company config)

### 2. Customize Seed Parameters

You can customize what and how much data gets seeded:

```bash
# Seed 10 products, 5 customers, skip manufacturing
npx tsx seedDatabase.ts productCount=10 customerCount=5 includeManufacturing=false

# Seed only products and customers, no orders
npx tsx seedDatabase.ts includeOrders=false

# Full dataset with more products
npx tsx seedDatabase.ts productCount=20 customerCount=10 supplierCount=10
```

Available options:
- `productCount` - Number of products to create (default: 8)
- `customerCount` - Number of customers to create (default: 3)
- `supplierCount` - Number of suppliers to create (default: 3)
- `includeOrders` - Create sample orders (default: true)
- `includeManufacturing` - Create manufacturing batches (default: true)

### 3. View Data on Dashboard

After running the seed script:

```bash
# 1. Start the server
npm run dev

# 2. Open dashboard in browser
# http://localhost:3000 (or your configured port)

# 3. Check the following sections:
# - Dashboard: View KPIs and pending orders
# - Products: See all seeded products with inventory
# - Orders: View sales and purchase orders
# - Manufacturing: See batch production data
```

## What Gets Seeded

### Products
- **Raw Materials**: Prefixed with `RM`, start with 100+ quantity, prices 50-90
- **Finished Goods**: Prefixed with `FG`, start with 30+ quantity, prices 200-400

### Orders
- **Sales Orders** (SALE type): 3 orders in various statuses (QUOTATION, APPROVED, DISPATCHED)
- **Purchase Orders** (PURCHASE type): 2 orders in various statuses

### Customers & Suppliers
- Random contact information for realistic demo data
- Unique codes generated with timestamp to prevent duplicates on multiple runs

### Manufacturing
- Links raw materials to finished goods
- Shows production workflow (IN_PROGRESS, COMPLETED states)

## Important Notes

✅ **Each run is unique** - The seed script uses timestamps to ensure no duplicate keys, so you can run it multiple times

✅ **Non-destructive** - Seeding only adds data, doesn't delete existing records

✅ **Dashboard-ready** - All seeded data automatically appears in KPI calculations and dashboards

⚠️ **Foreign Key Constraints** - Orders reference actual products/customers/suppliers that are seeded first

## Example Workflow

```bash
# 1. Setup database with migrations
npx drizzle-kit migrate

# 2. Seed initial data
npx tsx seedDatabase.ts

# 3. Start development server
npm run dev

# 4. View data at http://localhost:3000/dashboard/summary

# 5. Later, add more data without affecting existing data
npx tsx seedDatabase.ts productCount=15 customerCount=8
```

## Troubleshooting

**Error: "violates not-null constraint"**
- Verify database migrations have run: `npx drizzle-kit migrate`

**Error: "foreign key constraint failed"**
- Check that customers/suppliers/products are seeded before orders

**No data appears on dashboard**
- Ensure the server is running: `npm run dev`
- Check browser console for API errors
- Verify database connection in `.env`

## API Endpoints to Test Seeded Data

```bash
# Get all products
curl http://localhost:3000/products

# Get customer orders
curl http://localhost:3000/orders

# Get manufacturing batches
curl http://localhost:3000/manufacturing

# Get dashboard summary
curl http://localhost:3000/dashboard/summary

# Search products
curl http://localhost:3000/lookup/products?q=SEED
```

---

**Next Step**: Run the seed script and view your data on the Dashboard! 🚀
