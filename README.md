# Sunmount: Enterprise-Grade Inventory Management System

Sunmount is a production-ready, full-stack Inventory Management System featuring a React/Vite-based modern UI, a robust Node.js/TypeScript backend powered by Drizzle ORM and Neon PostgreSQL, real-time WebSocket communication, AI-driven stock predictions, and an Electron-based desktop wrapper.

---

## 📂 Project Structure

The repository is organized into three major modules:

*   **`Frontend/pvt/`**: A modern React application styled with TailwindCSS and powered by Vite, providing responsive master/detail layouts, dynamic forms, and real-time dashboard analytics.
*   **`module 1/`**: The core backend application built with Node.js, Express, and TypeScript. It uses Drizzle ORM for PostgreSQL database interactions, Socket.IO for real-time broadcasts, and Groq LLM integration for AI-powered insights.
*   **`SunmountDesktop/`**: An Electron application wrapping both frontend and backend services into a single-installation executable, optimized for local desktop deployment.

---

## ⚡ Core System Functionalities

### 1. 📦 Inventory & Product Management
*   **Product CRUD Operations**: Full creation, retrieval, updates, and deletion of products.
*   **Detailed Product Metadata**: Tracks product codes (SKUs), names, descriptions, unit types (e.g., pcs, kg, box), weights, prices in INR (₹), current quantities, and auto-generated audit timestamps.
*   **Real-time Stock Tracking**: Updates stock levels instantly across all modules when orders or manufacturing batches are processed.
*   **Low Stock Detection**: Emits real-time visual alerts and warnings when a product's quantity falls below its specified minimum threshold.

### 2. 📝 Order Processing & Workflows
*   **Sales Orders (SO)**:
    *   Dynamic Order Composer interface supporting unlimited product line items.
    *   Automated stock deduction upon transitioning an order status to `DISPATCHED`.
    *   State transition workflow: `QUOTATION` ➔ `PACKING` ➔ `DISPATCHED` ➔ `HISTORY`.
    *   Customer auto-completion lookup based on client IDs.
*   **Purchase Orders (PO)**:
    *   Interactive compose screen for procurement with automatic subtotal and tax computations.
    *   Automated stock replenishment upon completing the order lifecycle.
    *   State transition workflow: `QUOTATION RECEIVED` ➔ `PAID / UNPAID` ➔ `IN TRANSIT` ➔ `COMPLETED`.
    *   Supplier auto-completion lookup.
*   **Transactional Integrity**: Guaranteed safe status changes and inventory calculations using PostgreSQL transactions (`db.transaction`) via Drizzle ORM to prevent race conditions or duplicate allocation.

### 3. 🏭 Manufacturing & Work in Progress (WIP)
*   **Batch Tracking**: Create and monitor production runs specifying raw material inputs and finished output goods.
*   **Dynamic Progress Meter**: Tracks stages dynamically from `0%` (batch created), `20%` (initiated), `55%` (materials consumed), `90%` (output product generated) up to `100%` (completed).
*   **Atomic Batch Completion**: Auto-deducts raw material inputs and auto-injects final products into the active inventory simultaneously upon completion, preventing double-application through strict state checks.

### 4. 🧠 AI-Powered Features (Groq LLM Integration)
*   **Intelligent Reorder Recommendations**: Custom suggestions recommending replenishment volumes for low-stock items based on current velocities.
*   **Natural Language Queries**: Interactive conversational AI interface to ask questions about system stock levels, order histories, and general logistics.
*   **Business Insights**: Dynamic analysis of inventory health, turnover rates, and operational efficiency.
*   **Smart Fallbacks**: Graceful local heuristic fallbacks if Groq API keys or services are unreachable.

### 5. 🔄 Real-Time WebSockets Synchronization (Socket.IO)
*   **Live Broadcasts**: Automatically publishes events to all open client sessions upon database mutations.
*   *   `inventory:update`: Instantly syncs quantities in list views.
    *   `order:update`: Emitted when any sales or purchase order status changes.
    *   `manufacturing:update`: Updates manufacturing batch status and completions.
    *   `low_stock`: Triggers system-wide notifications for critical thresholds.

### 6. 📊 Dashboard, Audit Logging & Reporting
*   **Executive Dashboard**: Displays key metric cards including total inventory valuation, active WIP batch counts, low-stock flags, pending sales/purchase order counters, and a live activity feed.
*   **Change Log Auditing**: A dedicated database logger capturing all inventory change categories (`SALE`, `PURCHASE`, `WIP_RAW`, `WIP_OUTPUT`) linked to respective product SKUs and order reference IDs.
*   **Data Export Utilities**: Offers clean formats prepared for local CSV downloading and browser-native PDF report generation.

---

## 🛠️ Technology Stack

### Backend
*   **Language & Runtime**: Node.js & TypeScript
*   **Web Framework**: Express
*   **Database Access**: Drizzle ORM (with Neon PostgreSQL driver)
*   **Real-time Communication**: Socket.IO
*   **Validation**: Zod (runtime API request/response contract verification)
*   **AI Engine**: Groq SDK (`llama-3.3-70b-versatile` or similar)

### Frontend
*   **UI Framework**: React
*   **Bundler & Dev Server**: Vite
*   **CSS Styling**: Vanilla CSS + TailwindCSS (for utility layouts)
*   **State & Sync**: Socket.IO-Client for real-time notifications

### Desktop
*   **Desktop Wrapper**: Electron framework
*   **Platform Support**: Optimized for Windows 10/11

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and a **PostgreSQL** database instance (e.g., Neon serverless Postgres) ready.

### 2. Backend Setup (`/module 1`)
1.  Navigate into the backend directory:
    ```bash
    cd "module 1"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environments by creating a `.env` file (see `.env.example` as a template):
    ```env
    DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
    GROQ_API_KEY=your_groq_api_key
    GROQ_MODEL=llama-3.3-70b-versatile
    PORT=4000
    ```
4.  Run database migrations:
    ```bash
    npm run db:generate
    npm run db:migrate
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup (`/Frontend/pvt`)
1.  Navigate to the frontend folder:
    ```bash
    cd ../Frontend/pvt
    ```
2.  Install packages and launch:
    ```bash
    npm install
    npm run dev
    ```

### 4. Running the Desktop Application (`/SunmountDesktop`)
1.  Navigate to the desktop directory:
    ```bash
    cd ../SunmountDesktop
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run both the backend server and Electron UI simultaneously:
    ```bash
    npm run start:full
    ```

---

## 🧪 Testing and Verification
The backend includes extensive QA validation suites:
*   **Inventory Testing**: `npm run test:inventory` (validates transactions and limits)
*   **System Testing**: `npm run test:system` (E2E system verify for database, REST endpoints, and AI models)
*   **WebSockets Verification**: `npm run test:socket` (asserts message emission)
*   **Performance Metrics**: `npm run test:performance` (benchmarks query execution speeds)
