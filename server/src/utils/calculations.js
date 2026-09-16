/**
 * Calculates financial amounts for a single quotation item according to HLD Section 11:
 * Base Amount = Quantity * Unit Price
 * Discount Amount = Base Amount * Discount %
 * Amount After Discount = Base Amount - Discount Amount
 * GST Amount = Amount After Discount * GST %
 * Line Amount = Amount After Discount + GST Amount
 */
function calculateLineItem(quantity, unitPrice, discountPercent = 0, gstPercent = 18) {
  const qty = Number(quantity);
  const price = Number(unitPrice);
  const discountPct = Number(discountPercent) || 0;
  const gstPct = Number(gstPercent) || 0;

  if (qty <= 0) throw new Error('Quantity must be greater than 0');
  if (price < 0) throw new Error('Unit price cannot be negative');
  if (discountPct < 0 || discountPct > 100) throw new Error('Discount percent must be between 0 and 100');
  if (gstPct < 0) throw new Error('GST percent cannot be negative');

  const baseAmount = qty * price;
  const discountAmount = baseAmount * (discountPct / 100);
  const amountAfterDiscount = baseAmount - discountAmount;
  const gstAmount = amountAfterDiscount * (gstPct / 100);
  const lineAmount = amountAfterDiscount + gstAmount;

  return {
    quantity: qty,
    unitPrice: Number(price.toFixed(2)),
    discountPercent: Number(discountPct.toFixed(2)),
    gstPercent: Number(gstPct.toFixed(2)),
    baseAmount: Number(baseAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    amountAfterDiscount: Number(amountAfterDiscount.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    lineAmount: Number(lineAmount.toFixed(2)),
  };
}

/**
 * Calculates grand total for a set of items
 */
function calculateQuotationTotals(items = []) {
  if (!items || items.length === 0) {
    return {
      calculatedItems: [],
      grandTotal: 0,
    };
  }

  const calculatedItems = items.map((item) => {
    const calc = calculateLineItem(
      item.quantity,
      item.unitPrice,
      item.discountPercent,
      item.gstPercent
    );
    return {
      productId: item.productId,
      ...calc,
    };
  });

  const grandTotal = calculatedItems.reduce((sum, item) => sum + item.lineAmount, 0);

  return {
    calculatedItems,
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

module.exports = {
  calculateLineItem,
  calculateQuotationTotals,
};
