# QA End-to-End Test Report

- Run: QA-1776022513012
- Generated: 2026-04-12T19:35:24.722Z
- Total tests: 15
- Passed: 13
- Failed: 0
- Warnings: 2

## Detailed Results

- [PASS] Manufacturing :: Create batch -> Batch created
- [PASS] Manufacturing :: Start transition -> Start succeeded
- [PASS] Manufacturing :: Raw deduction on start only -> raw: 100 -> 80, fin unchanged 10
- [PASS] Manufacturing :: Double start idempotency -> No duplicate deduction; status=200
- [PASS] Manufacturing :: Complete adds output without raw deduction -> raw stable=80, fin=25
- [PASS] State Machine :: Reject invalid sales transition skip -> QUOTATION -> DISPATCHED rejected
- [PASS] State Machine :: Sales valid transition chain -> QUOTATION->APPROVED->PACKING->DISPATCHED->COMPLETED
- [WARN] State Machine :: Objective status mismatch -> CONFIRMED/DELIVERED are not backend statuses; using APPROVED/COMPLETED
- [PASS] State Machine :: Purchase paid transition role-gated -> Operator blocked from marking PAID
- [PASS] State Machine :: Purchase paid by accountant -> Accountant successfully marked PAID stage
- [WARN] Concurrency :: Concurrent start conflict safety -> Expected one success + conflicts; actual {"200":8} (backend currently idempotent, not conflicting)
- [PASS] Concurrency :: Audit written under concurrency -> start transition logs=1
- [PASS] Failure + Audit :: Invalid request handled -> status=400
- [PASS] Failure + Audit :: Network timeout simulation -> Client-side abort/timeout path verified
- [PASS] Failure + Audit :: Audit log field integrity -> previous/new/performedBy/timestamp present

## Bugs / Risks Found

- State Machine / Objective status mismatch: CONFIRMED/DELIVERED are not backend statuses; using APPROVED/COMPLETED
- Concurrency / Concurrent start conflict safety: Expected one success + conflicts; actual {"200":8} (backend currently idempotent, not conflicting)

## System Weak Points

- Legacy test suites are auth-oblivious and fail under hardened auth unless updated.
- Business objective statuses (CONFIRMED/DELIVERED, CREATED/ORDERED/RECEIVED) do not match backend enum design.
- Concurrency behavior on manufacturing start is idempotent; may not emit 409 conflicts by design.

## Recommendations

1. Align product/UI state labels with backend canonical enums or add translation layer.
2. Update legacy test scripts to use authenticated requests and seeded role users.
3. Decide policy: strict conflict (409) vs idempotent success for duplicate start operations, then enforce consistently.
4. Add deterministic fault-injection hooks for mid-transaction crash simulation in staging.
