const prisma = require('../config/db');
const { AppError } = require('../utils/response');

class ProductService {
  async getAll() {
    const products = await prisma.product.findMany({
      include: {
        inventory: true,
      },
      orderBy: { productCode: 'asc' },
    });

    return products.map((p) => {
      const physical = p.inventory ? p.inventory.physicalQuantity : 0;
      const reserved = p.inventory ? p.inventory.reservedQuantity : 0;
      const available = Math.max(0, physical - reserved);

      return {
        ...p,
        inventory: p.inventory
          ? {
              ...p.inventory,
              availableQuantity: available,
            }
          : null,
      };
    });
  }

  async getById(id) {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const physical = product.inventory ? product.inventory.physicalQuantity : 0;
    const reserved = product.inventory ? product.inventory.reservedQuantity : 0;
    const available = Math.max(0, physical - reserved);

    return {
      ...product,
      inventory: product.inventory
        ? {
            ...product.inventory,
            availableQuantity: available,
          }
        : null,
    };
  }

  async create(data) {
    const { productCode, productName, category, unit, basePrice, initialStock = 0 } = data;

    if (!productCode || !productName || !category || !unit || basePrice === undefined) {
      throw new AppError('All product fields are required', 400);
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          productCode: productCode.trim().toUpperCase(),
          productName: productName.trim(),
          category: category.trim(),
          unit: unit.trim(),
          basePrice: parseFloat(basePrice),
          inventory: {
            create: {
              physicalQuantity: parseInt(initialStock, 10) || 0,
              reservedQuantity: 0,
            },
          },
        },
        include: {
          inventory: true,
        },
      });

      return product;
    });
  }
}

module.exports = new ProductService();
