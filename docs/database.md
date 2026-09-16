# UDYAM ERP — Database Documentation

## 1. Relational Entities & Schema Summary

| Table | Primary Key | Key Foreign Keys | Unique Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `User` | `id` (Int) | — | `email` | User accounts with roles (`ADMIN`, `SALES_USER`) |
| `Customer` | `id` (Int) | — | — | Customer companies & contact details |
| `Product` | `id` (Int) | — | `productCode` | Master product catalog |
| `Inventory` | `id` (Int) | `productId` → `Product.id` | `productId` | Physical & reserved stock |
| `Enquiry` | `id` (Int) | `customerId`, `createdById` | `enquiryNumber` | Customer requirement leads |
| `EnquiryItem` | `id` (Int) | `enquiryId`, `productId` | — | Line items in an enquiry |
| `Quotation` | `id` (Int) | `enquiryId`, `customerId`, `createdById` | `quotationNumber` | Pricing quotations with financial totals |
| `QuotationItem` | `id` (Int) | `quotationId`, `productId` | — | Discount %, GST %, line amounts |
| `SalesOrder` | `id` (Int) | `quotationId`, `customerId`, `createdById` | `orderNumber`, `quotationId` | Confirmed customer orders (1:1 with quote) |
| `SalesOrderItem`| `id` (Int) | `salesOrderId`, `productId` | — | Order line items |
| `Dispatch` | `id` (Int) | `salesOrderId`, `createdById` | `dispatchNumber` | Shipment details (vehicle, driver) |
| `DispatchItem` | `id` (Int) | `dispatchId`, `productId` | — | Dispatched quantities |

---

## 2. Inventory Consistency Invariants

The database maintains strict mathematical invariants:

1. **Non-negativity**:
   $$\text{physicalQuantity} \ge 0$$
   $$\text{reservedQuantity} \ge 0$$
2. **Cap on Reservation**:
   $$\text{reservedQuantity} \le \text{physicalQuantity}$$
3. **Availability**:
   $$\text{availableQuantity} = \text{physicalQuantity} - \text{reservedQuantity}$$
4. **Order Confirmation State Transition**:
   $$\text{physicalQuantity} \text{ (unchanged)}$$
   $$\text{reservedQuantity} \leftarrow \text{reservedQuantity} + \text{orderQuantity}$$
5. **Dispatch State Transition**:
   $$\text{physicalQuantity} \leftarrow \text{physicalQuantity} - \text{dispatchQuantity}$$
   $$\text{reservedQuantity} \leftarrow \text{reservedQuantity} - \text{dispatchQuantity}$$

---

## 3. Database Transaction Strategy

### 1. Quotation to Sales Order Conversion
- **Isolation Level**: Read Committed.
- **Operations**:
  1. Read quotation status; verify it equals `ACCEPTED`.
  2. Verify no Sales Order references `quotationId` (enforced by DB unique index).
  3. Insert `SalesOrder` record.
  4. Bulk insert `SalesOrderItem` records.
  5. Commit or Rollback.

### 2. Atomic Sales Order Confirmation (Reservation)
- **Operations**:
  1. Verify Sales Order status is `PENDING`.
  2. For every item in `SalesOrderItems`:
     ```sql
     UPDATE "Inventory"
     SET "reservedQuantity" = "reservedQuantity" + $1, "updatedAt" = NOW()
     WHERE "productId" = $2 AND ("physicalQuantity" - "reservedQuantity") >= $1;
     ```
  3. If affected rows === 0, abort transaction immediately with 409 Conflict.
  4. Update `SalesOrder` status to `CONFIRMED`.
  5. Commit transaction.

### 3. Product Dispatch
- **Operations**:
  1. Verify Sales Order is `CONFIRMED`.
  2. For each item:
     ```sql
     UPDATE "Inventory"
     SET "physicalQuantity" = "physicalQuantity" - $1,
         "reservedQuantity" = "reservedQuantity" - $1,
         "updatedAt" = NOW()
     WHERE "productId" = $2 AND "physicalQuantity" >= $1 AND "reservedQuantity" >= $1;
     ```
  3. Create `Dispatch` and `DispatchItem` records.
  4. Update `SalesOrder` status to `DISPATCHED`.
  5. Commit transaction.
