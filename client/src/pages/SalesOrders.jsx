import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Button,
  Input,
  Modal,
  Card,
  StatusBadge,
  Table,
  Alert,
} from '../components/common';
import {
  CheckCircle2,
  Truck,
  Eye,
  Boxes,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Search,
  ArrowRight,
  PackageCheck,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function SalesOrders({ setActivePage }) {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Tab & Search filters
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatching, setDispatching] = useState(false);

  // Confirming state
  const [confirmingId, setConfirmingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-orders');
      setOrders(res.data || []);
      if (selectedOrder) {
        const refreshed = (res.data || []).find((o) => o.id === selectedOrder.id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenDetails = async (order) => {
    try {
      const res = await api.get(`/sales-orders/${order.id}`);
      setSelectedOrder(res.data);
      setDetailModalOpen(true);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleConfirmOrder = async (orderId) => {
    setAlert(null);
    setConfirmingId(orderId);
    try {
      const res = await api.post(`/sales-orders/${orderId}/confirm`);
      setAlert({
        type: 'success',
        message: `Order ${res.data?.orderNumber} confirmed. Stock reserved successfully.`,
      });
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        // Refresh detail modal
        const refreshed = await api.get(`/sales-orders/${orderId}`);
        setSelectedOrder(refreshed.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Unable to confirm order due to insufficient inventory.',
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleOpenDispatchModal = (order) => {
    setDispatchOrder(order);
    setVehicleNumber('');
    setDriverName('');
    setDispatchDate(new Date().toISOString().split('T')[0]);
    setDispatchModalOpen(true);
  };

  const handleProcessDispatch = async (e) => {
    e.preventDefault();
    if (!vehicleNumber || !driverName) {
      setAlert({ type: 'error', message: 'Vehicle number and driver name are required' });
      return;
    }

    setDispatching(true);
    setAlert(null);
    try {
      const res = await api.post(`/sales-orders/${dispatchOrder.id}/dispatch`, {
        vehicleNumber,
        driverName,
      });
      setAlert({
        type: 'success',
        message: `Order dispatched successfully with Dispatch #${res.data?.dispatchNumber}. Physical inventory updated.`,
      });
      setDispatchModalOpen(false);
      setDetailModalOpen(false);
      loadOrders();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setDispatching(false);
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      DISPATCHED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchTab = activeTab === 'ALL' || o.status === activeTab;
      const oNum = (o.orderNumber || '').toLowerCase();
      const cName = (o.customer?.companyName || '').toLowerCase();
      const matchSearch =
        !searchTerm ||
        oNum.includes(searchTerm.toLowerCase()) ||
        cName.includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [orders, activeTab, searchTerm]);

  // Stock feasibility analysis for selected order
  const stockAnalysis = useMemo(() => {
    if (!selectedOrder?.items) return { canConfirm: false, shortages: [] };
    const shortages = [];
    selectedOrder.items.forEach((item) => {
      const avail = item.stockInfo?.availableQuantity ?? 0;
      if (avail < item.quantity) {
        shortages.push({
          productName: item.product?.productName || item.product?.productCode,
          required: item.quantity,
          available: avail,
        });
      }
    });
    return {
      canConfirm: shortages.length === 0,
      shortages,
    };
  }, [selectedOrder]);

  const columns = [
    {
      header: 'Order',
      key: 'orderNumber',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => handleOpenDetails(row)}
          className="text-left font-semibold text-[#111827] hover:text-[#FF7A00] transition-colors"
        >
          {val}
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
      header: 'Order Date',
      key: 'orderDate',
      render: (val) => (
        <span className="text-xs text-slate-600">
          {val ? new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Items',
      key: 'items',
      render: (items) => (
        <span className="text-xs text-slate-600 font-medium">
          {items?.length || 0} {items?.length === 1 ? 'product' : 'products'}
        </span>
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
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => handleOpenDetails(row)}
            className="text-slate-600 hover:text-slate-900"
          >
            Details
          </Button>

          {/* Confirm Button for PENDING orders (Admin only) */}
          {row.status === 'PENDING' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              isLoading={confirmingId === row.id}
              onClick={() => handleConfirmOrder(row.id)}
              disabled={!isAdmin}
              title={!isAdmin ? 'Order confirmation requires Administrator permissions' : 'Reserve stock'}
              className={!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Confirm
            </Button>
          )}

          {/* Dispatch Button for CONFIRMED orders (Admin only) */}
          {row.status === 'CONFIRMED' && (
            <Button
              variant="success"
              size="sm"
              icon={Truck}
              onClick={() => handleOpenDispatchModal(row)}
              disabled={!isAdmin}
              title={!isAdmin ? 'Dispatch requires Administrator permissions' : 'Process dispatch'}
              className={!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Dispatch
            </Button>
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track order confirmation, stock reservation and dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {setActivePage && (
            <Button
              variant="outline"
              icon={Boxes}
              onClick={() => setActivePage('inventory')}
            >
              View Inventory
            </Button>
          )}
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'CONFIRMED', label: 'Confirmed' },
            { key: 'DISPATCHED', label: 'Dispatched' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[#0B1220] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tabCounts[tab.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card noPadding>
        <Table
          columns={columns}
          data={filteredOrders}
          emptyMessage="No sales orders found matching this filter."
          isLoading={loading}
        />
      </Card>

      {/* Sales Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Order: ${selectedOrder.orderNumber}`}
          subtitle={`${selectedOrder.customer?.companyName} • Total: ₹${Number(selectedOrder.totalAmount).toLocaleString('en-IN')}`}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <StatusBadge status={selectedOrder.status} />

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>

                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    icon={CheckCircle2}
                    isLoading={confirmingId === selectedOrder.id}
                    onClick={() => handleConfirmOrder(selectedOrder.id)}
                    disabled={!isAdmin || !stockAnalysis.canConfirm}
                    title={
                      !isAdmin
                        ? 'Administrator permissions required'
                        : !stockAnalysis.canConfirm
                        ? 'Insufficient inventory available'
                        : 'Confirm order and reserve inventory'
                    }
                  >
                    Confirm & Reserve Stock
                  </Button>
                )}

                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    variant="success"
                    icon={Truck}
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenDispatchModal(selectedOrder);
                    }}
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Administrator permissions required' : ''}
                  >
                    Process Dispatch
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-sm">
            {/* Order Metadata */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Customer</span>
                <span className="font-bold text-slate-900 text-base block">{selectedOrder.customer?.companyName}</span>
                <span className="text-xs text-slate-600 block mt-0.5">Contact: {selectedOrder.customer?.contactPerson}</span>
                <span className="text-xs text-slate-500 block">{selectedOrder.customer?.city}</span>
              </div>
              <div className="sm:text-right space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Order Details</span>
                <span className="text-xs text-slate-600 block">
                  Quotation: <strong className="text-slate-800">{selectedOrder.quotation?.quotationNumber || '—'}</strong>
                </span>
                <span className="text-xs text-slate-600 block">
                  Order Date: {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Order Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left">Product</th>
                      <th className="px-3.5 py-2.5 text-right">Required</th>
                      <th className="px-3.5 py-2.5 text-right">Available Stock</th>
                      <th className="px-3.5 py-2.5 text-center">Feasibility</th>
                      <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                      <th className="px-3.5 py-2.5 text-right font-bold text-slate-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedOrder.items?.map((item) => {
                      const avail = item.stockInfo?.availableQuantity ?? 0;
                      const sufficient = avail >= item.quantity;
                      const isConfirmedOrDispatched =
                        selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'DISPATCHED';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            {item.product?.productName}
                            <span className="text-slate-400 text-[11px] block">{item.product?.productCode}</span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-slate-700">
                            {isConfirmedOrDispatched ? (
                              <span className="text-emerald-700">Reserved ({item.quantity})</span>
                            ) : (
                              <span>{avail}</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            {isConfirmedOrDispatched ? (
                              <span className="text-emerald-700 text-xs font-semibold">✓ Reserved</span>
                            ) : sufficient ? (
                              <span className="text-emerald-700 text-xs font-semibold">✓ Available</span>
                            ) : (
                              <span className="text-rose-600 text-xs font-semibold">⚠ Shortage ({item.quantity - avail})</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-600">
                            ₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                            ₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Check Section (Spec Section 18 & 19) */}
            {selectedOrder.status === 'PENDING' && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-3 ${
                  stockAnalysis.canConfirm
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {stockAnalysis.canConfirm ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Inventory check passed</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Cannot confirm order</span>
                    </>
                  )}
                </div>

                {stockAnalysis.canConfirm ? (
                  <div className="space-y-2">
                    <p className="text-emerald-900">
                      All required products have sufficient available stock. Confirming this order will reserve:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-emerald-800 font-medium">
                      {selectedOrder.items?.map((i) => (
                        <li key={i.id}>
                          {i.quantity} units of {i.product?.productName}
                        </li>
                      ))}
                    </ul>
                    <p className="text-slate-600 pt-1 text-[11px]">
                      Physical inventory will remain in stock until the order is dispatched.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {stockAnalysis.shortages.map((s, idx) => (
                      <p key={idx} className="text-rose-900 font-medium">
                        • {s.productName} requires <strong>{s.required}</strong> units, but only <strong>{s.available}</strong> are currently available.
                      </p>
                    ))}
                    <p className="text-rose-700 text-[11px] pt-1">
                      Adjust physical inventory or wait for pending dispatches to free reserved stock.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Dispatch Record If Completed */}
            {selectedOrder.dispatches && selectedOrder.dispatches.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Dispatch Information</h4>
                <div className="space-y-2">
                  {selectedOrder.dispatches.map((dsp) => (
                    <div
                      key={dsp.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          Dispatch Reference: {dsp.dispatchNumber}
                        </span>
                        <span className="text-slate-500">
                          Vehicle: <strong className="text-slate-700">{dsp.vehicleNumber}</strong> • Driver: {dsp.driverName}
                        </span>
                      </div>
                      <span className="text-slate-500 text-xs">
                        {new Date(dsp.dispatchDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Dispatch Modal (Spec Section 20) */}
      {dispatchOrder && (
        <Modal
          isOpen={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          title={`Process Dispatch: ${dispatchOrder.orderNumber}`}
          subtitle={`Customer: ${dispatchOrder.customer?.companyName}`}
          maxWidth="max-w-lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDispatchModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="success"
                icon={Truck}
                onClick={handleProcessDispatch}
                isLoading={dispatching}
              >
                Confirm Dispatch
              </Button>
            </>
          }
        >
          <form onSubmit={handleProcessDispatch} className="space-y-4 text-xs">
            {/* Reserved Stock Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                Reserved Stock to be Dispatched
              </span>
              <div className="space-y-1">
                {dispatchOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-700">
                    <span>{item.product?.productName}</span>
                    <span className="font-bold text-slate-900">{item.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Notice:</strong> Dispatching this order will deduct physical inventory and release reserved inventory. This action cannot be undone.
            </div>

            {/* Form Fields */}
            <div className="space-y-3 pt-1">
              <Input
                label="Vehicle Registration Number"
                placeholder="e.g. KA 01 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />

              <Input
                label="Driver Name & Contact"
                placeholder="e.g. Ravi Kumar"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
              />

              <Input
                label="Dispatch Date"
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
