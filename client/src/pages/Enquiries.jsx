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
import { Plus, Trash2, ArrowRight, Search, Filter } from 'lucide-react';

export default function Enquiries({ setActivePage, onSelectEnquiryForQuote }) {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form state for new enquiry
  const [customerId, setCustomerId] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [enqRes, custRes, prodRes] = await Promise.all([
        api.get('/enquiries'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setEnquiries(enqRes.data || []);
      setCustomers(custRes.data || []);
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

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!customerId) {
      setAlert({ type: 'error', message: 'Please select a customer' });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId || items[i].quantity <= 0) {
        setAlert({ type: 'error', message: `Row ${i + 1}: Select a valid product and positive quantity` });
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post('/enquiries', {
        customerId,
        requiredDate: requiredDate || null,
        notes,
        items,
      });
      setAlert({ type: 'success', message: 'Enquiry created successfully' });
      setModalOpen(false);
      setCustomerId('');
      setRequiredDate('');
      setNotes('');
      setItems([{ productId: '', quantity: 1 }]);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      !searchQuery ||
      enq.enquiryNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.customer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || enq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      header: 'Enquiry #',
      key: 'enquiryNumber',
      render: (val) => <span className="font-mono font-bold text-[#111827]">{val}</span>,
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (cust) => (
        <div>
          <span className="font-semibold text-[#111827] block">{cust?.companyName}</span>
          <span className="text-xs text-[#64748B]">{cust?.city}</span>
        </div>
      ),
    },
    {
      header: 'Required Products',
      key: 'items',
      render: (itemList) => (
        <span className="text-xs text-[#374151] font-medium">
          {itemList?.length || 0} product{itemList?.length === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      header: 'Date',
      key: 'enquiryDate',
      render: (val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Action',
      key: 'actions',
      render: (_, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectEnquiryForQuote) {
              onSelectEnquiryForQuote(row);
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF7A00] hover:text-[#F05A00] px-2.5 py-1.5 rounded border border-[#FF7A00]/30 hover:border-[#FF7A00] bg-white transition-colors"
        >
          <span>Create Quote</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111827] tracking-tight">Enquiries</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage customer requirements and convert opportunities into quotations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#FF7A00] hover:bg-[#F05A00] shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Enquiry</span>
        </button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by enquiry # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#E2E8F0] pl-9 pr-3 py-2 text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-[#E2E8F0] px-3 py-2 text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="QUOTED">Quoted</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={filteredEnquiries}
          emptyMessage="No customer enquiries found matching criteria."
          isLoading={loading}
        />
      </Card>

      {/* Multi-Section New Enquiry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Customer Enquiry"
        subtitle="Record structured customer requirements for commercial evaluation"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleCreateEnquiry}
              disabled={submitting}
              className="inline-flex items-center justify-center font-semibold rounded-lg text-sm px-4 py-2 text-white bg-[#FF7A00] hover:bg-[#F05A00] shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Enquiry'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateEnquiry} className="space-y-6">
          {/* Section 1: Customer */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#374151] pb-2 border-b border-[#E5E7EB] mb-3">
              Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Select
                  label="Select Customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.companyName} (${c.city})`,
                  }))}
                />
              </div>

              {selectedCustomer && (
                <>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs">
                    <span className="text-[#64748B] block">Contact Person</span>
                    <span className="font-semibold text-[#111827] mt-0.5 block">{selectedCustomer.contactPerson || '—'}</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs">
                    <span className="text-[#64748B] block">Contact Details</span>
                    <span className="font-semibold text-[#111827] mt-0.5 block">{selectedCustomer.phone || selectedCustomer.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Product Requirements */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                Product Requirements
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#F05A00] transition-colors"
              >
                + Add Product
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl"
                >
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      required
                      className="w-full text-xs rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-[#111827] focus:ring-2 focus:ring-[#FF7A00] focus:outline-none"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productCode} — {p.productName} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                      className="w-full text-xs rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-right font-medium text-[#111827] focus:ring-2 focus:ring-[#FF7A00] focus:outline-none"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-[#94A3B8] hover:text-rose-600 rounded transition-colors"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Delivery Requirements & Notes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#374151] pb-2 border-b border-[#E5E7EB] mb-3">
              Fulfillment Target
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Required By Date"
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
              />

              <Input
                label="Operational Notes / Specs"
                placeholder="e.g. Standard industrial packaging required"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
