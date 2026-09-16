const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { getAuthTokens } = require('./setup');

describe('Mandatory Test 5 — RBAC Authorization Tests', () => {
  let adminToken;
  let salesToken;
  let testOrder;

  beforeAll(async () => {
    const tokens = await getAuthTokens();
    adminToken = tokens.adminToken;
    salesToken = tokens.salesToken;

    // Fetch or create a pending order for testing
    testOrder = await prisma.salesOrder.findFirst({
      where: { status: 'PENDING' },
    });

    if (!testOrder) {
      const customer = await prisma.customer.findFirst();
      const product = await prisma.product.findFirst();
      const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

      const count = await prisma.salesOrder.count();
      const enqCount = await prisma.enquiry.count();
      const qtnCount = await prisma.quotation.count();

      const enq = await prisma.enquiry.create({
        data: {
          enquiryNumber: `ENQ-RBAC-${Date.now()}`,
          customerId: customer.id,
          createdById: adminUser.id,
          items: { create: [{ productId: product.id, quantity: 1 }] },
        },
      });

      const qtn = await prisma.quotation.create({
        data: {
          quotationNumber: `QTN-RBAC-${Date.now()}`,
          enquiryId: enq.id,
          customerId: customer.id,
          status: 'ACCEPTED',
          totalAmount: 1000,
          createdById: adminUser.id,
          items: {
            create: [
              {
                productId: product.id,
                quantity: 1,
                unitPrice: 1000,
                lineAmount: 1180,
              },
            ],
          },
        },
      });

      testOrder = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-RBAC-${Date.now()}`,
          quotationId: qtn.id,
          customerId: customer.id,
          totalAmount: 1180,
          status: 'PENDING',
          createdById: adminUser.id,
          items: {
            create: [{ productId: product.id, quantity: 1, unitPrice: 1000 }],
          },
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('SALES_USER cannot confirm a Sales Order -> 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/sales-orders/${testOrder.id}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/access forbidden/i);
    expect(res.body.error.currentRole).toBe('SALES_USER');
  });

  test('SALES_USER cannot dispatch a Sales Order -> 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/sales-orders/${testOrder.id}/dispatch`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        vehicleNumber: 'KA-01-XX-1234',
        driverName: 'Ramesh',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/access forbidden/i);
  });

  test('SALES_USER cannot update physical inventory stock -> 403 Forbidden', async () => {
    const product = await prisma.product.findFirst();
    const res = await request(app)
      .patch(`/api/inventory/${product.id}`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ physicalQuantity: 999 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Unauthenticated request returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/customers');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
