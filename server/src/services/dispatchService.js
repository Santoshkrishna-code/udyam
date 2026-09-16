const prisma = require('../config/db');
const { AppError } = require('../utils/response');
const inventoryService = require('./inventoryService');

class DispatchService {
  async getAll() {
    return prisma.dispatch.findMany({
      include: {
        salesOrder: {
          include: { customer: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        salesOrder: {
          include: { customer: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (!dispatch) {
      throw new AppError('Dispatch record not found', 404);
    }

    return dispatch;
  }

  /**
   * Process dispatch for a CONFIRMED sales order.
   * Atomically decrements both physicalQuantity and reservedQuantity.
   */
  async processDispatch(userId, salesOrderId, data) {
    const oid = parseInt(salesOrderId, 10);
    const { vehicleNumber, driverName, dispatchDate, items } = data;

    if (!vehicleNumber || !driverName) {
      throw new AppError('Vehicle number and driver name are required for dispatch', 400);
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: oid },
        include: {
          items: true,
          dispatches: true,
        },
      });

      if (!order) {
        throw new AppError('Sales Order not found', 404);
      }

      if (order.status !== 'CONFIRMED') {
        throw new AppError(
          `Cannot dispatch order. Only CONFIRMED orders can be dispatched. Current status: ${order.status}`,
          400
        );
      }

      // Determine items to dispatch: if not explicitly specified, dispatch full order quantities
      const dispatchItemsToProcess =
        items && Array.isArray(items) && items.length > 0
          ? items
          : order.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

      // Atomically decrement physical & reserved stock
      for (const item of dispatchItemsToProcess) {
        await inventoryService.dispatchItemAtomically(tx, item.productId, item.quantity);
      }

      // Generate dispatch number
      const count = await tx.dispatch.count();
      const year = new Date().getFullYear();
      const dispatchNumber = `DSP-${year}-${String(count + 1).padStart(4, '0')}`;

      // Create Dispatch record
      const dispatch = await tx.dispatch.create({
        data: {
          dispatchNumber,
          salesOrderId: oid,
          dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          driverName: driverName.trim(),
          createdById: userId,
          items: {
            create: dispatchItemsToProcess.map((i) => ({
              productId: parseInt(i.productId, 10),
              quantity: parseInt(i.quantity, 10),
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          salesOrder: true,
        },
      });

      // Update Sales Order status to DISPATCHED
      await tx.salesOrder.update({
        where: { id: oid },
        data: { status: 'DISPATCHED' },
      });

      return dispatch;
    });
  }
}

module.exports = new DispatchService();
