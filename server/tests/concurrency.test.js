const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { getAuthTokens } = require('./setup');

describe('Bonus Test — Concurrent Inventory Reservation Protection', () => {
  let adminToken;
  let salesToken;
  let testCustomer;
  let concurrentProduct;
  let orderA;
  let orderB;

  beforeAll(async () => {
    const tokens = await getAuthTokens();
    adminToken = tokens.adminToken;
    salesToken = tokens.salesToken;

    testCustomer = await prisma.customer.findFirst();

    // Create a product with Available = 100 (physical=100, reserved=0)
    concurrentProduct = await prisma.product.create({
      data: {
        productCode: `CONCUR-${Date.now()}`,
        productName: 'Concurrent Bearing Unit',
        category: 'Mechanical',
        unit: 'Unit',
        basePrice: 1000.0,
        inventory: {
          create: {
            physicalQuantity: 100,
            reservedQuantity: 0,
          },
        },
      },
      include: { inventory: true },
    });

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    // Helper to create quotation and sales order
    async function createOrderWithQuantity(qty, suffix) {
      const enq = await prisma.enquiry.create({
        data: {
          enquiryNumber: `ENQ-CONC-${suffix}-${Date.now()}`,
          customerId: testCustomer.id,
          createdById: adminUser.id,
          items: { create: [{ productId: concurrentProduct.id, quantity: qty }] },
        },
      });

      const qtn = await prisma.quotation.create({
        data: {
          quotationNumber: `QTN-CONC-${suffix}-${Date.now()}`,
          enquiryId: enq.id,
          customerId: testCustomer.id,
          status: 'ACCEPTED',
          totalAmount: qty * 1000,
          createdById: adminUser.id,
          items: {
            create: [
              {
                productId: concurrentProduct.id,
                quantity: qty,
                unitPrice: 1000,
                lineAmount: qty * 1000 * 1.18,
              },
            ],
          },
        },
      });

      return prisma.salesOrder.create({
        data: {
          orderNumber: `SO-CONC-${suffix}-${Date.now()}`,
          quotationId: qtn.id,
          customerId: testCustomer.id,
          totalAmount: qty * 1000 * 1.18,
          status: 'PENDING',
          createdById: adminUser.id,
          items: {
            create: [{ productId: concurrentProduct.id, quantity: qty, unitPrice: 1000 }],
          },
        },
      });
    }

    // Order A requires 80 units
    orderA = await createOrderWithQuantity(80, 'A');
    // Order B requires 50 units
    orderB = await createOrderWithQuantity(50, 'B');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Concurrent requests for 80 and 50 units on 100 available stock -> Exactly one succeeds, one fails with 409', async () => {
    // Fire both confirmation requests at the exact same moment
    const [resA, resB] = await Promise.all([
      request(app)
        .post(`/api/sales-orders/${orderA.id}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .post(`/api/sales-orders/${orderB.id}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    const statuses = [resA.status, resB.status];
    console.log(`Concurrent results: Order A=${resA.status}, Order B=${resB.status}`);

    // Exactly one must be 200 (Success) and one must be 409 (Conflict)
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // Fetch final inventory from database
    const finalInv = await prisma.inventory.findUnique({
      where: { productId: concurrentProduct.id },
    });

    const finalAvailable = finalInv.physicalQuantity - finalInv.reservedQuantity;

    // Invariant check: Physical is still 100
    expect(finalInv.physicalQuantity).toBe(100);

    // Reserved must be either 80 (if A won) or 50 (if B won), NEVER 130
    expect([80, 50]).toContain(finalInv.reservedQuantity);

    // Available must be either 20 (if A won) or 50 (if B won), NEVER negative
    expect([20, 50]).toContain(finalAvailable);
    expect(finalAvailable).toBeGreaterThanOrEqual(0);
  });
});
