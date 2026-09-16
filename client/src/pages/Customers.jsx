import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Button,
  Input,
  Modal,
  Card,
  Table,
  Alert,
} from '../components/common';
import { Plus, Users, Building, Phone, Mail, MapPin } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

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
      setAlert({ type: 'success', message: 'Customer account created successfully!' });
      setModalOpen(false);
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

  const columns = [
    {
      header: 'Company Name',
      key: 'companyName',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{val}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" /> {row.city}
          </span>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      key: 'contactPerson',
      render: (val) => <span className="font-medium text-slate-800">{val}</span>,
    },
    {
      header: 'Mobile',
      key: 'mobile',
      render: (val) => (
        <span className="font-mono text-xs text-slate-600 flex items-center gap-1">
          <Phone className="w-3 h-3 text-slate-400" /> {val}
        </span>
      ),
    },
    {
      header: 'Email',
      key: 'email',
      render: (val) => (
        <span className="text-xs text-sky-700 flex items-center gap-1">
          <Mail className="w-3 h-3 text-slate-400" /> {val}
        </span>
      ),
    },
    {
      header: 'Activity',
      key: '_count',
      align: 'center',
      render: (counts) => (
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-medium" title="Enquiries">
            {counts?.enquiries || 0} Enq
          </span>
          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium" title="Quotations">
            {counts?.quotations || 0} Quotes
          </span>
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium" title="Sales Orders">
            {counts?.salesOrders || 0} Orders
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Master</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer directories, contact persons, and operational history.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          New Customer
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Customer Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={customers}
          emptyMessage="No customer accounts registered. Click '+ New Customer' above!"
          isLoading={loading}
        />
      </Card>

      {/* New Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Customer Account"
        subtitle="Provide company details and key contact credentials"
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
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
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="e.g. Acme Industrial Solutions Pvt Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              placeholder="e.g. Ramesh Chandra"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
            />

            <Input
              label="City"
              placeholder="e.g. Mumbai"
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
              placeholder="e.g. contact@acme.com"
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
