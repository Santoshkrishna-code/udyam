import React from 'react';

export default function Card({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  className = '',
  noPadding = false,
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-6'}>{children}</div>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}
