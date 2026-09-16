const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { getAuthTokens } = require('./setup');

describe('Quotation to Sales Order Conversion Tests', () => {
  let salesToken;
  let customer;
  let product;

  beforeAll(async () => {
    const tokens = await getAuthTokens();
    salesToken = tokens.salesToken;

    customer = await prisma.customer.findFirst();
    product = await prisma.product.findFirst();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Mandatory Test 2: Cannot convert DRAFT or REJECTED quotation into Sales Order', async () => {
    // 1. Create a draft enquiry and quotation
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 2 }],
      });

    const enquiryId = enqRes.body.data.id;

    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiryId,
        items: [
          {
            productId: product.id,
            quantity: 2,
            unitPrice: 500,
            discountPercent: 0,
            gstPercent: 18,
          },
        ],
      });

    const quotationId = qtnRes.body.data.id;
    expect(qtnRes.body.data.status).toBe('DRAFT');

    // Attempt to convert DRAFT -> Expect 400 Bad Request
    const draftConvertRes = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(draftConvertRes.status).toBe(400);
    expect(draftConvertRes.body.success).toBe(false);
    expect(draftConvertRes.body.message).toMatch(/must be 'ACCEPTED'/i);

    // Update status to REJECTED
    await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'REJECTED' });

    // Attempt to convert REJECTED -> Expect 400 Bad Request
    const rejectedConvertRes = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(rejectedConvertRes.status).toBe(400);
    expect(rejectedConvertRes.body.success).toBe(false);
    expect(rejectedConvertRes.body.message).toMatch(/must be 'ACCEPTED'/i);
  });

  test('Mandatory Test 3: Can convert ACCEPTED quotation once, duplicate conversion fails with 409 Conflict', async () => {
    // 1. Create enquiry
    const enqRes = await request(app)
      .post('/api/enquiries')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId: customer.id,
        items: [{ productId: product.id, quantity: 3 }],
      });

    const enquiryId = enqRes.body.data.id;

    // 2. Create quotation
    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        enquiryId,
        items: [
          {
            productId: product.id,
            quantity: 3,
            unitPrice: 1000,
            discountPercent: 10,
            gstPercent: 18,
          },
        ],
      });

    const quotationId = qtnRes.body.data.id;

    // 3. Mark quotation as ACCEPTED
    await request(app)
      .patch(`/api/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'ACCEPTED' });

    // 4. First conversion -> Must succeed (201 Created)
    const firstConvert = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(firstConvert.status).toBe(201);
    expect(firstConvert.body.success).toBe(true);
    expect(firstConvert.body.data.orderNumber).toMatch(/^SO-\d{4}-\d{4}$/);
    expect(firstConvert.body.data.status).toBe('PENDING');

    // 5. Second conversion attempt -> Must fail with 409 Conflict
    const secondConvert = await request(app)
      .post(`/api/quotations/${quotationId}/convert`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(secondConvert.status).toBe(409);
    expect(secondConvert.body.success).toBe(false);
    expect(secondConvert.body.message).toMatch(/already been generated/i);
  });
});
