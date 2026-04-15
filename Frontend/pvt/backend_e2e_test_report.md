# Backend E2E Test Report

- Run ID: E2E-3b567c6e
- Generated At: 2026-04-07T13:47:21.361Z
- Overall Result: PASS
- Total Tests: 21
- Passed: 21
- Failed: 0

## Step 1 - System Understanding

### API Endpoints Identified
- GET /health
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
- inventory:update: 6
- low_stock: 1
- order:update: 6
- manufacturing:update: 2

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
      "timestamp": "2026-04-07T13:47:13.435Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 2. Create raw product
- Status: PASS
- Output:
```text
{
  "status": 201,
  "productId": "1c3f6ef8-637e-49ca-870b-9c681c6145a7",
  "body": {
    "success": true,
    "message": "Product created",
    "data": {
      "id": "1c3f6ef8-637e-49ca-870b-9c681c6145a7",
      "productCode": "E2E-3b567c6e-RAW",
      "name": "E2E-3b567c6e Raw Material",
      "unit": "pcs",
      "description": "Raw material for manufacturing",
      "weight": "1.000",
      "price": "100.00",
      "quantity": 100,
      "lowStockThreshold": 15,
      "createdAt": "2026-04-07T13:47:13.494Z",
      "updatedAt": "2026-04-07T13:47:13.494Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 3. Create finished product
- Status: PASS
- Output:
```text
{
  "status": 201,
  "productId": "2c7ac122-8639-4f75-8596-08f9dbc7b0be",
  "body": {
    "success": true,
    "message": "Product created",
    "data": {
      "id": "2c7ac122-8639-4f75-8596-08f9dbc7b0be",
      "productCode": "E2E-3b567c6e-FIN",
      "name": "E2E-3b567c6e Finished Good",
      "unit": "pcs",
      "description": "Finished product",
      "weight": "0.500",
      "price": "250.00",
      "quantity": 10,
      "lowStockThreshold": 5,
      "createdAt": "2026-04-07T13:47:13.571Z",
      "updatedAt": "2026-04-07T13:47:13.571Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 4. Product list and search include created SKUs
- Status: PASS
- Output:
```text
{
  "listCount": 4,
  "searchCount": 2
}
```

### 5. Product detail and update works
- Status: PASS
- Output:
```text
{
  "beforeQty": 100,
  "afterQty": 110
}
```

### 6. Direct inventory update applies PURCHASE increment
- Status: PASS
- Output:
```text
{
  "status": 200,
  "body": {
    "success": true,
    "message": "Inventory updated",
    "data": {
      "productCode": "E2E-3b567c6e-FIN",
      "newQuantity": 12,
      "changeType": "PURCHASE",
      "referenceId": "E2E-3b567c6e-INV-1"
    },
    "meta": null,
    "error": null
  }
}
```

### 7. Sales order create and dispatch updates inventory once
- Status: PASS
- Output:
```text
{
  "orderId": "4951d4bf-18b4-42e2-8048-2aef26951cbc",
  "firstQty": 9,
  "secondQty": 9,
  "body": {
    "success": true,
    "message": "Order status updated",
    "data": {
      "id": "4951d4bf-18b4-42e2-8048-2aef26951cbc",
      "type": "SALE",
      "partyId": "E2E-3b567c6e-CUST-1",
      "items": [
        {
          "price": 250,
          "quantity": 3,
          "productCode": "E2E-3b567c6e-FIN"
        }
      ],
      "productCount": 1,
      "subtotal": 750,
      "currencyFormattedTotal": "₹750.00",
      "status": "DISPATCHED",
      "statusLabel": "Dispatched",
      "statusColor": "green",
      "nextActions": [
        "COMPLETED"
      ],
      "orderDate": "2026-04-07T13:47:14.367Z",
      "notes": "sale flow",
      "inventoryApplied": true,
      "updatedAt": "2026-04-07T13:47:14.683Z"
    },
    "meta": null,
    "error": null
  }
}
```

### 8. Purchase order completion increments inventory once
- Status: PASS
- Output:
```text
{
  "orderId": "12f084bb-7596-4244-8250-42d491949c49",
  "qtyAfterFirst": 117,
  "qtyAfterSecond": 117
}
```

### 9. Manufacturing create, update, complete adjusts raw/finished inventory
- Status: PASS
- Output:
```text
{
  "batch": "E2E-3b567c6e-B1",
  "rawQty": 97,
  "finQty": 24
}
```

### 10. Orders list/detail endpoint
- Status: PASS
- Output:
```text
{
  "orderId": "4951d4bf-18b4-42e2-8048-2aef26951cbc",
  "statusLabel": "Dispatched",
  "formattedTotal": "₹750.00"
}
```

### 11. Manufacturing list/detail and delete endpoint
- Status: PASS
- Output:
```text
{
  "deletedBatch": "E2E-3b567c6e-B1",
  "body": {
    "success": true,
    "message": "Manufacturing batch deleted",
    "data": {
      "batchNumber": "E2E-3b567c6e-B1"
    },
    "meta": null,
    "error": null
  }
}
```

### 12. History filters return sale, purchase and manufacturing data
- Status: PASS
- Output:
```text
{
  "saleCount": 3,
  "purchaseCount": 2,
  "manufacturingCount": 2
}
```

### 13. Lookup endpoints return product/customer/supplier suggestions
- Status: PASS
- Output:
```text
{
  "products": 2,
  "customers": 1,
  "suppliers": 1
}
```

### 14. Order delete endpoint
- Status: PASS
- Output:
```text
{
  "deletedOrderId": "4951d4bf-18b4-42e2-8048-2aef26951cbc",
  "errorCodeAfterDelete": "NOT_FOUND"
}
```

### 15. Dashboard summary endpoint returns KPI payload
- Status: PASS
- Output:
```text
{
  "pendingOrders": 1,
  "wipCount": 0,
  "lowStockCount": 0
}
```

### 16. AI query endpoint works with fallback or AI response
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

### 17. AI insights endpoint returns structured analytics
- Status: PASS
- Output:
```text
{
  "source": "ai",
  "datasetSize": 4,
  "recommendations": 3
}
```

### 18. AI reorder endpoint returns recommendation object
- Status: PASS
- Output:
```text
{
  "productCode": "E2E-3b567c6e-RAW",
  "recommendationSource": "fallback",
  "suggestedQuantity": 0
}
```

### 19. Validation errors return global error envelope
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
          "requestId": "80c00f92-b386-492d-a918-d9c1e6631fe0"
        }
      ]
    }
  }
}
```

### 20. Socket events are emitted during workflow
- Status: PASS
- Output:
```text
{
  "inventoryUpdateCount": 6,
  "lowStockCount": 1,
  "orderUpdateCount": 6,
  "manufacturingUpdateCount": 2
}
```

### 21. Delete products cleanup endpoints
- Status: PASS
- Output:
```text
{
  "deleted": [
    "2c7ac122-8639-4f75-8596-08f9dbc7b0be",
    "1c3f6ef8-637e-49ca-870b-9c681c6145a7"
  ]
}
```
