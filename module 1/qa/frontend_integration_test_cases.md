# Frontend to Backend Integration Test Cases

Generated on: 2026-04-13

## Scope
- Validate each critical UI action sends correct API call
- Validate response-to-UI state sync behavior
- Validate retry, timeout, rollback UX for transition actions

## Action to API Contract Cases

1. Sales finalize dispatch
- UI action: User clicks Finalize Dispatch in sales queue
- API: POST /api/sales/orders/:id/finalize-dispatch
- Headers: Idempotency-Key should be present
- Payload: none
- Expected response: success=true with updated order stage/status
- UI assertion: row status updates to Dispatched/next mapped state and amount remains consistent

2. Purchase complete
- UI action: User clicks Complete for purchase row
- API: POST /api/purchase/orders/:id/complete
- Headers: Idempotency-Key should be present
- Payload: none
- Expected response: success=true with updated stage/status
- UI assertion: row transitions to completed state and syncs on refresh

3. Manufacturing start
- UI action: User clicks Start batch
- API: POST /api/manufacturing/batches/:id/start
- Headers: Idempotency-Key should be present
- Payload: none
- Expected response: success=true with updated batch progress/status
- UI assertion: progress/stage changes and inventory counters refresh

4. Manufacturing complete
- UI action: User clicks Complete batch
- API: POST /api/manufacturing/batches/:id/complete
- Headers: Idempotency-Key should be present
- Payload: none
- Expected response: success=true with completed status
- UI assertion: status becomes completed and list row remains consistent after page reload

5. History next stage
- UI action: User advances history stage
- API: POST /api/history/:id/next-stage
- Headers: Idempotency-Key should be present
- Payload: none
- Expected response: success=true with updated history row
- UI assertion: row state updates and filters still include updated row

## Sync Validation Cases

1. Post mutation sync
- Trigger any mutation from UI
- Immediately fetch backend source endpoint
- Compare key fields: id, status/stage, quantity/value, updated timestamp
- Expected: no stale or contradictory state

2. Pagination and filter persistence
- Apply filters in UI then mutate row
- Verify row stays visible or correctly exits filter based on new state
- Expected: no duplicate row or disappearing row on successful mutation

## Concurrency and Retry Cases

1. Double click dispatch/start/complete
- Simulate rapid repeated click on same action button
- Expected: one effective mutation, no duplicate side effects
- UI: should disable action while request in-flight

2. Client retry after timeout
- Simulate timeout then retry
- Expected: backend idempotent result and UI converges to final backend state

## Failure UX Cases

1. 4xx validation error
- Force invalid action payload/path from UI devtools
- Expected UI: visible error toast/message, no optimistic permanent state change

2. 5xx response
- Simulate backend error for transition endpoint
- Expected UI: rollback optimistic state and prompt retry

3. Network abort
- Simulate offline/timeout mid request
- Expected UI: recoverable error and retry CTA

## RBAC Cases

1. Operator tries finance-only action
- Action: purchase paid/complete finance path
- Expected: backend 403 and clear UI permission message

2. Accountant tries manufacturing start
- Expected: backend 403 and UI permission message

3. Admin performs all critical transitions
- Expected: allowed and fully synced UI updates

## Notes for Automation
- Preferred automation stack: Playwright for browser UI + API interception and state assertions.
- Capture both request and response per action.
- Cross-check against backend source-of-truth endpoints after each mutation.
