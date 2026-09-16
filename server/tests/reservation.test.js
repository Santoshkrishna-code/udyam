const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { getAuthTokens } = require('./setup');

describe('Inventory Reservation & Dispatch Tests', () => {
  let adminToken;
  let salesToken;
  let testCustomer;
  let testProduct;

  beforeAll(async () => {
    const tokens = await getAuthTokens();
    adminToken = tokens.adminToken;
    salesToken = tokens.salesToken;

    testCustomer = await prisma.customer.findFirst();

    // Create an isolated test product with physical=70, reserved=0 (available=70)
    testProduct = await prisma.product.create({
      data: {
        productCode: `TEST-RES-${Date.now()}`,
        productName: 'Test Resizing Valve',
        category: 'Testing',
        unit: 'Unit',
        basePrice: 500.0,
        inventory: {
          create: {
            physicalQuantity: 70,
            reservedQuantity: 0,
          },
        },
      },
      include: { inventory: true },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Mandatory Test 4: Insufficient inventory returns 409 Conflict and rolls back without partial reservation', async () => {
    // Current stock: Available = 70.
    // Order requirement = 80.
    // 1. Create enquiry
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId: testCustomer.id,
        items: [{ productId: testProduct.id, quantity: 80 }],
      });
    const enquiryId = enqRes.body.data.id;

    // 2. Create quotation
    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiryId,
        items: [{ productId: testProduct.id, quantity: 80, unitPrice: 500 }],
      });
    const quotationId = qtnRes.body.data.id;

    // 3. Mark ACCEPTED
    await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // 4. Convert to Sales Order
    const convertRes = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    const orderId = convertRes.body.data.id;

    // 5. Admin attempts to confirm order requiring 80 units when only 70 available
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.success).toBe(false);
    expect(confirmRes.body.message).toMatch(/insufficient inventory/i);
    expect(confirmRes.body.error.requested).toBe(80);
    expect(confirmRes.body.error.available).toBe(70);

    // Verify inventory state is completely untouched (Rollback verified)
    const inv = await prisma.inventory.findUnique({
      where: { productId: testProduct.id },
    });
    expect(inv.physicalQuantity).toBe(70);
    expect(inv.reservedQuantity).toBe(0);

    // Verify order remains PENDING
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
    });
    expect(order.status).toBe('PENDING');
  });

  test('Successful Order Confirmation reserves stock without reducing physical quantity', async () => {
    // Current stock: Physical=70, Reserved=0, Available=70.
    // Order requirement = 50.
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId: testCustomer.id,
        items: [{ productId: testProduct.id, quantity: 50 }],
      });
    const enquiryId = enqRes.body.data.id;

    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiryId,
        items: [{ productId: testProduct.id, quantity: 50, unitPrice: 500 }],
      });
    const quotationId = qtnRes.body.data.id;

    await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    const convertRes = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);
    const orderId = convertRes.body.data.id;

    // Confirm order
    const confirmRes = await request(app)
      .post(`/api/sales-orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.status).toBe('CONFIRMED');

    // Check inventory: Physical=70, Reserved=50, Available=20
    const inv = await prisma.inventory.findUnique({
      where: { productId: testProduct.id },
    });
    expect(inv.physicalQuantity).toBe(70);
    expect(inv.reservedQuantity).toBe(50);

    // Test Dispatch: Admin dispatches 50 units
    const dispatchRes = await request(app)
      .post(`/api/sales-orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicleNumber: 'MH-12-AB-9999',
        driverName: 'Suresh Kumar',
      });

    expect(dispatchRes.status).toBe(201);
    expect(dispatchRes.body.success).toBe(true);
    expect(dispatchRes.body.data.dispatchNumber).toMatch(/^DSP-\d{4}-\d{4}$/);

    // Post-dispatch stock: Physical = 70 - 50 = 20, Reserved = 50 - 50 = 0, Available = 20
    const finalInv = await prisma.inventory.findUnique({
      where: { productId: testProduct.id },
    });
    expect(finalInv.physicalQuantity).toBe(20);
    expect(finalInv.reservedQuantity).toBe(0);
  });
});
