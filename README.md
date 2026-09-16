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
│   │   └── server.js           # Server entry point
│   └── tests/                  # Jest test suites (5 mandatory + 1 bonus concurrency)
├── docs/                       # Architectural & DB documentation
│   ├── architecture.md
│   ├── database.md
│   ├── er-diagram.md
│   └── api.md
├── docker-compose.yml          # PostgreSQL 16 Docker Compose configuration
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

- [Architecture & Data Flow](file:///Users/Santosh/udyam/docs/architecture.md)
- [Database Schema & Constraints](file:///Users/Santosh/udyam/docs/database.md)
- [Mermaid ER Diagram](file:///Users/Santosh/udyam/docs/er-diagram.md)
- [API Endpoints Specification](file:///Users/Santosh/udyam/docs/api.md)

---

## 📄 License
UDYAM ERP is developed as an operations case study under the MIT License.