import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const configs = {
    // Enquiry statuses
    NEW: {
      label: 'New',
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
    QUOTED: {
      label: 'Quoted',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    WON: {
      label: 'Won',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    LOST: {
      label: 'Lost',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },

    // Quotation statuses
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    SENT: {
      label: 'Sent',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    ACCEPTED: {
      label: 'Accepted',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    CONFIRMED: {
      label: 'Confirmed',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    DISPATCHED: {
      label: 'Dispatched',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },

    // Role badges
    ADMIN: {
      label: 'Admin',
      bg: 'bg-purple-100 text-purple-800 border-purple-200 font-semibold',
      dot: 'bg-purple-600',
    },
    SALES_USER: {
      label: 'Sales User',
      bg: 'bg-sky-100 text-sky-800 border-sky-200 font-semibold',
      dot: 'bg-sky-600',
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
