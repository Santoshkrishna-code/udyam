import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, Button, StatusBadge, Table } from '../components/common';
import api from '../api/client';
import {
  FileSpreadsheet,
  FileCheck2,
  ShoppingCart,
  Boxes,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Truck,
} from 'lucide-react';

export default function Dashboard({ setActivePage }) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    enquiries: 0,
    quotations: 0,
    ordersPending: 0,
    ordersConfirmed: 0,
    lowStock: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [enqRes, qtnRes, orderRes, invRes] = await Promise.all([
          api.get('/enquiries').catch(() => ({ data: [] })),
          api.get('/quotations').catch(() => ({ data: [] })),
          api.get('/sales-orders').catch(() => ({ data: [] })),
          api.get('/inventory').catch(() => ({ data: [] })),
        ]);

        const enquiries = enqRes.data || [];
        const quotations = qtnRes.data || [];
        const orders = orderRes.data || [];
        const inventory = invRes.data || [];

        const pending = orders.filter((o) => o.status === 'PENDING').length;
        const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
        const low = inventory.filter((i) => i.availableQuantity <= 50).length;

        setStats({
          enquiries: enquiries.length,
          quotations: quotations.length,
          ordersPending: pending,
          ordersConfirmed: confirmed,
          lowStock: low,
        });

        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const orderColumns = [
    {
      header: 'Order #',
      key: 'orderNumber',
      render: (val) => <span className="font-mono font-bold text-slate-900">{val}</span>,
    },
    {
      header: 'Customer',
      key: 'customer',
      render: (cust) => cust?.companyName || '—',
    },
    {
      header: 'Amount',
      key: 'totalAmount',
      render: (val) => `₹${Number(val).toLocaleString('en-IN')}`,
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <StatusBadge status={user?.role} className="bg-white/10 text-white border-white/20" />
            </div>
            <p className="text-sky-200 text-sm mt-1">
              {isAdmin
                ? 'Admin Control: Manage inventory, confirm sales orders, and process dispatches.'
                : 'Sales Dashboard: Create customer enquiries, draft quotations, and convert won deals.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActivePage('enquiries')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-none"
            >
              + New Enquiry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActivePage('quotations')}
              className="bg-sky-500 hover:bg-sky-400 text-white border-none shadow-md"
            >
              View Quotations
            </Button>
          </div>
        </div>

        {/* Operational Workflow Progress Line */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300 mb-3">
            Core ERP Operations Lifecycle
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <span className="font-semibold block text-white">1. Customer Enquiry</span>
              <span className="text-[10px] text-sky-200">Requirements</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <span className="font-semibold block text-white">2. Quotation Engine</span>
              <span className="text-[10px] text-sky-200">Discount & GST</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <span className="font-semibold block text-white">3. Sales Order</span>
              <span className="text-[10px] text-sky-200">Status: Pending</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <span className="font-semibold block text-white">4. Stock Reservation</span>
              <span className="text-[10px] text-sky-200">Atomic Row Lock</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <span className="font-semibold block text-white">5. Product Dispatch</span>
              <span className="text-[10px] text-sky-200">Physical Reduced</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Enquiries"
          value={stats.enquiries}
          icon={FileSpreadsheet}
          color="sky"
          subtext="Active customer leads"
          onClick={() => setActivePage('enquiries')}
        />
        <StatCard
          label="Quotations"
          value={stats.quotations}
          icon={FileCheck2}
          color="amber"
          subtext="Drafted or accepted"
          onClick={() => setActivePage('quotations')}
        />
        <StatCard
          label="Orders Awaiting Confirmation"
          value={stats.ordersPending}
          icon={Clock}
          color="purple"
          subtext="Needs Admin reservation"
          onClick={() => setActivePage('sales-orders')}
        />
        <StatCard
          label="Confirmed Ready to Dispatch"
          value={stats.ordersConfirmed}
          icon={Truck}
          color="emerald"
          subtext="Stock safely reserved"
          onClick={() => setActivePage('sales-orders')}
        />
      </div>

      {/* Recent Orders Overview */}
      <Card
        title="Recent Sales Orders"
        subtitle="Live tracking of orders, reservations, and dispatch status"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePage('sales-orders')}
            className="text-sky-600 hover:text-sky-700"
          >
            View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        }
        noPadding
      >
        <Table
          columns={orderColumns}
          data={recentOrders}
          emptyMessage="No sales orders created yet. Convert an accepted quotation to get started!"
          isLoading={loading}
          onRowClick={() => setActivePage('sales-orders')}
        />
      </Card>
    </div>
  );
}
