import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import {
  Button,
  Input,
  Modal,
  Card,
  Table,
  Alert,
  StatusBadge,
} from '../components/common';
import {
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  Boxes,
} from 'lucide-react';

export default function Customers({ setActivePage }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenTraceability = async (customer) => {
    setSelectedCustomer(customer);
    setTraceModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/customers/${customer.id}`);
      setCustomerDetails(res.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!companyName || !contactPerson || !mobile || !email || !city) {
      setAlert({ type: 'error', message: 'All customer fields are required' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/customers', {
        companyName,
        contactPerson,
        mobile,
        email,
        city,
      });
      setAlert({ type: 'success', message: 'Customer account created successfully' });
      setCreateModalOpen(false);
      setCompanyName('');
      setContactPerson('');
      setMobile('');
      setEmail('');
      setCity('');
      loadCustomers();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        !term ||
        (c.companyName || '').toLowerCase().includes(term) ||
        (c.contactPerson || '').toLowerCase().includes(term) ||
        (c.city || '').toLowerCase().includes(term)
      );
    });
  }, [customers, searchTerm]);

  const columns = [
    {
      header: 'Company',
      key: 'companyName',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => handleOpenTraceability(row)}
          className="text-left group flex items-start gap-2"
        >
          <div>
            <span className="font-semibold text-slate-900 group-hover:text-[#FF7A00] transition-colors block">
              {val}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" /> {row.city}
            </span>
          </div>
        </button>
      ),
    },
    {
      header: 'Contact',
      key: 'contactPerson',
      render: (val, row) => (
        <div>
          <span className="font-medium text-slate-800 block text-xs">{val}</span>
          <span className="text-slate-500 text-[11px] block">{row.mobile}</span>
        </div>
      ),
    },
    {
      header: 'City',
      key: 'city',
      render: (val) => <span className="text-xs text-slate-700">{val}</span>,
    },
    {
      header: 'Orders',
      key: '_count',
      align: 'right',
      render: (counts) => (
        <span className="font-bold text-slate-900 text-sm">
          {counts?.salesOrders ?? 0}
        </span>
      ),
    },
    {
      header: 'Pipeline Activity',
      key: '_count_pipeline',
      render: (_, row) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
            {row._count?.enquiries || 0} Enq
          </span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
            {row._count?.quotations || 0} Quotes
          </span>
        </div>
      ),
    },
    {
      header: 'Traceability',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenTraceability(row)}
          className="text-slate-600 hover:text-slate-900"
        >
          View Flow
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Directory of industrial clients, key contacts, and transaction history.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers by company, contact person, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Customer Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={filteredCustomers}
          emptyMessage="No customers found matching search criteria."
          isLoading={loading}
        />
      </Card>

      {/* Customer Traceability Modal (Spec Section 23: Customer -> Enquiries -> Quotations -> Sales Orders) */}
      {selectedCustomer && (
        <Modal
          isOpen={traceModalOpen}
          onClose={() => setTraceModalOpen(false)}
          title={`Customer: ${selectedCustomer.companyName}`}
          subtitle={`Complete lifecycle traceability: Enquiries → Quotations → Sales Orders`}
          maxWidth="max-w-3xl"
          footer={
            <Button variant="secondary" onClick={() => setTraceModalOpen(false)}>
              Close
            </Button>
          }
        >
          {loadingDetails ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading customer history...</div>
          ) : (
            <div className="space-y-6 text-sm">
              {/* Contact Profile Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Company Info</span>
                  <span className="font-bold text-slate-900 text-base block">{selectedCustomer.companyName}</span>
                  <span className="text-xs text-slate-600 block mt-0.5">Contact: {selectedCustomer.contactPerson}</span>
                  <span className="text-xs text-slate-500 block">{selectedCustomer.city}</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 sm:text-right">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Communication</span>
                  <span className="block">{selectedCustomer.mobile}</span>
                  <span className="block text-[#FF7A00]">{selectedCustomer.email}</span>
                </div>
              </div>

              {/* Lifecycle Trace: Enquiries -> Quotations -> Orders */}
              <div className="space-y-5">
                {/* 1. Enquiries */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Customer Enquiries ({customerDetails?.enquiries?.length || 0})
                    </h4>
                  </div>
                  {customerDetails?.enquiries?.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Enquiry #</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {customerDetails.enquiries.map((enq) => (
                            <tr key={enq.id}>
                              <td className="px-3 py-2 font-mono font-semibold text-slate-900">{enq.enquiryNumber}</td>
                              <td className="px-3 py-2 text-slate-500">
                                {new Date(enq.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <StatusBadge status={enq.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      No customer enquiries logged.
                    </p>
                  )}
                </div>

                {/* 2. Quotations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Commercial Quotations ({customerDetails?.quotations?.length || 0})
                    </h4>
                  </div>
                  {customerDetails?.quotations?.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Quotation #</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {customerDetails.quotations.map((q) => (
                            <tr key={q.id}>
                              <td className="px-3 py-2 font-mono font-semibold text-slate-900">{q.quotationNumber}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">
                                ₹{Number(q.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <StatusBadge status={q.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      No commercial quotations generated yet.
                    </p>
                  )}
                </div>

                {/* 3. Sales Orders */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Sales Orders & Dispatches ({customerDetails?.salesOrders?.length || 0})
                    </h4>
                  </div>
                  {customerDetails?.salesOrders?.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Order #</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {customerDetails.salesOrders.map((so) => (
                            <tr key={so.id}>
                              <td className="px-3 py-2 font-mono font-semibold text-slate-900">{so.orderNumber}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-900">
                                ₹{Number(so.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <StatusBadge status={so.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      No sales orders created yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Customer"
        subtitle="Provide company details and primary operational contact"
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCustomer}
              isLoading={submitting}
            >
              Save Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-sm">
          <Input
            label="Company Name"
            placeholder="e.g. Apex Heavy Engineering Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              placeholder="e.g. Ravi Kumar"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
            />

            <Input
              label="City"
              placeholder="e.g. Bengaluru"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mobile Number"
              placeholder="e.g. +91 98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. contact@apexengineering.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
