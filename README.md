# UDYAM — Business Operations & Inventory ERP

UDYAM is a lightweight, high-reliability Enterprise Resource Planning (ERP) platform built with a modular PERN (PostgreSQL, Express.js, Pure React.js, Node.js) architecture. It manages the complete manufacturing and supply chain workflow:

$$\mathbf{Customer\ Enquiry} \longrightarrow \mathbf{Quotation} \longrightarrow \mathbf{Sales\ Order} \longrightarrow \mathbf{Inventory\ Reservation} \longrightarrow \mathbf{Product\ Dispatch}$$

---

## 🌟 Key Features & Architectural Invariants

1. **Frontend Workflow Presentation & Pure React JS**:
   - Built with **Pure React.js** (without Vite) using Webpack and Tailwind CSS.
   - **Reusable Component Architecture**: Composes modular UI primitives from `client/src/components/common` (`Button`, `Input`, `Select`, `Modal`, `Card`, `StatusBadge`, `Table`, `Alert`, `Tabs`, `StatCard`).
   - Role-aware interface with single-click demo role switcher between **Admin** and **Sales User**.

2. **Quotation Financial Engine**:
   - All financial math is strictly validated and computed by the Node.js backend to avoid client-side tampering.
   - Computes:
     $$\text{Base Amount} = \text{Qty} \times \text{Unit Price}$$
     $$\text{Discount} = \text{Base Amount} \times \text{Discount \%}$$
     $$\text{GST} = (\text{Base} - \text{Discount}) \times \text{GST \%}$$
     $$\text{Line Amount} = \text{Base} - \text{Discount} + \text{GST}$$
     $$\text{Grand Total} = \sum \text{Line Amounts}$$

3. **Guaranteed Transactional Conversion**:
   - Only `ACCEPTED` quotations can be converted to a Sales Order.
   - A quotation can generate **at most one Sales Order** (enforced by DB unique index and transactions).

4. **Atomic Inventory Reservation (Concurrency-Safe)**:
   - When an ADMIN confirms an order, inventory is reserved atomically at the database level using:
     ```sql
     UPDATE "Inventory"
     SET "reservedQuantity" = "reservedQuantity" + :quantity
     WHERE "productId" = :productId AND ("physicalQuantity" - "reservedQuantity") >= :quantity;
     ```
   - If stock is insufficient, the transaction rolls back immediately with **HTTP 409 Conflict**; no partial reservation occurs.
   - Concurrent reservation requests are safely serialized without overselling.

5. **Transactional Dispatch**:
   - Decrements both `physicalQuantity` and `reservedQuantity`.
   - Requires ADMIN role; updates order status to `DISPATCHED`.

6. **Interactive API Documentation & Automated Tests**:
   - Interactive Swagger/OpenAPI docs at `http://localhost:5000/api-docs`.
   - Comprehensive Jest + Supertest test suite with 100% pass rate.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Pure React.js (React 18 + Webpack + Babel + Tailwind CSS + Lucide Icons) |
| **Backend** | Node.js + Express.js REST API |
| **Database** | PostgreSQL 16 (via Docker container or local service) |
| **ORM** | Prisma ORM 5 |
| **Auth & Security** | JWT (JSON Web Tokens) + bcryptjs password hashing |
| **Testing** | Jest + Supertest (Automated business logic test suite) |
| **Documentation** | Swagger / OpenAPI 3.0 |

---

## 📂 Project Structure

```
udyam/
├── client/                     # Pure React.js (No Vite) frontend
│   ├── public/                 # HTML template & assets
│   ├── src/
│   │   ├── api/                # Axios API client with JWT interceptor
│   │   ├── components/
│   │   │   ├── common/         # Reusable UI library (Button, Modal, Table, etc.)
│   │   │   └── layout/         # Navbar with role badge & demo switcher
│   │   ├── context/            # AuthContext (JWT session & user state)
│   │   ├── pages/              # Login, Dashboard, Enquiries, Quotations, SalesOrders, Inventory, Customers
│   │   ├── App.jsx
│   │   └── index.js
│   ├── webpack.config.js       # Pure React webpack configuration
│   └── tailwind.config.js
├── server/                     # Express.js REST backend
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models, constraints, and enums
│   │   └── seed.js             # Seeds users, products, inventory, customers
│   ├── src/
│   │   ├── config/             # DB & JWT config
│   │   ├── middleware/         # Auth (JWT), RBAC, Error Handler
│   │   ├── routes/             # REST endpoints
│   │   ├── controllers/        # Request controllers
│   │   ├── services/           # Business logic & transaction handlers
│   │   ├── utils/              # Calculation engine & response helpers
│   │   ├── swagger.js          # OpenAPI specification
│   │   ├── app.js              # Express app (prod: serves React SPA)
│   │   └── server.js           # Server entry point
│   └── tests/                  # Jest test suites (5 mandatory + 1 bonus concurrency)
├── docs/                       # Architectural & DB documentation
│   ├── architecture.md
│   ├── database.md
│   ├── er-diagram.md
│   └── api.md
├── Dockerfile                  # Multi-stage production Docker build
├── .dockerignore               # Docker build context filter
├── docker-compose.yml          # Full-stack: PostgreSQL + App (production)
├── package.json                # Root scripts: install, build, deploy
└── README.md
```

---

## 🔑 Seed Test Credentials

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@udyam.local` | `admin123` | View all records, adjust stock, confirm orders (reserve stock), process dispatches |
| **SALES USER** | `sales@udyam.local` | `sales123` | Create customers, enquiries, quotations, convert accepted quotations to orders, view stock |

> *Tip: The UI features a 1-click **Fast Demo Sign-In** button on the Login page and a **Switch Role** toggle in the navigation bar for instant switching between Admin and Sales User!*

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js (v18+) and npm
- Docker (or local PostgreSQL 16)

### 1. Start the PostgreSQL Database
```bash
docker compose up -d
```
*The database will run on `localhost:5432` with user `udyam_user` and database `udyam_db`.*

### 2. Setup the Backend Server
```bash
cd server
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```
*Backend will start on `http://localhost:5000`.*
*Interactive Swagger API documentation will be available at `http://localhost:5000/api-docs`.*

### 3. Setup the Pure React Frontend
```bash
cd client
npm install
npm start
```
*Pure React Webpack dev server will start on `http://localhost:3000`.*

---

## 🧪 Automated Testing Suite

The application includes automated tests covering all mandatory business logic and the bonus concurrency test:

```bash
cd server
npm test
```

### Test Cases Covered
1. **Mandatory Test 1 — Quotation Calculation Engine**:
   - Validates quantity $\times$ unit price, percentage discount deduction, GST calculation, line amounts, and grand total.
2. **Mandatory Test 2 — Invalid Quotation Conversion**:
   - Ensures `DRAFT` and `REJECTED` quotations cannot be converted to Sales Orders (HTTP 400).
3. **Mandatory Test 3 — Duplicate Sales Order Prevention**:
   - Confirms that an `ACCEPTED` quotation can only be converted once; repeated conversion fails with HTTP 409 Conflict.
4. **Mandatory Test 4 — Insufficient Inventory on Confirmation**:
   - Order confirmation requiring 80 units when only 70 are available returns HTTP 409 Conflict, preserves stock, and leaves the order in `PENDING` state.
5. **Mandatory Test 5 — RBAC Authorization**:
   - Ensures `SALES_USER` cannot confirm orders or process dispatches (HTTP 403 Forbidden).
6. **Bonus Test — Concurrent Inventory Reservation Protection**:
   - Simultaneously launches two confirmation requests (Order A = 80 units, Order B = 50 units) on 100 available units. Exactly one succeeds, one fails with 409, and available stock is never overbooked.

---

## 🎥 5-Minute End-to-End Workflow Demonstration

Follow this walkthrough to experience the entire operational pipeline:

1. **Sign In**:
   - Navigate to `http://localhost:3000`.
   - Click **Sales User** button to log in as `sales@udyam.local`.
2. **Create Customer & Enquiry**:
   - Go to **Enquiries** $\rightarrow$ Click **+ New Enquiry**.
   - Select a customer (e.g. *Apex Heavy Engineering Ltd*), pick a product (e.g. *IND-002 Hydraulic Pump*), enter quantity (e.g. `5`), and click **Save Enquiry**.
3. **Generate Quotation**:
   - On the created enquiry, click **Create Quote**.
   - Review or modify the line items (e.g. enter 5% discount and 18% GST). Notice the live calculation preview. Click **Create Quotation**.
4. **Accept Quotation**:
   - Go to **Quotations**. Find your quotation (status `DRAFT`).
   - Click **Send Quote** (status becomes `SENT`), then click **Accept** (status becomes `ACCEPTED`).
5. **Convert to Sales Order**:
   - Click **Convert to Order**.
   - The application transactionally creates Sales Order `SO-2026-XXXX` with status `PENDING`.
6. **Switch to Admin Role**:
   - In the top navigation bar, click **Switch to Admin**.
7. **Confirm Sales Order & Reserve Inventory**:
   - Go to **Sales Orders**. Click **Details** to see the stock comparison (**Required** vs **Available**).
   - Click **Confirm & Reserve Stock**. Status changes to `CONFIRMED`.
   - In **Inventory**, notice that **Reserved Stock** has increased while **Physical Stock** remains untouched.
8. **Process Dispatch**:
   - In **Sales Orders**, click **Process Dispatch**.
   - Enter Vehicle Number (e.g. `MH-12-AB-9999`) and Driver Name (e.g. `Suresh Patil`), then click **Complete Dispatch**.
   - Status changes to `DISPATCHED`.
9. **Verify Inventory**:
   - Go to **Inventory**. Notice that both **Physical Stock** and **Reserved Stock** have decreased by the dispatched amount, keeping mathematically consistent balances.

---

## 📖 Documentation Directory

- [Architecture & Data Flow](docs/architecture.md)
- [Database Schema & Constraints](docs/database.md)
- [Mermaid ER Diagram](docs/er-diagram.md)
- [API Endpoints Specification](docs/api.md)

---

## 🚢 Deployment

### Option 1: Docker Compose (Recommended — One Command)

The entire stack (PostgreSQL + Full-Stack App) runs from a single command:

```bash
# Clone the repo
git clone <repository-url> && cd udyam

# Start everything (builds app, starts database, seeds data)
docker compose up --build -d

# Push the Prisma schema and seed the database (first-time only)
docker compose exec app sh -c "cd server && npx prisma db push && node prisma/seed.js"
```

The application is available at **http://localhost:5000** (single port serves API + React SPA).

```bash
# View logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop and remove data volumes
docker compose down -v
```

### Option 2: Manual Node.js Deployment

```bash
# 1. Ensure PostgreSQL is running (Docker or hosted)
docker compose up postgres -d

# 2. Install dependencies
cd server && npm install && cd ../client && npm install && cd ..

# 3. Build the React production bundle
cd client && npm run build && cd ..

# 4. Setup the database
cd server && npx prisma db push && node prisma/seed.js && cd ..

# 5. Start the production server (single port)
cd server && NODE_ENV=production node src/server.js
```

Application available at **http://localhost:5000**.

### Option 3: PaaS Deployment (Render / Railway / Heroku)

1. **Create a PostgreSQL database** on your platform.
2. **Set environment variables** on the platform:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public
   JWT_SECRET=your_strong_production_secret
   NODE_ENV=production
   PORT=5000
   ```
3. **Set build command**:
   ```bash
   cd client && npm install && npm run build && cd ../server && npm install && npx prisma db push && node prisma/seed.js
   ```
4. **Set start command**:
   ```bash
   cd server && NODE_ENV=production node src/server.js
   ```

### Option 4: Serverless Deployment with Neon & Vercel (1-Click)

Full step-by-step documentation is available in [docs/deployment-vercel-neon.md](docs/deployment-vercel-neon.md).

1. **Database on Neon**:
   - Create a free project on [neon.tech](https://neon.tech).
   - Copy the **Pooled Connection String** (`DATABASE_URL`) and **Direct Connection String** (`DIRECT_URL`).
   - Push schema & seed from local terminal:
     ```bash
     cd server
     DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" npx prisma db push
     DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" node prisma/seed.js
     ```

2. **Deploy on Vercel**:
   - Import the repository into [vercel.com/new](https://vercel.com/new).
   - The included `vercel.json` and `api/index.js` automatically configure the serverless build and routing.
   - Add Environment Variables in Vercel Dashboard:
     - `DATABASE_URL`: Neon pooled connection (`-pooler`)
     - `DIRECT_URL`: Neon direct connection
     - `JWT_SECRET`: Random secure string
     - `NODE_ENV`: `production`
   - Click **Deploy**!

### Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret key for JWT signing (use a strong random string!) |
| `NODE_ENV` | ✅ | `development` | Set to `production` for deployment |
| `PORT` | ❌ | `5000` | Server port |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token expiry duration |

---

## 📄 License
UDYAM ERP is developed as an operations case study under the MIT License.