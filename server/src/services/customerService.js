const prisma = require('../config/db');
const { AppError } = require('../utils/response');

class CustomerService {
  async getAll() {
    return prisma.customer.findMany({
      orderBy: { companyName: 'asc' },
      include: {
        _count: {
          select: {
            enquiries: true,
            quotations: true,
            salesOrders: true,
          },
        },
      },
    });
  }

  async getById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        enquiries: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        salesOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  async create(data) {
    const { companyName, contactPerson, mobile, email, city } = data;

    if (!companyName || !contactPerson || !mobile || !email || !city) {
      throw new AppError('All customer fields (companyName, contactPerson, mobile, email, city) are required', 400);
    }

    return prisma.customer.create({
      data: {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
      },
    });
  }
}

module.exports = new CustomerService();
