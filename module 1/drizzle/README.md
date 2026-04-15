# Drizzle Migration Notes

This folder contains version-controlled SQL migrations for the project.

## Safe migration workflow

1. Generate migration SQL from schema changes:
   - `npx drizzle-kit generate`
2. Review generated SQL before applying it.
3. Apply migrations:
   - `npx drizzle-kit migrate`

## Production guidance

- Never run destructive SQL blindly.
- Always back up or verify rollback strategy before risky schema changes.
- Keep all migration files and metadata in version control.
- In production, run migrations via CI/CD release jobs.
- Development can run migrations more frequently during iteration.
