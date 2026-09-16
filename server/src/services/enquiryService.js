const prisma = require('../config/db');
const { AppError } = require('../utils/response');

class EnquiryService {
  async getAll() {
    return prisma.enquiry.findMany({
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { product: true },
        },
        quotations: {
          select: { id: true, quotationNumber: true, status: true, totalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        customer: true,
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
        quotations: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }

    return enquiry;
  }

  async create(userId, data) {
    const { customerId, requiredDate, notes, items } = data;

    if (!customerId) {
      throw new AppError('Customer ID is required', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one product item is required in the enquiry', 400);
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId, 10) },
    });
    if (!customer) {
      throw new AppError('Specified customer does not exist', 404);
    }

    // Validate all items have valid product and positive quantity
    for (const item of items) {
      if (!item.productId || !item.quantity || parseInt(item.quantity, 10) <= 0) {
        throw new AppError('Each item must specify a valid product and positive quantity', 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      const count = await tx.enquiry.count();
      const year = new Date().getFullYear();
      const enquiryNumber = `ENQ-${year}-${String(count + 1).padStart(4, '0')}`;

      const enquiry = await tx.enquiry.create({
        data: {
          enquiryNumber,
          customerId: parseInt(customerId, 10),
          requiredDate: requiredDate ? new Date(requiredDate) : null,
          notes: notes ? notes.trim() : null,
          status: 'NEW',
          createdById: userId,
          items: {
            create: items.map((i) => ({
              productId: parseInt(i.productId, 10),
              quantity: parseInt(i.quantity, 10),
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      return enquiry;
    });
  }

  async updateStatus(id, status) {
    const validStatuses = ['NEW', 'QUOTED', 'WON', 'LOST'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    return prisma.enquiry.update({
      where: { id: parseInt(id, 10) },
      data: { status },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  }
}

module.exports = new EnquiryService();
