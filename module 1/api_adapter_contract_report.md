# API Adapter Contract Compliance Report

- Run ID: E2E-510cdc7e
- Generated At: 2026-04-08T18:17:49.138Z
- Overall Result: PASS
- Total Adapter Tests: 7
- Passed: 7
- Failed: 0

## Contract Endpoints Covered
- GET /api/inventory
- PATCH /api/inventory/:id/quantity
- GET /api/sales/orders
- GET /api/sales/orders/:id/lines
- PUT /api/sales/orders/:id/lines
- POST /api/sales/orders/:id/finalize-dispatch
- GET /api/purchase/orders
- GET /api/purchase/orders/:id/lines
- PUT /api/purchase/orders/:id/lines
- POST /api/purchase/orders/:id/complete
- GET /api/manufacturing/batches
- PATCH /api/manufacturing/batches/:id
- DELETE /api/manufacturing/batches/:id
- POST /api/manufacturing/batches/:id/complete
- GET /api/history
- PATCH /api/history/:id
- POST /api/history/:id/next-stage
- DELETE /api/history/:id
- GET /api/dashboard/metrics
- GET /api/entities
- GET /api/entities/:id
- GET /api/entities/lookup/:entityCode

## Adapter Test Results

### 1. GET /api/inventory returns mapped inventory schema
- Status: PASS
- Output:
```text
{
  "id": "66dbb1c1-28a8-4ec9-a3ca-a4a1d7df8c32",
  "code": "E2E-510cdc7e-RAW",
  "name": "E2E-510cdc7e Raw Material",
  "description": "Raw material for manufacturing",
  "weight": 1,
  "price": 100,
  "quantity": 97,
  "status": "In Stock",
  "lastUpdated": "2026-04-08T18:17:23.657Z"
}
```

### 2. PATCH /api/inventory/:id/quantity returns updated object
- Status: PASS
- Output:
```text
{
  "id": "66dbb1c1-28a8-4ec9-a3ca-a4a1d7df8c32",
  "code": "E2E-510cdc7e-RAW",
  "name": "E2E-510cdc7e Raw Material",
  "description": "Raw material for manufacturing",
  "weight": 1,
  "price": 100,
  "quantity": 99,
  "status": "In Stock",
  "lastUpdated": "2026-04-08T18:17:26.084Z"
}
```

### 3. Sales adapter endpoints: queue + lines + update + finalize
- Status: PASS
- Output:
```text
{
  "id": "4775c832-5af9-4d0e-8365-77d7827a3eb0",
  "customer": "E2E-510cdc7e-CUST-1",
  "customerId": "E2E-510cdc7e-CUST-1",
  "stage": "Dispatch",
  "status": "Dispatched",
  "amount": 780,
  "updated": "2026-04-08T18:17:28.437Z"
}
```

### 4. Purchase adapter endpoints: queue + lines + update + complete
- Status: PASS
- Output:
```text
{
  "id": "a127e663-703f-4c93-880e-43d589766389",
  "supplier": "E2E-510cdc7e-SUP-1",
  "supplierId": "E2E-510cdc7e-SUP-1",
  "stage": "History",
  "status": "Approved",
  "amount": 700,
  "updated": "2026-04-08T18:17:30.412Z"
}
```

### 5. Manufacturing adapter endpoints: list + patch + complete + delete
- Status: PASS
- Output:
```text
{
  "id": "E2E-510cdc7e-ADAPTER-B1",
  "deleted": true
}
```

### 6. History adapter endpoints: list + patch + next-stage + delete
- Status: PASS
- Output:
```text
{
  "totalRows": 16,
  "deleted": {
    "id": "sale:c5cff610-81a2-4e8d-a426-e1df6ce05791",
    "deleted": true
  }
}
```

### 7. Dashboard + Entities adapter endpoints
- Status: PASS
- Output:
```text
{
  "metricsCount": 4,
  "entitiesCount": 20,
  "sampleEntityType": "Customer"
}
```
