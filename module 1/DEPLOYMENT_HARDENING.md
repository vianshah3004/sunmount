# Deployment Hardening Checklist

## Runtime
- Run behind HTTPS (load balancer or reverse proxy TLS termination).
- Set `NODE_ENV=production`.
- Set strict `CORS_ORIGIN` (no wildcard).
- Keep `AUTH_ENABLED=true` in production.

## Required Secrets
- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `GROQ_API_KEY`
- `SHARED_USERNAME`
- `SHARED_PASSWORD`

## Database (Neon)
- Use pooler endpoint with `sslmode=verify-full`.
- Apply migrations with `npm run db:migrate`.
- Enable PITR/backups in Neon project settings.
- Restrict access with IP allow-list where possible.

## App Security
- `helmet` enabled for secure headers.
- `express-rate-limit` enabled for abuse protection.
- `zod` validation enabled across API handlers.
- JWT middleware protects all non-public endpoints.
- Sensitive payload keys are encrypted with AES-256-GCM before persistence.

## Observability
- Centralized structured logs from `src/common/logger.ts`.
- Monitor p95 latency for `/dashboard/summary` and order create endpoints.
- Keep `performance_report.md` from `npm run test:performance` in release artifacts.
