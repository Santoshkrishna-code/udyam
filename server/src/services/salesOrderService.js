const prisma = require('../config/db');
const { AppError } = require('../utils/response');
const inventoryService = require('./inventoryService');

class SalesOrderService {
  async getAll() {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        quotation: {
          select: { id: true, quotationNumber: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        dispatches: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const itemsWithStock = order.items.map((item) => {
        const physical = item.product?.inventory?.physicalQuantity || 0;
        const reserved = item.product?.inventory?.reservedQuantity || 0;
        const available = Math.max(0, physical - reserved);

        return {
          ...item,
          stockInfo: {
            physicalQuantity: physical,
            reservedQuantity: reserved,
            availableQuantity: available,
            isSufficient: available >= item.quantity,
          },
        };
      });

      return {
        ...order,
        items: itemsWithStock,
      };
    });
  }

  async getById(id) {
    const order = await prisma.salesOrder.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        customer: true,
        quotation: {
          include: { enquiry: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              include: { inventory: true },
            },
          },
        },
        dispatches: {
          include: {
            items: { include: { product: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Sales Order not found', 404);
    }

    const itemsWithStock = order.items.map((item) => {
      const physical = item.product?.inventory?.physicalQuantity || 0;
      const reserved = item.product?.inventory?.reservedQuantity || 0;
      const available = Math.max(0, physical - reserved);

      return {
        ...item,
        stockInfo: {
          physicalQuantity: physical,
          reservedQuantity: reserved,
          availableQuantity: available,
          isSufficient: available >= item.quantity,
        },
      };
    });

    return {
      ...order,
      items: itemsWithStock,
    };
  }

  /**
   * Converts an ACCEPTED quotation into a Sales Order.
   * Enforces status check, duplicate check, and transaction.
   */
  async convertFromQuotation(userId, quotationId) {
    const qid = parseInt(quotationId, 10);
    if (!qid) {
      throw new AppError('Valid quotation ID is required', 400);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch quotation with items and existing order
      const quotation = await tx.quotation.findUnique({
        where: { id: qid },
        include: {
          items: true,
          salesOrder: true,
          customer: true,
        },
      });

      if (!quotation) {
        throw new AppError('Quotation not found', 404);
      }

      // 2. Strict status check: only ACCEPTED can convert
      if (quotation.status !== 'ACCEPTED') {
        throw new AppError(
          `Cannot convert quotation to Sales Order. Quotation status must be 'ACCEPTED', but current status is '${quotation.status}'`,
          400
        );
      }

      // 3. Prevent duplicate Sales Order
      if (quotation.salesOrder) {
        throw new AppError(
          `A Sales Order (${quotation.salesOrder.orderNumber}) has already been generated from this quotation`,
          409
        );
      }

      // 4. Generate order number
      const year = new Date().getFullYear();
      const prefix = `SO-${year}-`;

      const latest = await tx.salesOrder.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });

      let nextSeq = 1;
      if (latest) {
        const parts = latest.orderNumber.split('-');
        nextSeq = parseInt(parts[2], 10) + 1;
      }

      const orderNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

      // 5. Create Sales Order
      const salesOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          totalAmount: quotation.totalAmount,
          status: 'PENDING',
          createdById: userId,
          items: {
            create: quotation.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      return salesOrder;
    });
  }

  /**
   * Confirms a Sales Order (ADMIN only).
   * Atomically reserves stock for every item.
   * If any item has insufficient stock, transaction rolls back with 409.
   */
  async confirmOrder(userId, salesOrderId) {
    const oid = parseInt(salesOrderId, 10);

    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: oid },
        include: {
          items: {
            include: {
              product: {
                include: { inventory: true },
              },
            },
          },
        },
      });

      if (!order) {
        throw new AppError('Sales Order not found', 404);
      }

      if (order.status !== 'PENDING') {
        throw new AppError(
          `Only PENDING sales orders can be confirmed. Current status: ${order.status}`,
          400
        );
      }

      // Atomically reserve inventory for every item in order
      for (const item of order.items) {
        await inventoryService.reserveItemAtomically(tx, item.productId, item.quantity);
      }

      // Update order status to CONFIRMED
      const confirmedOrder = await tx.salesOrder.update({
        where: { id: oid },
        data: { status: 'CONFIRMED' },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      return confirmedOrder;
    });
  }
}

module.exports = new SalesOrderService();
