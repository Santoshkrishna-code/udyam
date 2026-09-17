import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  ShoppingCart,
  Search,
  FileText,
  Building,
  Calendar,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export default function Quotations({ preselectedEnquiry, setActivePage }) {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Filter toolbar state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

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

      // If selected quote is open in detail modal, refresh it
      if (selectedQuote) {
        const refreshed = (qtnRes.data || []).find((q) => q.id === selectedQuote.id);
        if (refreshed) setSelectedQuote(refreshed);
      }
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

  // Preview financial calculations for form
  const calculatePreview = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
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

      subtotal += base;
      totalDiscount += discountAmount;
      totalGst += gstAmount;
      grandTotal += lineTotal;

      return { base, discountAmount, gstAmount, lineTotal };
    });

    return { lines, subtotal, totalDiscount, totalGst, grandTotal };
  };

  const preview = calculatePreview();

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!enquiryId) {
      setAlert({ type: 'error', message: 'Please select an enquiry reference' });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId || items[i].quantity <= 0 || items[i].unitPrice < 0) {
        setAlert({
          type: 'error',
          message: `Line ${i + 1}: Valid product, quantity > 0, and non-negative unit price required`,
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
      setAlert({ type: 'success', message: 'Quotation created successfully' });
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
    setConvertingId(quoteId);
    try {
      const res = await api.post(`/quotations/${quoteId}/convert`);
      setAlert({
        type: 'success',
        message: `Quotation converted to Sales Order ${res.data?.orderNumber}!`,
      });
      loadData();
      if (setActivePage) {
        setTimeout(() => setActivePage('sales-orders'), 900);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setConvertingId(null);
    }
  };

  const openDetailView = (quote) => {
    setSelectedQuote(quote);
    setDetailModalOpen(true);
  };

  // Filtered quotations list
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const qNum = (q.quotationNumber || '').toLowerCase();
      const cName = (q.customer?.companyName || '').toLowerCase();
      const matchSearch =
        !searchTerm ||
        qNum.includes(searchTerm.toLowerCase()) ||
        cName.includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
      const matchCustomer =
        customerFilter === 'ALL' || String(q.customerId) === customerFilter;

      return matchSearch && matchStatus && matchCustomer;
    });
  }, [quotations, searchTerm, statusFilter, customerFilter]);

  // Unique customers for filter
  const customerOptions = useMemo(() => {
    const map = new Map();
    quotations.forEach((q) => {
      if (q.customer) {
        map.set(String(q.customerId), q.customer.companyName);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [quotations]);

  const columns = [
    {
      header: 'Quotation',
      key: 'quotationNumber',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => openDetailView(row)}
          className="text-left font-semibold text-[#111827] hover:text-[#FF7A00] transition-colors group flex items-center gap-1.5"
        >
          <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#FF7A00]" />
          <span>{val}</span>
        </button>
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
      header: 'Amount',
      key: 'totalAmount',
      render: (val) => (
        <span className="font-bold text-slate-900">
          ₹{Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Valid Until',
      key: 'validUntil',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val ? new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => openDetailView(row)}
            className="text-slate-600 hover:text-slate-900"
          >
            View
          </Button>

          {row.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={() => handleUpdateStatus(row.id, 'SENT')}
            >
              Send
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

          {row.status === 'ACCEPTED' && !row.salesOrder && (
            <Button
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              isLoading={convertingId === row.id}
              onClick={() => handleConvertToOrder(row.id)}
            >
              Convert to Order
            </Button>
          )}

          {row.salesOrder && (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and manage commercial proposals for customers.
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search quotations or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all"
          >
            <option value="ALL">Status: All</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all max-w-[200px]"
          >
            <option value="ALL">Customer: All</option>
            {customerOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <Card noPadding>
        <Table
          columns={columns}
          data={filteredQuotations}
          emptyMessage="No quotations found matching the selected filters."
          isLoading={loading}
        />
      </Card>

      {/* Quotation Proposal Detail Modal */}
      {selectedQuote && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Quotation: ${selectedQuote.quotationNumber}`}
          subtitle={`Commercial proposal for ${selectedQuote.customer?.companyName}`}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedQuote.status} />
                {selectedQuote.validUntil && (
                  <span className="text-xs text-slate-500">
                    Valid until: {new Date(selectedQuote.validUntil).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>

                {selectedQuote.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    icon={Send}
                    onClick={() => {
                      handleUpdateStatus(selectedQuote.id, 'SENT');
                      setDetailModalOpen(false);
                    }}
                  >
                    Send Quotation
                  </Button>
                )}

                {selectedQuote.status === 'SENT' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => {
                        handleUpdateStatus(selectedQuote.id, 'REJECTED');
                        setDetailModalOpen(false);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => {
                        handleUpdateStatus(selectedQuote.id, 'ACCEPTED');
                        setDetailModalOpen(false);
                      }}
                    >
                      Accept
                    </Button>
                  </>
                )}

                {selectedQuote.status === 'ACCEPTED' && !selectedQuote.salesOrder && (
                  <Button
                    variant="primary"
                    icon={ShoppingCart}
                    isLoading={convertingId === selectedQuote.id}
                    onClick={() => {
                      handleConvertToOrder(selectedQuote.id);
                      setDetailModalOpen(false);
                    }}
                  >
                    Convert to Sales Order
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-sm">
            {/* Proposal Customer & Ref Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Customer</span>
                <span className="font-bold text-slate-900 text-base block">{selectedQuote.customer?.companyName}</span>
                <span className="text-xs text-slate-600 block mt-0.5">Contact: {selectedQuote.customer?.contactPerson}</span>
                <span className="text-xs text-slate-500 block">{selectedQuote.customer?.city} • {selectedQuote.customer?.mobile}</span>
              </div>
              <div className="sm:text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Enquiry Reference</span>
                <span className="font-mono font-semibold text-slate-800 text-sm block">
                  {selectedQuote.enquiry?.enquiryNumber || 'Direct Quote'}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Created: {new Date(selectedQuote.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left">Product</th>
                      <th className="px-3.5 py-2.5 text-right">Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                      <th className="px-3.5 py-2.5 text-right">Discount</th>
                      <th className="px-3.5 py-2.5 text-right">GST</th>
                      <th className="px-3.5 py-2.5 text-right font-bold text-slate-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedQuote.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2.5 font-medium text-slate-900">
                          {item.product?.productName}
                          <span className="text-slate-400 text-[11px] block">{item.product?.productCode}</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600">
                          ₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600">
                          {Number(item.discountPercent) > 0 ? `${item.discountPercent}%` : '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600">
                          {item.gstPercent}%
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                          ₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {(
                      selectedQuote.items?.reduce(
                        (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice),
                        0
                      ) || 0
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Discount</span>
                  <span className="text-amber-700">
                    -₹
                    {(
                      selectedQuote.items?.reduce((sum, i) => {
                        const base = Number(i.quantity) * Number(i.unitPrice);
                        return sum + base * (Number(i.discountPercent) / 100);
                      }, 0) || 0
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total GST</span>
                  <span>
                    +₹
                    {(
                      selectedQuote.items?.reduce((sum, i) => {
                        const base = Number(i.quantity) * Number(i.unitPrice);
                        const afterDisc = base - base * (Number(i.discountPercent) / 100);
                        return sum + afterDisc * (Number(i.gstPercent) / 100);
                      }, 0) || 0
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-[#FF7A00]">
                    ₹{Number(selectedQuote.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Quotation Creation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Quotation"
        subtitle="Commercial proposal builder with item pricing, discount, and GST calculation"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <span className="text-xs text-slate-500 block">Quotation Total:</span>
              <span className="text-xl font-bold text-slate-900">
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
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          {/* Quotation Line Items */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Products & Pricing
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="text-[#FF7A00] hover:text-[#F05A00] text-xs font-semibold py-1 px-2"
              >
                + Add Product
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineCalc = preview.lines[idx] || {};
                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
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
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                          <span className="font-bold text-sm text-slate-900">
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
