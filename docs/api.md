# UDYAM ERP — API Specification

The UDYAM REST API is served on `http://localhost:5000/api`. Interactive Swagger documentation is available at `http://localhost:5000/api-docs`.

## Standard Response Envelopes

### Success (200 / 201)
```json
{
  "success": true,
  "data": {},
  "message": "Optional informative message"
}
```

### Error (400 / 401 / 403 / 404 / 409 / 500)
```json
{
  "success": false,
  "message": "Human readable error explanation",
  "error": {
    "productId": 2,
    "requested": 80,
    "available": 70
  }
}
```

---

## Endpoint Reference Table

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials with bcrypt; returns JWT |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user |
| `GET` | `/api/customers` | All authenticated | Lists all registered customers |
| `GET` | `/api/customers/:id` | All authenticated | Retrieves customer profile & history |
| `POST` | `/api/customers` | `ADMIN`, `SALES_USER` | Registers a new customer company |
| `GET` | `/api/products` | All authenticated | Lists product master with live stock availability |
| `POST` | `/api/products` | `ADMIN` | Adds new industrial product |
| `GET` | `/api/inventory` | All authenticated | Lists all inventory items (Physical, Reserved, Available) |
| `PATCH`| `/api/inventory/:productId` | `ADMIN` | Adjusts physical inventory quantity |
| `GET` | `/api/enquiries` | All authenticated | Lists all customer requirement enquiries |
| `POST` | `/api/enquiries` | `ADMIN`, `SALES_USER` | Creates customer enquiry with multi-product items |
| `PATCH`| `/api/enquiries/:id/status` | `ADMIN`, `SALES_USER` | Updates enquiry status (`NEW`, `QUOTED`, `WON`, `LOST`) |
| `GET` | `/api/quotations` | All authenticated | Lists all quotations with financial totals |
| `POST` | `/api/quotations` | `ADMIN`, `SALES_USER` | Computes discount, GST, and creates quotation |
| `PATCH`| `/api/quotations/:id/status`| `ADMIN`, `SALES_USER` | Transitions status (`DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`) |
| `POST` | `/api/quotations/:id/convert`| `ADMIN`, `SALES_USER` | Transactionally converts ACCEPTED quotation to Sales Order |
| `GET` | `/api/sales-orders` | All authenticated | Lists sales orders with stock reservation indicators |
| `GET` | `/api/sales-orders/:id` | All authenticated | Retrieves order details with item-by-item stock checks |
| `POST` | `/api/sales-orders/:id/confirm`| `ADMIN` | Atomically reserves stock; updates status to CONFIRMED |
| `POST` | `/api/sales-orders/:id/dispatch`| `ADMIN` | Decrements physical & reserved stock; updates to DISPATCHED |
