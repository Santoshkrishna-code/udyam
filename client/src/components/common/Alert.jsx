import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Alert({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) {
  const configs = {
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-500',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
  };

  const current = configs[type] || configs.info;
  const IconComponent = current.icon;

  return (
    <div
      className={`rounded-xl border p-4 flex items-start gap-3 text-sm shadow-sm animate-in fade-in-50 duration-150 ${current.bg} ${className}`}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm leading-tight mb-0.5">{title}</h4>}
        {message && <div className="text-xs leading-relaxed opacity-90">{message}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
