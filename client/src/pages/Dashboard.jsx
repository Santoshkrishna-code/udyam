import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common';
import api from '../api/client';
import {
  FileSpreadsheet,
  FileCheck2,
  ShoppingCart,
  Boxes,
  ArrowRight,
  AlertTriangle,
  Clock,
  Plus,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function Dashboard({ setActivePage }) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    enquiries: 0,
    quotations: 0,
    ordersPending: 0,
    ordersConfirmed: 0,
    lowStockCount: 0,
    pipelineValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventorySnapshot, setInventorySnapshot] = useState([]);
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

        const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
        const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED').length;
        const lowStock = inventory.filter((i) => (i.availableQuantity ?? 0) <= 60);

        const pipeline = quotations
          .filter((q) => q.status === 'SENT' || q.status === 'ACCEPTED' || q.status === 'DRAFT')
          .reduce((sum, q) => sum + Number(q.totalAmount || 0), 0);

        setStats({
          enquiries: enquiries.length,
          quotations: quotations.length,
          ordersPending: pendingOrders,
          ordersConfirmed: confirmedOrders,
          lowStockCount: lowStock.length,
          pipelineValue: pipeline,
        });

        setRecentOrders(orders.slice(0, 5));
        setInventorySnapshot(inventory.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting and primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Here's what's happening across your operations today.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setActivePage('enquiries')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#FF7A00] hover:bg-[#F05A00] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Enquiry</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Open Enquiries, Active Quotes, Pending Orders, Low Stock) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Enquiries */}
        <div
          onClick={() => setActivePage('enquiries')}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-card hover:border-[#D1D5DB] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Open enquiries</span>
            <FileSpreadsheet className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#111827] tracking-tight">
              {stats.enquiries}
            </span>
            <p className="text-xs text-[#64748B] mt-1">
              Active customer leads
            </p>
          </div>
        </div>

        {/* Active Quotes */}
        <div
          onClick={() => setActivePage('quotations')}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-card hover:border-[#D1D5DB] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active quotations</span>
            <FileCheck2 className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-[#111827] tracking-tight">
              {stats.quotations}
            </span>
            <p className="text-xs text-[#64748B] mt-1">
              {formatCurrency(stats.pipelineValue)} commercial pipeline
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => setActivePage('sales-orders')}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-card hover:border-[#D1D5DB] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Pending orders</span>
            <ShoppingCart className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#111827] tracking-tight">
                {stats.ordersPending}
              </span>
              {stats.ordersPending > 0 && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Needs review
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Awaiting stock confirmation
            </p>
          </div>
        </div>

        {/* Low Stock (Primary Inventory KPI) */}
        <div
          onClick={() => setActivePage('inventory')}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-card hover:border-[#D1D5DB] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Low stock items</span>
            <Boxes className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#111827] tracking-tight">
                {stats.lowStockCount}
              </span>
              <span className="text-xs text-[#64748B]">products</span>
              {stats.lowStockCount > 0 && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-auto">
                  Alert
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Below reorder threshold
            </p>
          </div>
        </div>
      </div>

      {/* 3. ACTION REQUIRED SECTION */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7A00]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#374151]">
              Action Required
            </h2>
          </div>
          <span className="text-xs text-[#94A3B8]">Prioritized operational tasks</span>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {/* Action 1: Pending Orders */}
          <div
            onClick={() => setActivePage('sales-orders')}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827] group-hover:text-[#FF7A00] transition-colors">
                  {stats.ordersPending > 0
                    ? `${stats.ordersPending} Sales Orders awaiting stock reservation`
                    : 'All current sales orders are processed'}
                </p>
                <p className="text-xs text-[#64748B]">
                  {stats.ordersPending > 0
                    ? 'Review line item availability and commit inventory reservations'
                    : 'No pending orders requiring stock confirmation right now'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>

          {/* Action 2: Low Stock Warning */}
          <div
            onClick={() => setActivePage('inventory')}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827] group-hover:text-[#FF7A00] transition-colors">
                  {stats.lowStockCount > 0
                    ? `${stats.lowStockCount} products below reorder threshold`
                    : 'Inventory stock levels are healthy'}
                </p>
                <p className="text-xs text-[#64748B]">
                  Monitor physical vs reserved balances to prevent order fulfillment delays
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>

          {/* Action 3: Quotations */}
          <div
            onClick={() => setActivePage('quotations')}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827] group-hover:text-[#FF7A00] transition-colors">
                  {stats.quotations} commercial proposals in active pipeline
                </p>
                <p className="text-xs text-[#64748B]">
                  Follow up with customers on pending quotations to advance to sales order conversion
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#111827] transition-colors" />
          </div>
        </div>
      </div>

      {/* 4. Two-Column Grid: Recent Sales Orders (60%) + Inventory Snapshot (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Sales Orders (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Recent Sales Orders</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Orders tracked through fulfillment</p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('sales-orders')}
              className="text-xs font-semibold text-[#FF7A00] hover:text-[#F05A00] flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#F1F5F9] text-left text-xs">
              <thead className="bg-[#F8FAFC] font-semibold text-[#64748B]">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#94A3B8]">
                      Loading orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#94A3B8]">
                      No orders created yet. Convert an accepted quotation to start.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setActivePage('sales-orders')}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-[#111827]">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-[#374151] truncate max-w-[160px]">
                        {order.customer?.companyName || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Compact Inventory Snapshot (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] shadow-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#111827]">Inventory Snapshot</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Physical vs reserved balance</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('inventory')}
                className="text-xs font-semibold text-[#FF7A00] hover:text-[#F05A00] flex items-center gap-1 transition-colors"
              >
                <span>View inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#F1F5F9] text-left text-xs">
                <thead className="bg-[#F8FAFC] font-semibold text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-3 py-3 text-right">Physical</th>
                    <th className="px-3 py-3 text-right">Reserved</th>
                    <th className="px-4 py-3 text-right">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#94A3B8]">
                        Loading stock...
                      </td>
                    </tr>
                  ) : inventorySnapshot.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#94A3B8]">
                        No inventory data found.
                      </td>
                    </tr>
                  ) : (
                    inventorySnapshot.map((item) => {
                      const isLow = (item.availableQuantity ?? 0) <= 60;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setActivePage('inventory')}
                          className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-[#111827] font-medium truncate max-w-[140px]">
                            {item.productName}
                          </td>
                          <td className="px-3 py-3 text-right text-[#64748B]">
                            {item.physicalQuantity}
                          </td>
                          <td className="px-3 py-3 text-right text-amber-700 font-medium">
                            {item.reservedQuantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-bold inline-flex items-center gap-1 ${
                                isLow ? 'text-amber-600' : 'text-[#111827]'
                              }`}
                            >
                              {item.availableQuantity}
                              {isLow && <span title="Low stock alert" className="text-amber-500">⚠</span>}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Formula: Available = Physical − Reserved</span>
            <span className="font-semibold text-emerald-600">Real-time sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
