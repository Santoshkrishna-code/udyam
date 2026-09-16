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
import { Plus, Trash2, FileSpreadsheet, ArrowRight } from 'lucide-react';

export default function Enquiries({ setActivePage, onSelectEnquiryForQuote }) {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

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

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!customerId) {
      setAlert({ type: 'error', message: 'Please select a customer' });
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId || items[i].quantity <= 0) {
        setAlert({ type: 'error', message: `Row ${i + 1}: Select a product and quantity > 0` });
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
      setAlert({ type: 'success', message: 'Enquiry created successfully!' });
      setModalOpen(false);
      // Reset form
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

  const columns = [
    {
      header: 'Enquiry #',
      key: 'enquiryNumber',
      render: (val) => <span className="font-mono font-bold text-sky-700">{val}</span>,
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
      header: 'Date',
      key: 'enquiryDate',
      render: (val) => new Date(val).toLocaleDateString('en-IN'),
    },
    {
      header: 'Items',
      key: 'items',
      render: (itemList) => (
        <div className="text-xs text-slate-600">
          <span className="font-semibold">{itemList?.length || 0} product(s)</span>
          <p className="text-[11px] text-slate-400 truncate max-w-xs">
            {itemList?.map((i) => `${i.product?.productName} (${i.quantity})`).join(', ')}
          </p>
        </div>
      ),
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
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectEnquiryForQuote) {
              onSelectEnquiryForQuote(row);
            }
          }}
        >
          Create Quote <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Enquiries</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture requirement requests and initiate the quotation pipeline.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          New Enquiry
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Enquiries Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={enquiries}
          emptyMessage="No customer enquiries recorded yet. Click '+ New Enquiry' above!"
          isLoading={loading}
        />
      </Card>

      {/* New Enquiry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Customer Enquiry"
        subtitle="Specify the customer, target requirements, and requested products"
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateEnquiry}
              isLoading={submitting}
            >
              Save Enquiry
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEnquiry} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Input
              label="Required By Date"
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
            />
          </div>

          <Input
            label="Requirement Notes / Specs"
            placeholder="e.g. Urgent requirement for plant overhaul"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Dynamic Products List */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Products & Quantities
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="text-sky-600 hover:text-sky-700 text-xs font-semibold py-1 px-2"
              >
                + Add Product
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80"
                >
                  <div className="flex-1">
                    <Select
                      placeholder="Select Product"
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      required
                      options={products.map((p) => ({
                        value: p.id,
                        label: `${p.productCode} — ${p.productName} (Base: ₹${p.basePrice})`,
                      }))}
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
