# Deployment Checklist

## HTTPS Configuration
- Terminate TLS at load balancer or ingress.
- Redirect all HTTP traffic to HTTPS.
- Use modern TLS versions and ciphers only.
- Set HSTS header on production domain.

## Environment Setup
- Set `NODE_ENV=production`.
- Configure `JWT_SECRET` with a long random secret.
- Configure DB credentials using secret manager.
- Set strict CORS allowlist via `CORS_ORIGIN`.
- Configure `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` for production traffic.

## Database Security
- Use least-privilege DB credentials for application runtime.
- Restrict database network access to app subnets only.
- Enable database audit logs.
- Enforce SSL connections from app to database.
- Rotate database passwords/keys on a defined schedule.

## Auth and Access
- Verify JWT middleware is active for all protected routes.
- Verify RBAC checks for manufacturing and finance transitions.
- Ensure admin credentials are rotated and stored securely.

## Rate Limiting and Abuse Controls
- Confirm global rate limiter is enabled.
- Add route-specific limits for auth endpoints if needed.
- Monitor 429 spikes and adjust thresholds safely.

## Backup and Recovery
- Enable automated daily backups.
- Keep point-in-time recovery window enabled.
- Test restore procedure in staging at least monthly.
- Document RTO/RPO and on-call runbook.

## Logging and Observability
- Correlate logs by `x-request-id`.
- Capture error rates and slow request metrics.
- Alert on auth failures, 5xx spikes, and DB connection saturation.

## Release Validation
- Run integration and E2E smoke tests before deploy.
- Validate websocket connectivity and polling fallback behavior.
- Validate order and manufacturing lifecycle transitions in production-like data.
- Verify settings load/save and persistence.
