# Backend E2E Test Report

- Run ID: E2E-510cdc7e
- Generated At: 2026-04-08T18:17:49.135Z
- Overall Result: PASS
- Total Tests: 24
- Passed: 24
- Failed: 0

## Step 1 - System Understanding

### API Endpoints Identified
- GET /health
- GET /api/settings
- PUT /api/settings
- GET /api/settings/health
- GET /api/entities
- GET /api/entities/:id
- GET /api/entities/lookup/:entityCode
- GET /api/customers/:customerId
- GET /api/suppliers/:supplierId
- POST /api/orders/from-entity/:id
- POST /products
- GET /products
- GET /products/:id
- PUT /products/:id
- DELETE /products/:id
- POST /inventory/update
- POST /orders
- GET /orders
- GET /orders/:id
- PUT /orders/:id
- DELETE /orders/:id
- POST /orders/v2
- GET /orders/v2
- GET /orders/v2/:id
- PUT /orders/v2/:id/items
- PUT /orders/v2/:id/status
- POST /manufacturing
- GET /manufacturing
- GET /manufacturing/:id
- PUT /manufacturing/:id
- PUT /manufacturing/:id/status
- POST /manufacturing/:id/complete
- DELETE /manufacturing/:id
- GET /history
- GET /dashboard/summary
- GET /lookup/products
- GET /lookup/customers
- GET /lookup/suppliers
- GET /ai/reorder/:productId
- POST /ai/query
- GET /ai/insights

### Socket Events Identified
- inventory:update
- low_stock
- order:update
- manufacturing:update

### AI Functions Identified
- getReorderSuggestion
- processUserQuery
- generateInsights

### Inventory Update Logic Identified
- SALE decrements stock
- PURCHASE increments stock
- DISPATCHED applies SALE inventory once
- COMPLETED purchase applies PURCHASE inventory once
- WIP completion decrements raw and increments finished
- history filters include sale/purchase/manufacturing

## Step 2 - Full System Flow Execution

### Socket Event Capture Counts
- inventory:update: 31
- low_stock: 1
- order:update: 23
- manufacturing:update: 4

## Test Results (Pass and Fail with Output)

### 1. Health endpoint returns success envelope
- Status: PASS
- Output:
```text
{
  "status": 200,
  "body": {
    "success": true,
    "message": "Service is healthy",
    "data": {
      "status": "ok",
      "timestamp": "2026-04-08T18:17:03.485Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 2. Seed OMS v2 master data and 10 dummy products
- Status: PASS
- Output:
```text
{
  "customerId": "701c1db7-c834-4d43-9c79-d5031c033024",
  "supplierId": "0905ec90-1a89-4da0-895f-f2cc09a4d7b7",
  "seededProducts": 10
}
```

### 3. Sunmount entities and settings endpoints
- Status: PASS
- Output:
```text
{
  "entityCount": 20,
  "draftType": "SALE",
  "healthStatus": "OK",
  "currency": "USD"
}
```

### 4. OMS v2 endpoints create/list/get/update-items/update-status
- Status: PASS
- Output:
```text
{
  "omsSaleOrderId": "02871dac-f3b5-4fe0-84ef-187d18875605",
  "omsPurchaseOrderId": "db2dcb81-f42c-4907-a6c3-cbb66adb07eb",
  "seededItemsEachOrder": 10,
  "sampleQuantityAfterTransitions": 150
}
```

### 5. Create raw product
- Status: PASS
- Output:
```text
{
  "status": 201,
  "productId": "66dbb1c1-28a8-4ec9-a3ca-a4a1d7df8c32",
  "body": {
    "success": true,
    "message": "Product created",
    "data": {
      "id": "66dbb1c1-28a8-4ec9-a3ca-a4a1d7df8c32",
      "productCode": "E2E-510cdc7e-RAW",
      "name": "E2E-510cdc7e Raw Material",
      "unit": "pcs",
      "description": "Raw material for manufacturing",
      "weight": "1.000",
      "price": "100.00",
      "quantity": 100,
      "lowStockThreshold": 15,
      "createdAt": "2026-04-08T18:17:17.251Z",
      "updatedAt": "2026-04-08T18:17:17.251Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 6. Create finished product
- Status: PASS
- Output:
```text
{
  "status": 201,
  "productId": "b26cf060-17e6-43da-b449-1e4b157e2777",
  "body": {
    "success": true,
    "message": "Product created",
    "data": {
      "id": "b26cf060-17e6-43da-b449-1e4b157e2777",
      "productCode": "E2E-510cdc7e-FIN",
      "name": "E2E-510cdc7e Finished Good",
      "unit": "pcs",
      "description": "Finished product",
      "weight": "0.500",
      "price": "250.00",
      "quantity": 10,
      "lowStockThreshold": 5,
      "createdAt": "2026-04-08T18:17:17.318Z",
      "updatedAt": "2026-04-08T18:17:17.318Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 7. Product list and search include created SKUs
- Status: PASS
- Output:
```text
{
  "listCount": 48,
  "searchCount": 12
}
```

### 8. Product detail and update works
- Status: PASS
- Output:
```text
{
  "beforeQty": 100,
  "afterQty": 110
}
```

### 9. Direct inventory update applies PURCHASE increment
- Status: PASS
- Output:
```text
{
  "status": 200,
  "body": {
    "success": true,
    "message": "Inventory updated",
    "data": {
      "productCode": "E2E-510cdc7e-FIN",
      "newQuantity": 12,
      "changeType": "PURCHASE",
      "referenceId": "E2E-510cdc7e-INV-1"
    },
    "meta": null,
    "error": null
  }
}
```

### 10. Sales order create and dispatch updates inventory once
- Status: PASS
- Output:
```text
{
  "orderId": "4775c832-5af9-4d0e-8365-77d7827a3eb0",
  "firstQty": 8,
  "secondQty": 8,
  "body": {
    "success": true,
    "message": "Order status updated",
    "data": {
      "id": "4775c832-5af9-4d0e-8365-77d7827a3eb0",
      "type": "SALE",
      "partyId": "E2E-510cdc7e-CUST-1",
      "items": [
        {
          "productCode": "E2E-510cdc7e-FIN",
          "quantity": 4,
          "price": 250
        }
      ],
      "productCount": 1,
      "subtotal": 1000,
      "currencyFormattedTotal": "₹1,000.00",
      "status": "DISPATCHED",
      "statusLabel": "Dispatched",
      "statusColor": "green",
      "nextActions": [
        "COMPLETED"
      ],
      "orderDate": "2026-04-08T18:17:18.335Z",
      "notes": "sale flow edited",
      "inventoryApplied": true,
      "updatedAt": "2026-04-08T18:17:20.039Z"
    },
    "meta": null,
    "error": null
  },
  "updatedOrder": {
    "id": "4775c832-5af9-4d0e-8365-77d7827a3eb0",
    "type": "SALE",
    "partyId": "E2E-510cdc7e-CUST-1",
    "items": [
      {
        "productCode": "E2E-510cdc7e-FIN",
        "quantity": 4,
        "price": 250
      }
    ],
    "productCount": 1,
    "subtotal": 1000,
    "currencyFormattedTo ...<truncated>
```

### 11. Purchase order completion increments inventory once
- Status: PASS
- Output:
```text
{
  "orderId": "a127e663-703f-4c93-880e-43d589766389",
  "qtyAfterFirst": 117,
  "qtyAfterSecond": 117
}
```

### 12. Manufacturing create, update, complete adjusts raw/finished inventory
- Status: PASS
- Output:
```text
{
  "batch": "E2E-510cdc7e-B1",
  "rawQty": 97,
  "finQty": 23
}
```

### 13. Orders list/detail endpoint
- Status: PASS
- Output:
```text
{
  "orderId": "4775c832-5af9-4d0e-8365-77d7827a3eb0",
  "statusLabel": "Dispatched",
  "formattedTotal": "₹1,000.00"
}
```

### 14. Manufacturing list/detail and delete endpoint
- Status: PASS
- Output:
```text
{
  "deletedBatch": "E2E-510cdc7e-B1",
  "body": {
    "success": true,
    "message": "Manufacturing batch deleted",
    "data": {
      "batchNumber": "E2E-510cdc7e-B1"
    },
    "meta": null,
    "error": null
  }
}
```

### 15. History filters return sale, purchase and manufacturing data
- Status: PASS
- Output:
```text
{
  "saleCount": 25,
  "purchaseCount": 25,
  "manufacturingCount": 8
}
```

### 16. Lookup endpoints return product/customer/supplier suggestions
- Status: PASS
- Output:
```text
{
  "products": 12,
  "customers": 3,
  "suppliers": 2
}
```

### 17. Order delete endpoint
- Status: PASS
- Output:
```text
{
  "deletedOrderId": "4775c832-5af9-4d0e-8365-77d7827a3eb0",
  "errorCodeAfterDelete": "NOT_FOUND"
}
```

### 18. Dashboard summary endpoint returns KPI payload
- Status: PASS
- Output:
```text
{
  "pendingOrders": 20,
  "wipCount": 1,
  "lowStockCount": 0
}
```

### 19. AI query endpoint works with fallback or AI response
- Status: PASS
- Output:
```text
{
  "userQuery": "show low stock products",
  "intent": "LOW_STOCK",
  "sqlLikeIntent": "SELECT * FROM products WHERE stock_level < threshold",
  "resultCount": 0,
  "results": []
}
```

### 20. AI insights endpoint returns structured analytics
- Status: PASS
- Output:
```text
{
  "source": "fallback",
  "datasetSize": 48,
  "recommendations": 4
}
```

### 21. AI reorder endpoint returns recommendation object
- Status: PASS
- Output:
```text
{
  "productCode": "E2E-510cdc7e-RAW",
  "recommendationSource": "fallback",
  "suggestedQuantity": 0
}
```

### 22. Validation errors return global error envelope
- Status: PASS
- Output:
```text
{
  "status": 400,
  "body": {
    "success": false,
    "message": "Invalid request data",
    "data": null,
    "error": {
      "code": "VALIDATION_ERROR",
      "details": [
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "undefined",
          "path": [
            "sku"
          ],
          "message": "Required"
        },
        {
          "code": "too_small",
          "minimum": 0,
          "type": "number",
          "inclusive": true,
          "exact": false,
          "message": "Number must be greater than or equal to 0",
          "path": [
            "price"
          ]
        },
        {
          "requestId": "1ce8e4e7-1d31-4205-a39e-57077113223e"
        }
      ]
    }
  }
}
```

### 23. Socket events are emitted during workflow
- Status: PASS
- Output:
```text
{
  "inventoryUpdateCount": 31,
  "lowStockCount": 1,
  "orderUpdateCount": 23,
  "manufacturingUpdateCount": 4
}
```

### 24. Delete products cleanup endpoints
- Status: PASS
- Output:
```text
{
  "deleted": [
    "b26cf060-17e6-43da-b449-1e4b157e2777",
    "66dbb1c1-28a8-4ec9-a3ca-a4a1d7df8c32"
  ]
}
```
