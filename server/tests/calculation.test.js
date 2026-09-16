const { calculateLineItem, calculateQuotationTotals } = require('../src/utils/calculations');

describe('Mandatory Test 1 — Quotation Calculation Engine', () => {
  test('correctly calculates line amount with quantity, price, discount %, and GST %', () => {
    // 5 units @ 1000 with 10% discount and 18% GST:
    // Base Amount = 5 * 1000 = 5000
    // Discount = 5000 * 0.10 = 500
    // After Discount = 4500
    // GST = 4500 * 0.18 = 810
    // Line Amount = 4500 + 810 = 5310
    const result = calculateLineItem(5, 1000, 10, 18);

    expect(result.quantity).toBe(5);
    expect(result.unitPrice).toBe(1000);
    expect(result.baseAmount).toBe(5000);
    expect(result.discountAmount).toBe(500);
    expect(result.amountAfterDiscount).toBe(4500);
    expect(result.gstAmount).toBe(810);
    expect(result.lineAmount).toBe(5310);
  });

  test('correctly handles 0% discount and custom GST rate', () => {
    // 2 units @ 8200 with 0% discount and 18% GST:
    // Base = 16400, Discount = 0, After Discount = 16400, GST = 2952, Line = 19352
    const result = calculateLineItem(2, 8200, 0, 18);

    expect(result.baseAmount).toBe(16400);
    expect(result.discountAmount).toBe(0);
    expect(result.amountAfterDiscount).toBe(16400);
    expect(result.gstAmount).toBe(2952);
    expect(result.lineAmount).toBe(19352);
  });

  test('correctly aggregates grand total for multiple line items', () => {
    const items = [
      { productId: 1, quantity: 5, unitPrice: 12500, discountPercent: 5, gstPercent: 18 },
      { productId: 2, quantity: 2, unitPrice: 8200, discountPercent: 0, gstPercent: 18 },
    ];

    const { calculatedItems, grandTotal } = calculateQuotationTotals(items);

    expect(calculatedItems).toHaveLength(2);
    // Item 1: 5 * 12500 = 62500, disc = 3125, after disc = 59375, gst = 10687.50, line = 70062.50
    expect(calculatedItems[0].lineAmount).toBe(70062.5);
    // Item 2: 2 * 8200 = 16400, disc = 0, after disc = 16400, gst = 2952, line = 19352
    expect(calculatedItems[1].lineAmount).toBe(19352.0);

    // Grand total = 70062.5 + 19352 = 89414.5
    expect(grandTotal).toBe(89414.5);
  });

  test('rejects negative prices or invalid quantities', () => {
    expect(() => calculateLineItem(0, 100)).toThrow('Quantity must be greater than 0');
    expect(() => calculateLineItem(-2, 100)).toThrow('Quantity must be greater than 0');
    expect(() => calculateLineItem(5, -100)).toThrow('Unit price cannot be negative');
    expect(() => calculateLineItem(5, 100, 105)).toThrow('Discount percent must be between 0 and 100');
  });
});
