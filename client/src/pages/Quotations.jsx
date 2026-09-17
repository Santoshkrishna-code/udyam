import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Button,
  Input,
  Select,
  Modal,
  Card,
  StatusBadge,
  Table,
  Alert,
} from '../components/common';
import { Plus, Trash2, Send, CheckCircle2, XCircle, ArrowRight, ShoppingCart } from 'lucide-react';

export default function Quotations({ preselectedEnquiry, setActivePage }) {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Form state
  const [enquiryId, setEnquiryId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, discountPercent: 0, gstPercent: 18 },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qtnRes, enqRes, prodRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/enquiries'),
        api.get('/products'),
      ]);
      setQuotations(qtnRes.data || []);
      setEnquiries(enqRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill if navigated from Enquiries
  useEffect(() => {
    if (preselectedEnquiry) {
      setEnquiryId(preselectedEnquiry.id);
      if (preselectedEnquiry.items && preselectedEnquiry.items.length > 0) {
        setItems(
          preselectedEnquiry.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.product?.basePrice || 0,
            discountPercent: 0,
            gstPercent: 18,
          }))
        );
      }
      setModalOpen(true);
    }
  }, [preselectedEnquiry]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', quantity: 1, unitPrice: 0, discountPercent: 0, gstPercent: 18 },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index, prodId) => {
    const prod = products.find((p) => p.id === parseInt(prodId, 10));
    const updated = [...items];
    updated[index].productId = prodId;
    if (prod) {
      updated[index].unitPrice = prod.basePrice;
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Preview financial calculations for client summary
  const calculatePreview = () => {
    let grandTotal = 0;
    const lines = items.map((i) => {
      const qty = Number(i.quantity) || 0;
      const price = Number(i.unitPrice) || 0;
      const disc = Number(i.discountPercent) || 0;
      const gst = Number(i.gstPercent) || 0;

      const base = qty * price;
      const discountAmount = base * (disc / 100);
      const afterDisc = base - discountAmount;
      const gstAmount = afterDisc * (gst / 100);
      const lineTotal = afterDisc + gstAmount;

      grandTotal += lineTotal;
      return { base, discountAmount, gstAmount, lineTotal };
    });

    return { lines, grandTotal };
  };

  const preview = calculatePreview();

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!enquiryId) {
      setAlert({ type: 'error', message: 'Please select an enquiry' });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId || items[i].quantity <= 0 || items[i].unitPrice < 0) {
        setAlert({
          type: 'error',
          message: `Row ${i + 1}: Valid product, quantity > 0, and non-negative unit price required`,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post('/quotations', {
        enquiryId,
        validUntil: validUntil || null,
        items,
      });
      setAlert({ type: 'success', message: 'Quotation generated and calculated successfully!' });
      setModalOpen(false);
      setEnquiryId('');
      setValidUntil('');
      setItems([{ productId: '', quantity: 1, unitPrice: 0, discountPercent: 0, gstPercent: 18 }]);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (quoteId, status) => {
    setAlert(null);
    try {
      await api.patch(`/quotations/${quoteId}/status`, { status });
      setAlert({ type: 'success', message: `Quotation updated to ${status}` });
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleConvertToOrder = async (quoteId) => {
    setAlert(null);
    try {
      const res = await api.post(`/quotations/${quoteId}/convert`);
      setAlert({
        type: 'success',
        message: `Quotation successfully converted to Sales Order ${res.data?.orderNumber}!`,
      });
      loadData();
      if (setActivePage) {
        setTimeout(() => setActivePage('sales-orders'), 1200);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const columns = [
    {
      header: 'Quotation #',
      key: 'quotationNumber',
      render: (val) => <span className="font-mono font-bold text-orange-700">{val}</span>,
    },
    {
      header: 'Enquiry Ref',
      key: 'enquiry',
      render: (enq) => (
        <span className="font-mono text-xs text-slate-600">{enq?.enquiryNumber || '—'}</span>
      ),
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (cust) => (
        <div>
          <span className="font-semibold text-slate-900 block">{cust?.companyName}</span>
          <span className="text-xs text-slate-500">{cust?.city}</span>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      key: 'totalAmount',
      render: (val) => (
        <span className="font-extrabold text-slate-900">₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Workflow Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Transition buttons based on status */}
          {row.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={() => handleUpdateStatus(row.id, 'SENT')}
            >
              Send Quote
            </Button>
          )}

          {row.status === 'SENT' && (
            <>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleUpdateStatus(row.id, 'ACCEPTED')}
              >
                Accept
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
              >
                Reject
              </Button>
            </>
          )}

          {/* If ACCEPTED and no Sales Order yet, prominent convert button */}
          {row.status === 'ACCEPTED' && !row.salesOrder && (
            <Button
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              onClick={() => handleConvertToOrder(row.id)}
            >
              Convert to Order
            </Button>
          )}

          {/* Already converted */}
          {row.salesOrder && (
            <span className="inline-flex items-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              ✓ {row.salesOrder.orderNumber}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quotations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotation calculation engine with discounts, GST, and 1-click conversion to Sales Orders.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          New Quotation
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Quotations Table */}
      <Card noPadding>
        <Table
          columns={columns}
          data={quotations}
          emptyMessage="No quotations generated yet. Click '+ New Quotation' to begin."
          isLoading={loading}
        />
      </Card>

      {/* New Quotation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Quotation"
        subtitle="Backend enforces exact line amounts, discount deduction, GST, and grand total"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <span className="text-xs text-slate-500 block">Quotation Grand Total:</span>
              <span className="text-xl font-extrabold text-slate-900">
                ₹{preview.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateQuotation}
                isLoading={submitting}
              >
                Create Quotation
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateQuotation} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Enquiry Reference"
              value={enquiryId}
              onChange={(e) => setEnquiryId(e.target.value)}
              required
              options={enquiries.map((enq) => ({
                value: enq.id,
                label: `${enq.enquiryNumber} — ${enq.customer?.companyName} (${enq.status})`,
              }))}
            />

            <Input
              label="Quotation Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          {/* Quotation Line Items with Price, Discount %, and GST % */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Line Items (Quantity × Price − Discount + GST)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="text-orange-600 hover:text-orange-700 text-xs font-semibold py-1 px-2"
              >
                + Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineCalc = preview.lines[idx] || {};
                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-4">
                        <Select
                          placeholder="Select Product"
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          required
                          options={products.map((p) => ({
                            value: p.id,
                            label: `${p.productCode} — ${p.productName}`,
                          }))}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price (₹)"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          required
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="Disc %"
                          value={item.discountPercent}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="GST %"
                          value={item.gstPercent}
                          onChange={(e) => handleItemChange(idx, 'gstPercent', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between pl-2">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Line Total</span>
                          <span className="font-extrabold text-sm text-slate-900">
                            ₹{(lineCalc.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown sub-row */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 bg-white/60 p-2 rounded-lg border border-slate-100">
                      <span>Base: ₹{(lineCalc.base || 0).toFixed(2)}</span>
                      <span>Discount: -₹{(lineCalc.discountAmount || 0).toFixed(2)}</span>
                      <span>GST: +₹{(lineCalc.gstAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
