const prisma = require('../config/db');
const { AppError } = require('../utils/response');
const { calculateQuotationTotals } = require('../utils/calculations');

class QuotationService {
  async getAll() {
    return prisma.quotation.findMany({
      include: {
        customer: true,
        enquiry: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { product: true },
        },
        salesOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        customer: true,
        enquiry: {
          include: {
            items: { include: { product: true } },
          },
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
        salesOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });

    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    return quotation;
  }

  async create(userId, data) {
    const { enquiryId, customerId, validUntil, items } = data;

    if (!enquiryId) {
      throw new AppError('Enquiry ID is required to generate a quotation', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Quotation must contain at least one product item', 400);
    }

    // Verify enquiry exists
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(enquiryId, 10) },
      include: { customer: true },
    });

    if (!enquiry) {
      throw new AppError('Associated enquiry not found', 404);
    }

    const effectiveCustomerId = customerId ? parseInt(customerId, 10) : enquiry.customerId;

    // Financial calculation strictly on backend
    const { calculatedItems, grandTotal } = calculateQuotationTotals(items);

    return prisma.$transaction(async (tx) => {
      const count = await tx.quotation.count();
      const year = new Date().getFullYear();
      const quotationNumber = `QTN-${year}-${String(count + 1).padStart(4, '0')}`;

      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,
          enquiryId: enquiry.id,
          customerId: effectiveCustomerId,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'DRAFT',
          totalAmount: grandTotal,
          createdById: userId,
          items: {
            create: calculatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent,
              gstPercent: item.gstPercent,
              lineAmount: item.lineAmount,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Update enquiry status to QUOTED
      await tx.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'QUOTED' },
      });

      return quotation;
    });
  }

  async updateStatus(id, newStatus) {
    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'];
    const status = newStatus?.toUpperCase();

    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid quotation status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: parseInt(id, 10) },
      include: { salesOrder: true },
    });

    if (!quotation) {
      throw new AppError('Quotation not found', 404);
    }

    if (quotation.salesOrder) {
      throw new AppError('Cannot modify status of a quotation that has already been converted to a Sales Order', 400);
    }

    return prisma.quotation.update({
      where: { id: parseInt(id, 10) },
      data: { status },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  }
}

module.exports = new QuotationService();
