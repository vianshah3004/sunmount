# Backend API Adoption Guide

Compared inputs:
- Backend test evidence: [backend_e2e_test_report.md](backend_e2e_test_report.md)
- Frontend contract: [FRONTEND_BACKEND_HANDOFF.md](FRONTEND_BACKEND_HANDOFF.md)
- Execution checklist: [BACKEND_TASK_CHECKLIST.md](BACKEND_TASK_CHECKLIST.md)

## 1. Executive Summary

Current backend is strong and test-verified.
- 21 of 21 E2E tests passed.
- Core domains already working: products, inventory update, orders, manufacturing, history, lookup.

Main integration reality:
- You can reuse most backend capability.
- You need endpoint reshaping and response adapters for frontend route-specific contracts.
- Only a few areas are truly missing (settings, notifications, some route-specific aliases).

## 2. Reuse Decision Matrix

### 2.1 Can be used directly (or near-direct)
- GET /history
- GET /manufacturing
- GET /manufacturing/:id
- PUT /manufacturing/:id
- POST /manufacturing/:id/complete
- DELETE /manufacturing/:id
- GET /lookup/customers
- GET /lookup/suppliers
- GET /lookup/products

Action:
- Add query params for frontend sorting/filtering/search where not present.

### 2.2 Reuse with adapter (recommended)
- GET /products -> frontend inventory list contract
- POST /inventory/update -> frontend PATCH inventory quantity action
- GET /orders -> split/alias as sales and purchase queues
- GET /orders/:id -> order detail modal and line items
- PUT /orders/:id -> status transitions and line updates
- GET /dashboard/summary -> dashboard metrics transform

Action:
- Keep backend logic, add BFF/controller mapping layer to match frontend payload names.

### 2.3 New endpoints required (small scope)
- GET /settings
- PUT /settings
- GET /settings/health
- GET /notifications
- POST /notifications/mark-all-read
- POST /api/orders/from-entity/:id (if create from customer/supplier is needed immediately)

Action:
- Implement as thin modules first with simple persistence.

## 3. Contract Gaps You Must Fix

## 3.1 Path and namespace mismatch
Frontend spec currently expects /api/* paths.
Backend report shows non-prefixed routes.

Guide:
- Choose one:
1. Add /api prefix routing in backend.
2. Configure frontend base URL/rewrite to current paths.

Recommended:
- Add /api alias now to prevent future routing drift.

## 3.2 Field name mismatch
Examples from report vs frontend expectation:
- productCode vs code
- price as string in product creation response vs numeric price required by UI
- order type and status labels are backend-centric uppercase while UI expects display-friendly enums

Guide:
- Normalize in one place (adapter layer).
- Always return UI contract fields to frontend pages.

## 3.3 Money formatting mismatch
Report includes currencyFormattedTotal string.
Frontend expects numeric money and formats client-side.

Guide:
- Keep formatted value optional, but always return numeric subtotal/total fields.
- Do not rely on formatted string for calculations.

## 3.4 Route-specific split mismatch
Frontend has separate sales and purchase screens.
Backend has generic orders endpoints.

Guide:
- Add filtered aliases:
- GET /api/sales/orders => GET /orders?type=SALE
- GET /api/purchase/orders => GET /orders?type=PURCHASE
- POST /api/sales/orders/:id/finalize-dispatch => PUT /orders/:id with status transition
- POST /api/purchase/orders/:id/complete => PUT /orders/:id with status transition

## 4. Endpoint Mapping (What to move and how)

## 4.1 Inventory
Frontend need:
- GET /api/inventory
- PATCH /api/inventory/{id}/quantity

Use:
- GET /products
- POST /inventory/update

Adapter mapping:
- id <- id
- code <- productCode
- name <- name
- description <- description
- weight <- weight
- price <- Number(price)
- quantity <- quantity
- status <- derive from quantity and threshold
- lastUpdated <- updatedAt

Mutation mapping:
- PATCH /api/inventory/{id}/quantity with delta/reason
- Convert reason:
- adjust -> PURCHASE or SALE based on delta sign
- reorder -> PURCHASE
- dispatch -> SALE

## 4.2 Sales and Purchase queues
Frontend need:
- GET /api/sales/orders
- GET /api/purchase/orders
- line item endpoints

Use:
- GET /orders
- GET /orders/:id
- PUT /orders/:id
- POST /orders

Adapter mapping:
- customer/supplier names from party lookup
- amount <- subtotal or total numeric field
- updated <- updatedAt
- stage/status map from backend status to UI labels

## 4.3 Manufacturing
Frontend need mostly matches existing backend.

Use:
- GET/PUT/DELETE /manufacturing and complete endpoint

Adapter mapping:
- id <- batchNumber or id
- title <- processName or title
- progress <- progress
- materials <- rawMaterials[]
- output <- outputQty summary
- operator <- operator
- eta <- eta
- lastUpdated <- updatedAt

## 4.4 History
Frontend need:
- type/status/search/sort query support
- PATCH and next-stage operations

Use:
- GET /history (already validated for sale/purchase/manufacturing)
- Reuse order/manufacturing transitions for next-stage action

Adapter strategy:
- GET /api/history maps to /history and normalizes fields id,type,party,value,status,date,note

## 4.5 Dashboard
Frontend need:
- metrics cards and top 3 recent records

Use:
- GET /dashboard/summary
- GET /history?limit=3

Adapter:
- Convert summary fields to dashboard card array { label, value, delta, icon, tone }

## 4.6 Entity lookup and composer
Frontend need:
- GET /api/entities/lookup/{entityCode}
- draft and submit endpoints

Use:
- GET /lookup/customers and /lookup/suppliers
- POST /orders

Guide:
- Add a single lookup endpoint that probes customer/supplier by code and returns unified object.
- Keep draft as status DRAFT order type in orders table if separate draft storage is not ready.

## 5. Recommended Integration Order

## Phase 1 (fastest visible progress)
- Inventory list and quantity mutation
- Sales queue and Purchase queue via filtered orders aliases
- History list endpoint normalization

Outcome:
- Main operational screens become API-backed quickly.

## Phase 2
- Manufacturing edit/remove/complete flow full binding
- Entity lookup unification
- Order composer draft/submit binding

## Phase 3
- Dashboard metrics adapter
- Settings APIs
- Notifications APIs
- Order detail modal API binding

## 6. Adapter Layer Blueprint

Create a small translation layer in backend (or BFF):
- inventory.adapter
- orders.adapter
- manufacturing.adapter
- history.adapter
- dashboard.adapter

Responsibilities:
- Field renaming
- Enum normalization
- Number coercion for price/amount
- Date normalization

This keeps domain logic unchanged while matching frontend contract exactly.

## 7. Risks and Guardrails

Risks:
- Status enum drift between screens
- String price values leaking into frontend calculations
- Duplicate inventory application during status transitions

Guardrails:
- Central enum map file used by adapters
- Schema validation for outgoing API payloads
- Keep idempotency checks already validated in E2E flow (inventory applied once)

## 8. Done Criteria for Adoption

Adoption complete when:
- All active routes in [src/App.jsx](src/App.jsx) render API data.
- No page depends on mock data for core workflows.
- Money/date values are consistently typed and formatted client-side.
- Existing E2E tests still pass after adapter/alias additions.

## 9. Immediate Action Plan for Your Backend Friend

1. Implement /api aliases for existing working endpoints.
2. Add adapter responses for products, orders, history, dashboard.
3. Add missing settings and notifications endpoints.
4. Keep existing business logic unchanged; only shape contracts.
5. Re-run backend E2E suite, then run frontend integration smoke tests.
