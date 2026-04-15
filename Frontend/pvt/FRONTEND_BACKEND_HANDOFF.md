# Frontend to Backend Handoff

## 1. Scope
This document defines what the current frontend expects from backend APIs for all active SRS screens.

Source of truth in code:
- Routing and shell: [src/App.jsx](src/App.jsx)
- Domain models: [src/lib/srsData.js](src/lib/srsData.js)
- Display formatting: [src/lib/formatters.js](src/lib/formatters.js)
- Active pages: [src/pages](src/pages)
- Active modals/components: [src/components](src/components)

## 2. Active Routes and Screens
- / -> Dashboard
- /inventory -> Products and Inventory
- /sales -> Sales Orders
- /purchase -> Purchase Orders
- /manufacturing -> Manufacturing WIP
- /history -> Order History
- /customers -> Customers and Suppliers
- /settings -> Settings
- /order/edit -> Order Composer
- /reports -> Alias of /history

## 3. Global UI Expectations

### 3.1 Currency and date formatting
Frontend formats values using:
- INR currency with 2 decimal places
- en-IN locale short date
- en-IN locale short date-time

Backend should return numeric money fields as numbers, not preformatted strings.

### 3.2 Top search and metadata
Topbar is currently visual only for most screens, but each page has local search/filter behavior. Keep response payloads search-friendly by including IDs, names, statuses, and notes.

### 3.3 Notifications and order detail overlays
- Notification panel is currently static UI.
- Order detail modal is currently static UI.
Both can be API-backed later with the contracts proposed in section 8.

## 4. Page by Page API Contracts

## 4.1 Dashboard (/)
Used by [src/pages/SrsDashboard.jsx](src/pages/SrsDashboard.jsx)

### Required data
1. Dashboard metrics
- label: string
- value: string or number
- delta: string
- icon: string
- tone: primary | secondary | tertiary | teal

2. Quick module links
- label: string
- icon: string
- to: route path

3. Recent transactions (ledger snapshot)
- id: string
- type: Sales | Purchase | Manufacturing
- party: string
- value: number | string
- status: string
- date: ISO date string
- note: string

### Suggested endpoints
- GET /api/dashboard/metrics
- GET /api/dashboard/quick-modules
- GET /api/history?limit=3&sort=date_desc

## 4.2 Inventory (/inventory)
Used by [src/pages/SrsInventory.jsx](src/pages/SrsInventory.jsx)

### Required list fields
- id: string
- code: string
- name: string
- description: string
- weight: string
- price: number
- quantity: number
- status: In Stock | Auto-Refill | Low Stock | Critical
- lastUpdated: ISO date-time string

### Frontend behavior to support
1. Search across code, name, description, status
2. Sort by code, name, weight, price, quantity, status, lastUpdated
3. Filter by status
4. Select row to show right-side details
5. Stock actions from detail panel
- Adjust Stock (+10)
- Reorder (+25)
- Dispatch (-5)

### Suggested endpoints
- GET /api/inventory?search=&status=&sort=&order=
- PATCH /api/inventory/{id}/quantity
Request:
- delta: number
- reason: adjust | reorder | dispatch

## 4.3 Sales (/sales)
Used by [src/pages/SrsSales.jsx](src/pages/SrsSales.jsx)

### Sales queue fields
- id: string
- customer: string
- customerId: string
- stage: Quotation | Packing | Dispatch | History
- status: Pending | Approved | Dispatched | string
- amount: number
- updated: ISO date-time string

### Order line item fields
- code: string
- name: string
- qty: number
- price: number

### Frontend behavior to support
1. Search queue by id/customer/customerId/stage/status
2. Sort queue by updated and amount
3. Select order to populate right-side detail
4. Customer autofill from customer ID input
5. Unlimited line items in editable order table
6. Computed subtotal, GST 18 percent, total
7. Finalize and dispatch action

### Suggested endpoints
- GET /api/sales/orders?search=&sort=&order=
- GET /api/customers/{customerId}
- GET /api/sales/orders/{id}/lines
- PUT /api/sales/orders/{id}/lines
- POST /api/sales/orders/{id}/finalize-dispatch

## 4.4 Purchase (/purchase)
Used by [src/pages/SrsPurchase.jsx](src/pages/SrsPurchase.jsx)

### Purchase queue fields
- id: string
- supplier: string
- supplierId: string
- stage: Quotation Received | Paid | Order Completion | History
- status: Unpaid | Paid | In Transit | string
- amount: number
- updated: ISO date-time string

### Line item fields
- code: string
- name: string
- qty: number
- price: number

### Frontend behavior to support
1. Search and sort queue
2. Select order to show detail panel
3. Supplier autofill from supplier ID
4. Unlimited line items for purchase order
5. Complete purchase action

### Suggested endpoints
- GET /api/purchase/orders?search=&sort=&order=
- GET /api/suppliers/{supplierId}
- GET /api/purchase/orders/{id}/lines
- PUT /api/purchase/orders/{id}/lines
- POST /api/purchase/orders/{id}/complete

## 4.5 Manufacturing (/manufacturing)
Used by [src/pages/SrsManufacturing.jsx](src/pages/SrsManufacturing.jsx)

### WIP batch fields
- id: string
- title: string
- status: In Progress | Completed | string
- progress: number (0 to 100)
- materials: string[]
- output: string
- operator: string
- eta: string
- lastUpdated: ISO date-time string

### Frontend behavior to support
1. Search by id/title/status/operator/output/materials
2. Filter by status
3. Sort by updated or progress
4. Select batch for details
5. Actions
- Edit batch (title/output/eta)
- Remove batch
- Mark complete

### Suggested endpoints
- GET /api/manufacturing/batches?search=&status=&sort=&order=
- PATCH /api/manufacturing/batches/{id}
- DELETE /api/manufacturing/batches/{id}
- POST /api/manufacturing/batches/{id}/complete

## 4.6 History (/history and /reports)
Used by [src/pages/SrsHistory.jsx](src/pages/SrsHistory.jsx)

### Record fields
- id: string
- type: Sales | Purchase | Manufacturing
- party: string
- value: number | string
- status: string
- date: ISO date string
- note: string

### Frontend behavior to support
1. Type chips: All, Sales, Purchase, Manufacturing
2. Search by id/type/party/status/note
3. Status filter modal
4. Sort by date, status, type, value
5. Detail panel actions
- Edit status and note
- Move to next stage
- Delete
6. Export
- CSV export (local generation)
- Print to PDF (browser print)

### Suggested endpoints
- GET /api/history?type=&status=&search=&sort=&order=
- PATCH /api/history/{id}
- POST /api/history/{id}/next-stage
- DELETE /api/history/{id}

## 4.7 Customers and Suppliers (/customers)
Used by [src/pages/SrsCustomers.jsx](src/pages/SrsCustomers.jsx)

### Entity fields
- id: string
- type: Customer | Supplier
- name: string
- contact: string
- location: string
- value: number
- status: string
- mode: Active | Inactive | string

### Frontend behavior to support
1. Search by id/name/contact/location/type
2. Select entity for right-side profile card
3. Context actions
- Edit
- Remove
- Create Order

### Suggested endpoints
- GET /api/entities?type=customer,supplier&search=
- GET /api/entities/{id}
- PATCH /api/entities/{id}
- DELETE /api/entities/{id}
- POST /api/orders/from-entity/{id}

## 4.8 Settings (/settings)
Used by [src/pages/SrsSettings.jsx](src/pages/SrsSettings.jsx)

### Current UI state
Mostly presentation fields with static defaults.

### Data expected if backend-backed
- organization: string
- timezone: string
- primaryContactEmail: string
- securityFlags:
- sharedLoginEnabled: boolean
- httpsEnabled: boolean
- encryptionAtRest: string
- backupsEnabled: boolean
- sync:
- status: Live | Degraded | Offline
- apiLatencyMs: number
- lastSyncAt: ISO date-time string
- backupWindow: string

### Suggested endpoints
- GET /api/settings
- PUT /api/settings
- GET /api/settings/health

## 4.9 Order Composer (/order/edit)
Used by [src/pages/SrsOrderComposer.jsx](src/pages/SrsOrderComposer.jsx)

### Required fields
1. Header
- entityCode: string
- resolved entityName from lookup
- orderNumber: string
- orderDate: ISO date

2. Line items
- code: string
- name: string
- qty: number
- price: number

3. Footer
- notes: string
- subtotal/tax/grandTotal computed client-side (or validated server-side)

### Frontend behavior to support
1. Lookup entity by typed code
2. Unlimited line item editing
3. Save draft and submit actions

### Suggested endpoints
- GET /api/entities/lookup/{entityCode}
- POST /api/orders/draft
- POST /api/orders/submit

## 5. Shared Component Contracts

## 5.1 Notification panel
Used by [src/components/SrsNotificationPanel.jsx](src/components/SrsNotificationPanel.jsx)

### Fields
- tone: error | primary | secondary
- title: string
- detail: string
- time: string
- read: boolean (recommended)

### Suggested endpoints
- GET /api/notifications
- POST /api/notifications/mark-all-read

## 5.2 Order detail modal
Used by [src/components/SrsOrderDetailModal.jsx](src/components/SrsOrderDetailModal.jsx)

### Fields
- orderId: string
- orderNumber: string
- status: string
- referenceCode: string
- customerName: string
- supplierName: string
- date: ISO date
- lines: array of
- productName: string
- qty: number
- price: number
- total: number (or compute)

### Actions
- Edit
- Remove
- Next Stage

### Suggested endpoints
- GET /api/orders/{id}
- PATCH /api/orders/{id}
- DELETE /api/orders/{id}
- POST /api/orders/{id}/next-stage

## 6. Enumerations to Align Across Backend
Use stable enums to avoid UI mismatch.

- Inventory status: In Stock, Auto-Refill, Low Stock, Critical
- Sales stage: Quotation, Packing, Dispatch, History
- Sales status: Pending, Approved, Dispatched
- Purchase stage: Quotation Received, Paid, Order Completion, History
- Purchase status: Unpaid, Paid, In Transit
- WIP status: In Progress, Completed
- History type: Sales, Purchase, Manufacturing

## 7. Response and Validation Rules
1. Money values should be numeric.
2. Dates should be ISO strings.
3. IDs must be unique and stable.
4. Search and sort should support server-side operation for scale.
5. PATCH and POST actions should return updated entity so UI can refresh instantly.

## 8. Suggested Minimal API Set (Phase 1)
1. GET /api/dashboard/metrics
2. GET /api/inventory
3. PATCH /api/inventory/{id}/quantity
4. GET /api/sales/orders
5. GET /api/purchase/orders
6. GET /api/manufacturing/batches
7. PATCH /api/manufacturing/batches/{id}
8. GET /api/history
9. PATCH /api/history/{id}
10. GET /api/entities
11. GET /api/entities/lookup/{entityCode}
12. GET /api/settings

This set is enough to replace current mock data in all major screens.

## 9. Current Gaps to Be Aware Of
1. Some actions are still local-state mock behavior in frontend.
2. Notification and order-detail overlays are static and should be connected to APIs.
3. Topbar global search is visual; each page currently handles its own filtering.

## 10. Implementation Tip for Backend Integration
Return consistent object shapes that mirror [src/lib/srsData.js](src/lib/srsData.js), then replace per-page mock imports with data-fetch hooks. This minimizes UI rewrites and keeps all current behavior intact.
