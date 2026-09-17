import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const configs = {
    // Enquiry statuses
    NEW: {
      label: 'New',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    QUOTED: {
      label: 'Quoted',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    WON: {
      label: 'Won',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    LOST: {
      label: 'Lost',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Quotation statuses
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    SENT: {
      label: 'Sent',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    ACCEPTED: {
      label: 'Accepted',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Sales Order statuses
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    CONFIRMED: {
      label: 'Confirmed',
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-teal-500',
    },
    DISPATCHED: {
      label: 'Dispatched',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Inventory stock health
    HEALTHY: {
      label: 'Healthy',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    LOW: {
      label: 'Low Stock',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },

    // Role badges
    ADMIN: {
      label: 'Administrator',
      bg: 'bg-slate-900 text-slate-200 border-slate-800 font-medium',
      dot: 'bg-[#FF7A00]',
    },
    SALES_USER: {
      label: 'Sales Representative',
      bg: 'bg-slate-100 text-slate-800 border-slate-200 font-medium',
      dot: 'bg-blue-600',
    },
  };

  const current = configs[normalized] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      {current.label}
    </span>
  );
}
