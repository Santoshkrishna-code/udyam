import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Button,
  Input,
  Modal,
  Card,
  Table,
  Alert,
} from '../components/common';
import { Boxes, Edit3, Search, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit stock modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newPhysical, setNewPhysical] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setNewPhysical(item.physicalQuantity);
    setEditModalOpen(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setAlert(null);

    const qty = parseInt(newPhysical, 10);
    if (isNaN(qty) || qty < 0) {
      setAlert({ type: 'error', message: 'Physical stock must be a non-negative integer' });
      return;
    }

    if (qty < selectedItem.reservedQuantity) {
      setAlert({
        type: 'error',
        message: `Physical quantity cannot be lower than system-managed reserved quantity (${selectedItem.reservedQuantity})`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/inventory/${selectedItem.productId}`, {
        physicalQuantity: qty,
      });
      setAlert({
        type: 'success',
        message: `Updated physical stock for ${selectedItem.productName} to ${qty}`,
      });
      setEditModalOpen(false);
      loadInventory();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered items
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const pName = (item.productName || '').toLowerCase();
      const pCode = (item.productCode || '').toLowerCase();
      const matchSearch =
        !searchTerm ||
        pName.includes(searchTerm.toLowerCase()) ||
        pCode.includes(searchTerm.toLowerCase());

      const isLow = item.availableQuantity <= 20;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'LOW' && isLow) ||
        (statusFilter === 'HEALTHY' && !isLow);

      return matchSearch && matchStatus;
    });
  }, [inventory, searchTerm, statusFilter]);

  const columns = [
    {
      header: 'Product',
      key: 'productName',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{val}</span>
          <span className="text-xs text-slate-400 font-mono">{row.productCode} • {row.category}</span>
        </div>
      ),
    },
    {
      header: 'Physical',
      key: 'physicalQuantity',
      align: 'right',
      render: (val) => <span className="font-semibold text-slate-800">{val}</span>,
    },
    {
      header: 'Reserved',
      key: 'reservedQuantity',
      align: 'right',
      render: (val) => (
        <span className={`font-semibold ${val > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
          {val}
        </span>
      ),
    },
    {
      header: 'Available',
      key: 'availableQuantity',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900">
          {val}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (_, row) => {
        const isLow = row.availableQuantity <= 20;
        return isLow ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Healthy
          </span>
        );
      },
    },
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Edit3}
          onClick={() => handleOpenEdit(row)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Administrator permissions required to update inventory' : 'Update stock'}
          className={!isAdmin ? 'opacity-40 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900'}
        >
          Update Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">
              Available = Physical − Reserved
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor physical, reserved and available stock across all product lines.
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Sales User: Read-only inventory access</span>
          </div>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all"
        >
          <option value="ALL">All Stock Status</option>
          <option value="HEALTHY">Healthy Stock</option>
          <option value="LOW">Low Stock</option>
        </select>
      </div>

      {/* Inventory Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={filteredInventory}
          emptyMessage="No products found in inventory."
          isLoading={loading}
        />
      </Card>

      {/* Update Inventory Modal (Spec Section 22) */}
      {selectedItem && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Update Inventory"
          subtitle={`Adjust physical quantity for ${selectedItem.productName}`}
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateStock}
                isLoading={submitting}
              >
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateStock} className="space-y-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Product</label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-900">
                {selectedItem.productName} ({selectedItem.productCode})
              </div>
            </div>

            <Input
              label="Physical Quantity"
              type="number"
              min={selectedItem.reservedQuantity}
              value={newPhysical}
              onChange={(e) => setNewPhysical(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reserved Quantity
              </label>
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 flex justify-between items-center">
                <span className="font-semibold text-slate-800">{selectedItem.reservedQuantity}</span>
                <span className="text-xs text-slate-500 font-medium">(system managed)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Projected Available Quantity
              </label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-bold text-slate-900">
                {Math.max(0, (parseInt(newPhysical, 10) || 0) - selectedItem.reservedQuantity)}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Physical quantity cannot be reduced below the system-managed reserved quantity ({selectedItem.reservedQuantity}).
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}
