import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  CheckCircle2,
  Truck,
  Eye,
  Boxes,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function SalesOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Confirming state
  const [confirmingId, setConfirmingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-orders');
      setOrders(res.data || []);
      // If modal is open, refresh selected order details
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
        message: `Order ${res.data?.orderNumber} confirmed! Inventory atomically reserved.`,
      });
      loadOrders();
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Confirmation & Reservation Failed',
        message: err.message || 'Insufficient inventory to reserve order',
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const handleOpenDispatchModal = (order) => {
    setDispatchOrder(order);
    setVehicleNumber('');
    setDriverName('');
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
        message: `Order dispatched successfully with Dispatch #${res.data?.dispatchNumber}! Physical inventory decreased.`,
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

  const columns = [
    {
      header: 'Order #',
      key: 'orderNumber',
      render: (val) => <span className="font-mono font-bold text-orange-700">{val}</span>,
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
        <span className="font-extrabold text-slate-900">
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
      header: 'Inventory State',
      key: 'items',
      render: (items, row) => {
        const allSufficient = items?.every((i) => i.stockInfo?.isSufficient);
        if (row.status === 'CONFIRMED') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Stock Reserved
            </span>
          );
        }
        if (row.status === 'DISPATCHED') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              <Truck className="w-3.5 h-3.5" /> Dispatched
            </span>
          );
        }
        return allSufficient ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded">
            ✓ Ready to Reserve
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Stock Shortage
          </span>
        );
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => handleOpenDetails(row)}
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
              title={!isAdmin ? 'Order confirmation requires ADMIN role' : 'Atomically reserve stock'}
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
              title={!isAdmin ? 'Dispatch requires ADMIN role' : 'Process shipment'}
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed orders atomically reserve stock. Dispatches deduct physical inventory.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sales User Mode: Confirmation & Dispatch require Admin role.</span>
          </div>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Orders Table */}
      <Card noPadding>
        <Table
          columns={columns}
          data={orders}
          emptyMessage="No sales orders created yet. Convert an accepted quotation to generate one!"
          isLoading={loading}
        />
      </Card>

      {/* Order Details & Stock Inspection Modal */}
      {selectedOrder && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Order Details: ${selectedOrder.orderNumber}`}
          subtitle={`Customer: ${selectedOrder.customer?.companyName} | Total: ₹${Number(selectedOrder.totalAmount).toLocaleString('en-IN')}`}
          maxWidth="max-w-4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} />
              </div>
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
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Admin role required' : ''}
                  >
                    Confirm & Reserve Stock
                  </Button>
                )}

                {selectedOrder.status === 'CONFIRMED' && (
                  <Button
                    variant="success"
                    icon={Truck}
                    onClick={() => handleOpenDispatchModal(selectedOrder)}
                    disabled={!isAdmin}
                    title={!isAdmin ? 'Admin role required' : ''}
                  >
                    Process Dispatch
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Order Items with Live Availability Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-orange-600" />
                Line Items & Inventory Reservation Status
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left">Product</th>
                      <th className="px-3.5 py-2.5 text-right">Required</th>
                      <th className="px-3.5 py-2.5 text-right">Physical Stock</th>
                      <th className="px-3.5 py-2.5 text-right">Reserved Stock</th>
                      <th className="px-3.5 py-2.5 text-right font-bold text-orange-800">Available Stock</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedOrder.items?.map((item) => {
                      const stock = item.stockInfo || {};
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">
                            {item.product?.productCode} — {item.product?.productName}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-600">
                            {stock.physicalQuantity ?? '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-amber-700 font-medium">
                            {stock.reservedQuantity ?? '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-extrabold text-orange-700 bg-orange-50/40">
                            {stock.availableQuantity ?? '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            {selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'DISPATCHED' ? (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                Reserved
                              </span>
                            ) : stock.isSufficient ? (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                ✓ Available
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                ❌ Shortage
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dispatches History */}
            {selectedOrder.dispatches && selectedOrder.dispatches.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  Dispatch History
                </h4>
                <div className="space-y-2">
                  {selectedOrder.dispatches.map((dsp) => (
                    <div
                      key={dsp.id}
                      className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-purple-900 block">
                          {dsp.dispatchNumber}
                        </span>
                        <span className="text-slate-500">
                          Vehicle: <strong className="text-slate-800">{dsp.vehicleNumber}</strong> | Driver: {dsp.driverName}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        {new Date(dsp.dispatchDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Dispatch Modal */}
      {dispatchOrder && (
        <Modal
          isOpen={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          title={`Process Dispatch: ${dispatchOrder.orderNumber}`}
          subtitle="Physical inventory and reserved inventory will both be decreased upon submission"
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
                Complete Dispatch
              </Button>
            </>
          }
        >
          <form onSubmit={handleProcessDispatch} className="space-y-4">
            <div className="bg-orange-50 p-3.5 rounded-xl border border-orange-200/70 text-xs text-orange-950">
              <p className="font-bold mb-0.5 text-orange-900">Dispatching for Customer:</p>
              <p className="font-medium text-orange-800">{dispatchOrder.customer?.companyName} ({dispatchOrder.customer?.city})</p>
            </div>

            <Input
              label="Vehicle Registration Number"
              placeholder="e.g. MH-12-AB-9876"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              required
            />

            <Input
              label="Driver Name & Contact"
              placeholder="e.g. Ramesh Patil"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
