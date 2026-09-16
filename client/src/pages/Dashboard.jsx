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
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-slate-850 relative overflow-hidden">
        {/* Subtle warm orange brand glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white to-slate-100 p-2 shadow-lg shadow-orange-500/10 border border-white/20 shrink-0">
              <img
                src="/logo-icon-transparent.png"
                alt="Udyam"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome back, {user?.name}
                </h1>
                <StatusBadge status={user?.role} />
              </div>
              <p className="text-slate-300 text-sm mt-1">
                {isAdmin
                  ? 'Admin Control: Manage inventory, confirm sales orders, and process dispatches.'
                  : 'Sales Dashboard: Create customer enquiries, draft quotations, and convert won deals.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActivePage('enquiries')}
              className="bg-gradient-to-r from-orange-500 to-amber-600 shadow-brand hover:shadow-brand-lg border-0 font-semibold"
            >
              + New Enquiry
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActivePage('quotations')}
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 shadow-none font-semibold"
            >
              View Quotations
            </Button>
          </div>
        </div>

        {/* Operational Workflow Progress Line */}
        <div className="relative z-10 mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
            Core Operations Lifecycle
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-orange-500/40 transition-colors">
              <span className="font-bold block text-white">1. Customer Enquiry</span>
              <span className="text-[10px] text-slate-400">Multi-item requirements</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-orange-500/40 transition-colors">
              <span className="font-bold block text-white">2. Quotation Engine</span>
              <span className="text-[10px] text-slate-400">Discount & GST math</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-orange-500/40 transition-colors">
              <span className="font-bold block text-white">3. Sales Order</span>
              <span className="text-[10px] text-slate-400">Status: Pending</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-orange-500/40 transition-colors">
              <span className="font-bold block text-white">4. Stock Reservation</span>
              <span className="text-[10px] text-orange-300 font-medium">Atomic Row Lock</span>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 hover:border-orange-500/40 transition-colors">
              <span className="font-bold block text-white">5. Product Dispatch</span>
              <span className="text-[10px] text-emerald-400 font-medium">Physical Stock Reduced</span>
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
          color="orange"
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
            className="text-orange-600 hover:text-orange-700 font-semibold"
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
