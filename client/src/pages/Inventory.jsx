import React, { useState, useEffect } from 'react';
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
import { Boxes, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

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
        message: `Physical quantity cannot be lower than currently reserved quantity (${selectedItem.reservedQuantity})`,
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
        message: `Updated physical stock for ${selectedItem.productName} to ${qty}!`,
      });
      setEditModalOpen(false);
      loadInventory();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Code',
      key: 'productCode',
      render: (val) => <span className="font-mono font-bold text-sky-700">{val}</span>,
    },
    {
      header: 'Product Name',
      key: 'productName',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{val}</span>
          <span className="text-xs text-slate-500">{row.category}</span>
        </div>
      ),
    },
    {
      header: 'Unit',
      key: 'unit',
      align: 'center',
      render: (val) => <span className="text-xs text-slate-500">{val}</span>,
    },
    {
      header: 'Physical Stock',
      key: 'physicalQuantity',
      align: 'right',
      render: (val) => <span className="font-semibold text-slate-800">{val}</span>,
    },
    {
      header: 'Reserved Stock',
      key: 'reservedQuantity',
      align: 'right',
      render: (val) => (
        <span
          className={`font-semibold ${
            val > 0 ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Available Stock',
      key: 'availableQuantity',
      align: 'right',
      render: (val) => (
        <span
          className={`font-extrabold px-2.5 py-1 rounded-md text-sm ${
            val > 50
              ? 'bg-emerald-50 text-emerald-700'
              : val > 0
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Action',
      key: 'actions',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Edit3}
          onClick={() => handleOpenEdit(row)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Admin role required to adjust physical inventory' : 'Adjust physical stock'}
          className={!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Master</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock tracking. Invariant: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-sky-800">Available = Physical - Reserved</code>
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sales User Mode: Read-only inventory view.</span>
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

      {/* Inventory Table Card */}
      <Card noPadding>
        <Table
          columns={columns}
          data={inventory}
          emptyMessage="No inventory records found."
          isLoading={loading}
        />
      </Card>

      {/* Adjust Physical Stock Modal */}
      {selectedItem && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Adjust Physical Stock: ${selectedItem.productName}`}
          subtitle={`Current Physical: ${selectedItem.physicalQuantity} | Reserved: ${selectedItem.reservedQuantity} | Available: ${selectedItem.availableQuantity}`}
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
                Update Stock
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateStock} className="space-y-4">
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
              <p className="font-semibold mb-1">Stock Invariant Constraint:</p>
              <p>
                New physical quantity must be greater than or equal to the reserved quantity (<strong>{selectedItem.reservedQuantity}</strong>).
              </p>
            </div>

            <Input
              label="New Physical Stock Quantity"
              type="number"
              min={selectedItem.reservedQuantity}
              value={newPhysical}
              onChange={(e) => setNewPhysical(e.target.value)}
              required
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
