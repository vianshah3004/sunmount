# Inventory Management System (Node.js + TypeScript + Drizzle + Neon + Socket.IO + Groq)

Production-grade inventory backend with:
- Product CRUD
- Transaction-safe inventory updates
- Inventory audit logs
- Low stock alerts
- Real-time Socket.IO events
- AI endpoints powered by Groq (with fallback behavior)

## Tech Stack
- Node.js + TypeScript
- Express
- Drizzle ORM
- Neon PostgreSQL (pooler)
- Socket.IO
- Zod
- Groq API

## Important Security Note
Do not commit real secrets.

You must create your own local `.env` from `.env.example` and fill your own keys:
- `DATABASE_URL`
- `GROQ_API_KEY`

## 1 Setup

```bash
npm install
```

Copy environment template:

```bash
cp .env.example .env
```

Now open `.env` and fill your own values.

Required values:
- `DATABASE_URL=postgresql://USER:PASSWORD@...-pooler.../neondb?sslmode=verify-full`
- `GROQ_API_KEY=your_groq_api_key`
- `GROQ_MODEL=llama-3.3-70b-versatile` (or another supported Groq model)
- `PORT=4000`

Production security values:
- `AUTH_ENABLED=true`
- `SHARED_USERNAME=admin`
- `SHARED_PASSWORD=your_strong_password`
- `JWT_SECRET=minimum_32_char_secret`
- `ENCRYPTION_KEY=minimum_32_char_key`
- `CORS_ORIGIN=https://your-frontend-domain.com`

## 2 Database Migrations

Generate migration SQL when schema changes:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

## 3 Run the App

Development mode:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run production build:

```bash
npm run start
```

## 4 API Endpoints

### Health
- `GET /health`

### Auth
- `POST /auth/login`
- `POST /api/auth/login`

### Product Module
- `POST /products`
- `GET /products`
- `PUT /products/:id`
- `DELETE /products/:id`

### Inventory Module
- `POST /inventory/update`

### AI Module
- `GET /ai/reorder/:productId`
- `POST /ai/query`
- `GET /ai/insights`

### History Export
- `GET /history/export/csv`
- `GET /history/export/pdf`

When `AUTH_ENABLED=true`, all endpoints except `GET /health` and login endpoints require `Authorization: Bearer <jwt>`.

## 5 Real-Time Socket Events

Socket.IO events emitted by backend:
- `inventory:update`
  - payload: `{ productCode, newQuantity }`
- `low_stock`
  - payload: `{ productCode, quantity, lowStockThreshold }`

## 6 Test Commands

Inventory-focused QA:

```bash
npm run test:inventory
```

Full system QA (DB + API + AI):

```bash
npm run test:system
```

Socket.IO E2E QA:

```bash
npm run test:socket
```

Performance validation:

```bash
npm run test:performance
```

Optional ts-node run for inventory test:

```bash
npm run test:inventory:tsnode
```

## 7 Test Reports

The QA scripts generate markdown reports (ignored by git):
- `inventory_test_report.md`
- `final_system_test_report.md`
- `socket_test_report.md`

## 8 Project Structure

```text
src/
  app.ts
  server.ts
  common/
    logger.ts
    socket.ts
    eventBus.ts
    errors/
      AppError.ts
      errorHandler.ts
  db/
    index.ts
    schema.ts
  modules/
    product/
    inventory/
    ai/
```

## 9 Troubleshooting

If AI endpoints fallback instead of AI answers:
1. Verify `GROQ_API_KEY` is set in `.env`
2. Verify `GROQ_MODEL` is supported in your Groq account
3. Restart server after changing `.env`

If DB fails to connect:
1. Ensure Neon pooler host includes `-pooler`
2. Ensure URL includes `sslmode=verify-full`
3. Ensure credentials and database name are correct

