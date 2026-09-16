# UDYAM ERP — Architecture Documentation

## 1. System Overview

**UDYAM** is a modular enterprise operations system designed for manufacturing and industrial supply businesses. It coordinates the complete business lifecycle:

$$\text{Customer Enquiry} \longrightarrow \text{Quotation} \longrightarrow \text{Sales Order} \longrightarrow \text{Inventory Reservation} \longrightarrow \text{Product Dispatch}$$

The architecture enforces a strict design principle:
> **The frontend presents the workflow, the backend enforces the business rules, and PostgreSQL guarantees data consistency.**

---

## 2. Three-Tier Modular Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                    │
│                                                         │
│               Pure React.js + Tailwind CSS              │
│       Reusable Component Architecture (Common UI Lib)   │
│           Role-Aware Views & Workflow Actions           │
└────────────────────────────┬────────────────────────────┘
                             │
                      REST API (JSON)
                      JWT Bearer Auth
                             │
┌────────────────────────────▼────────────────────────────┐
│                    APPLICATION TIER                     │
│                                                         │
│                 Node.js + Express.js                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │   Auth & RBAC Middleware  │ Central Error Handler  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │   Enquiry Svc   │  Quotation Engine  │  Order Svc │  │
│  │   Inventory Svc │  Dispatch Service  │  Calculations││
│  └───────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │
                         Prisma ORM
                      ACID Transactions
                             │
┌────────────────────────────▼────────────────────────────┐
│                        DATA TIER                        │
│                                                         │
│                      PostgreSQL 16                      │
│      Relational Constraints, Foreign Keys & Indexes     │
│       Row-Level Atomic Reservation Checks (No Oversell) │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Role-Based Access Control (RBAC) Matrix

Backend middleware intercepts every incoming request to verify that the bearer token is valid and belongs to an authorized role.

| Module / Operation | Endpoint | ADMIN | SALES_USER |
| :--- | :--- | :---: | :---: |
| Authenticate / Login | `POST /api/auth/login` | ✅ | ✅ |
| Get Current Profile | `GET /api/auth/me` | ✅ | ✅ |
| List Customers | `GET /api/customers` | ✅ | ✅ |
| Create Customer | `POST /api/customers` | ✅ | ✅ |
| List Products | `GET /api/products` | ✅ | ✅ |
| Create Product | `POST /api/products` | ✅ | ❌ (403) |
| View Inventory | `GET /api/inventory` | ✅ | ✅ |
| Adjust Physical Stock | `PATCH /api/inventory/:id` | ✅ | ❌ (403) |
| List Enquiries | `GET /api/enquiries` | ✅ | ✅ |
| Create Enquiry | `POST /api/enquiries` | ✅ | ✅ |
| List Quotations | `GET /api/quotations` | ✅ | ✅ |
| Create Quotation | `POST /api/quotations` | ✅ | ✅ |
| Update Quotation Status | `PATCH /api/quotations/:id/status` | ✅ | ✅ |
| Convert to Sales Order | `POST /api/quotations/:id/convert` | ✅ | ✅ |
| List Sales Orders | `GET /api/sales-orders` | ✅ | ✅ |
| Confirm Sales Order (Reserve) | `POST /api/sales-orders/:id/confirm` | ✅ | ❌ (403) |
| Process Dispatch | `POST /api/sales-orders/:id/dispatch` | ✅ | ❌ (403) |

---

## 4. Financial Calculation Engine

To prevent tampering by client-side modifications, all pricing is calculated strictly on the backend:

1. **Base Amount**:
   $$\text{Base Amount} = \text{Quantity} \times \text{Unit Price}$$
2. **Discount Amount**:
   $$\text{Discount Amount} = \text{Base Amount} \times \left(\frac{\text{Discount \%}}{100}\right)$$
3. **Amount After Discount**:
   $$\text{Amount After Discount} = \text{Base Amount} - \text{Discount Amount}$$
4. **GST Amount**:
   $$\text{GST Amount} = \text{Amount After Discount} \times \left(\frac{\text{GST \%}}{100}\right)$$
5. **Line Amount**:
   $$\text{Line Amount} = \text{Amount After Discount} + \text{GST Amount}$$
6. **Grand Total**:
   $$\text{Grand Total} = \sum \text{Line Amount}$$

---

## 5. Concurrency & Inventory Reservation Model

When an Admin confirms a Sales Order, the backend runs an atomic PostgreSQL conditional update inside an isolated transaction:

```sql
UPDATE "Inventory"
SET "reservedQuantity" = "reservedQuantity" + :quantity,
    "updatedAt" = NOW()
WHERE "productId" = :productId
  AND ("physicalQuantity" - "reservedQuantity") >= :quantity;
```

- If `affectedRows === 1`: Reservation succeeds for that item.
- If `affectedRows === 0`: Available quantity is insufficient. The entire transaction rolls back immediately with HTTP 409 Conflict. No partial reservations persist.
