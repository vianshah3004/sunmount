# Backend Task Checklist for Frontend Integration

Reference: [FRONTEND_BACKEND_HANDOFF.md](FRONTEND_BACKEND_HANDOFF.md)

## 1. Setup and Standards

- [ ] Define shared response envelope (or confirm plain JSON resource responses)
- [ ] Confirm all money fields are numbers (no currency symbols)
- [ ] Confirm all date fields are ISO strings
- [ ] Define enum constants matching frontend values
- [ ] Add pagination support for list endpoints (page, pageSize, total)
- [ ] Add search, sort, and filter query support where required

Acceptance:
- All payloads serialize with stable keys expected by UI.
- Enums match names used in [src/lib/srsData.js](src/lib/srsData.js).

## 2. Dashboard

Endpoints:
- [ ] GET /api/dashboard/metrics
- [ ] GET /api/dashboard/quick-modules (optional if static)
- [ ] GET /api/history?limit=3&sort=date_desc

Tasks:
- [ ] Return metric cards with label, value, delta, icon, tone
- [ ] Return recent history records for dashboard panel

Acceptance:
- Dashboard loads without mock data and shows 3 recent movements.

## 3. Inventory

Endpoints:
- [ ] GET /api/inventory?search=&status=&sort=&order=
- [ ] PATCH /api/inventory/{id}/quantity

Tasks:
- [ ] Implement inventory list payload fields
- [ ] Implement status filtering and column sorting server-side
- [ ] Implement quantity delta update with reason: adjust | reorder | dispatch
- [ ] Return updated inventory item after PATCH

Acceptance:
- Inventory page search/sort/filter works with backend data.
- Adjust Stock, Reorder, Dispatch update quantity and lastUpdated correctly.

## 4. Sales

Endpoints:
- [ ] GET /api/sales/orders?search=&sort=&order=
- [ ] GET /api/customers/{customerId}
- [ ] GET /api/sales/orders/{id}/lines
- [ ] PUT /api/sales/orders/{id}/lines
- [ ] POST /api/sales/orders/{id}/finalize-dispatch

Tasks:
- [ ] Return sales queue with stage, status, amount, updated
- [ ] Implement customer lookup by customerId for autofill
- [ ] Implement line item read/update for unlimited rows
- [ ] Implement finalize-dispatch transition

Acceptance:
- Sales queue renders and sort works.
- Editing lines persists and totals recompute in UI.
- Finalize action moves order state as expected.

## 5. Purchase

Endpoints:
- [ ] GET /api/purchase/orders?search=&sort=&order=
- [ ] GET /api/suppliers/{supplierId}
- [ ] GET /api/purchase/orders/{id}/lines
- [ ] PUT /api/purchase/orders/{id}/lines
- [ ] POST /api/purchase/orders/{id}/complete

Tasks:
- [ ] Return purchase queue with stage/status/amount/updated
- [ ] Implement supplier lookup by supplierId
- [ ] Implement purchase line item read/update
- [ ] Implement complete purchase transition

Acceptance:
- Purchase queue and detail panel are fully backend-backed.
- Complete Purchase action updates status and appears in history.

## 6. Manufacturing

Endpoints:
- [ ] GET /api/manufacturing/batches?search=&status=&sort=&order=
- [ ] PATCH /api/manufacturing/batches/{id}
- [ ] DELETE /api/manufacturing/batches/{id}
- [ ] POST /api/manufacturing/batches/{id}/complete

Tasks:
- [ ] Return WIP batch list with materials, progress, operator, eta
- [ ] Implement edit batch fields: title, output, eta
- [ ] Implement remove batch
- [ ] Implement mark-complete to set progress 100 and status Completed

Acceptance:
- WIP list supports search/filter/sort from backend.
- Edit/Remove/Mark Complete actions persist and refresh correctly.

## 7. History

Endpoints:
- [ ] GET /api/history?type=&status=&search=&sort=&order=
- [ ] PATCH /api/history/{id}
- [ ] POST /api/history/{id}/next-stage
- [ ] DELETE /api/history/{id}

Tasks:
- [ ] Return history records for all types: Sales/Purchase/Manufacturing
- [ ] Support type chips and status filter
- [ ] Support sortable fields: date, status, type, value
- [ ] Implement record edit (status, note)
- [ ] Implement next-stage transition by type
- [ ] Implement delete

Acceptance:
- History page list and detail actions work fully with API.
- CSV/PDF export still works on API-fed data.

## 8. Customers and Suppliers

Endpoints:
- [ ] GET /api/entities?type=customer,supplier&search=
- [ ] GET /api/entities/{id}
- [ ] PATCH /api/entities/{id}
- [ ] DELETE /api/entities/{id}
- [ ] POST /api/orders/from-entity/{id}

Tasks:
- [ ] Return unified customer/supplier list with type field
- [ ] Implement edit and delete
- [ ] Implement create-order-from-entity shortcut

Acceptance:
- Master/detail works using API entities only.
- Create Order action returns valid draft/order reference.

## 9. Settings

Endpoints:
- [ ] GET /api/settings
- [ ] PUT /api/settings
- [ ] GET /api/settings/health

Tasks:
- [ ] Return org, timezone, contact email
- [ ] Return security flags and sync health stats
- [ ] Save settings changes

Acceptance:
- Settings page loads/saves persistent values.
- Health card reflects live backend state.

## 10. Order Composer

Endpoints:
- [ ] GET /api/entities/lookup/{entityCode}
- [ ] POST /api/orders/draft
- [ ] POST /api/orders/submit

Tasks:
- [ ] Implement entity code lookup for customer/supplier name
- [ ] Save draft with unlimited line items and notes
- [ ] Submit order and return final order reference

Acceptance:
- Composer can save draft and submit without mock data.

## 11. Shared Components

Notification panel:
- [ ] GET /api/notifications
- [ ] POST /api/notifications/mark-all-read

Order detail modal:
- [ ] GET /api/orders/{id}
- [ ] PATCH /api/orders/{id}
- [ ] DELETE /api/orders/{id}
- [ ] POST /api/orders/{id}/next-stage

Acceptance:
- Overlay components render backend data and actions persist.

## 12. Integration Sequence (Recommended)

- [ ] Phase 1: Inventory, Sales queue, Purchase queue, History list
- [ ] Phase 2: Manufacturing actions, entity lookup, composer draft/submit
- [ ] Phase 3: Settings persistence, notifications, order detail modal
- [ ] Phase 4: Performance hardening (pagination, indexes, caching)

## 13. QA and Done Criteria

- [ ] Replace page-level mock imports with API fetches
- [ ] Validate all screen-level loading/empty/error states
- [ ] Verify enum mapping is exact with frontend values
- [ ] Verify all mutations return updated object
- [ ] Verify no currency-formatted strings are returned for numeric fields
- [ ] Smoke test all routes in [src/App.jsx](src/App.jsx)

Definition of Done:
- Every active route renders from API data.
- All listed CRUD and workflow actions persist server-side.
- No screen relies on mock state for core workflows.
