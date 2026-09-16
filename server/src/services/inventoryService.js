const prisma = require('../config/db');
const { AppError } = require('../utils/response');

class InventoryService {
  async getAll() {
    const records = await prisma.inventory.findMany({
      include: {
        product: true,
      },
      orderBy: {
        product: { productCode: 'asc' },
      },
    });

    return records.map((r) => ({
      id: r.id,
      productId: r.productId,
      productCode: r.product.productCode,
      productName: r.product.productName,
      category: r.product.category,
      unit: r.product.unit,
      physicalQuantity: r.physicalQuantity,
      reservedQuantity: r.reservedQuantity,
      availableQuantity: Math.max(0, r.physicalQuantity - r.reservedQuantity),
      updatedAt: r.updatedAt,
    }));
  }

  async getByProductId(productId) {
    const record = await prisma.inventory.findUnique({
      where: { productId: parseInt(productId, 10) },
      include: { product: true },
    });

    if (!record) {
      throw new AppError('Inventory record not found for product', 404);
    }

    return {
      id: record.id,
      productId: record.productId,
      productCode: record.product.productCode,
      productName: record.product.productName,
      physicalQuantity: record.physicalQuantity,
      reservedQuantity: record.reservedQuantity,
      availableQuantity: Math.max(0, record.physicalQuantity - record.reservedQuantity),
      updatedAt: record.updatedAt,
    };
  }

  async updatePhysicalQuantity(productId, newPhysicalQuantity) {
    const pid = parseInt(productId, 10);
    const qty = parseInt(newPhysicalQuantity, 10);

    if (isNaN(qty) || qty < 0) {
      throw new AppError('Physical quantity must be a non-negative integer', 400);
    }

    const current = await prisma.inventory.findUnique({
      where: { productId: pid },
      include: { product: true },
    });

    if (!current) {
      throw new AppError('Product not found in inventory', 404);
    }

    if (qty < current.reservedQuantity) {
      throw new AppError(
        `Cannot set physical quantity to ${qty} as ${current.reservedQuantity} units are currently reserved`,
        400
      );
    }

    const updated = await prisma.inventory.update({
      where: { productId: pid },
      data: { physicalQuantity: qty },
      include: { product: true },
    });

    return {
      ...updated,
      availableQuantity: updated.physicalQuantity - updated.reservedQuantity,
    };
  }

  /**
   * Atomically reserves stock inside a transaction using row-level update condition.
   * HLD Section 15:
   * UPDATE "Inventory" SET "reservedQuantity" = "reservedQuantity" + :quantity
   * WHERE "productId" = :productId AND ("physicalQuantity" - "reservedQuantity") >= :quantity;
   */
  async reserveItemAtomically(tx, productId, quantity) {
    const pid = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
      throw new AppError('Reservation quantity must be positive', 400);
    }

    // Atomic database update condition
    const affected = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" + ${qty},
          "updatedAt" = NOW()
      WHERE "productId" = ${pid}
        AND ("physicalQuantity" - "reservedQuantity") >= ${qty}
    `;

    if (affected === 0) {
      // Find current stock to provide a rich error description
      const current = await tx.inventory.findUnique({
        where: { productId: pid },
        include: { product: true },
      });

      const available = current ? current.physicalQuantity - current.reservedQuantity : 0;
      const productName = current?.product?.productName || `Product ID ${pid}`;

      throw new AppError(
        `Insufficient inventory for ${productName}. Available: ${available}, Required: ${qty}`,
        409,
        {
          productId: pid,
          productName,
          requested: qty,
          available: Math.max(0, available),
        }
      );
    }

    return true;
  }

  /**
   * Atomically dispatches stock inside a transaction.
   * Decrements both physicalQuantity and reservedQuantity.
   */
  async dispatchItemAtomically(tx, productId, quantity) {
    const pid = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
      throw new AppError('Dispatch quantity must be positive', 400);
    }

    const affected = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "physicalQuantity" = "physicalQuantity" - ${qty},
          "reservedQuantity" = "reservedQuantity" - ${qty},
          "updatedAt" = NOW()
      WHERE "productId" = ${pid}
        AND "physicalQuantity" >= ${qty}
        AND "reservedQuantity" >= ${qty}
    `;

    if (affected === 0) {
      const current = await tx.inventory.findUnique({
        where: { productId: pid },
        include: { product: true },
      });

      throw new AppError(
        `Cannot dispatch ${qty} units. Reserved quantity is ${current?.reservedQuantity || 0}`,
        409,
        {
          productId: pid,
          requested: qty,
          reserved: current?.reservedQuantity || 0,
        }
      );
    }

    return true;
  }
}

module.exports = new InventoryService();
