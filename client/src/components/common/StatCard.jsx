import React from 'react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'orange',
  subtext,
  onClick,
}) {
  const colorMap = {
    orange: {
      bg: 'bg-orange-50 text-orange-600 border border-orange-200/60',
      border: 'hover:border-orange-400 hover:shadow-brand',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      border: 'hover:border-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      border: 'hover:border-emerald-400',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
      border: 'hover:border-purple-400',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      border: 'hover:border-rose-400',
    },
    sky: {
      bg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
      border: 'hover:border-sky-400',
    },
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md ' + scheme.border : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{value ?? '0'}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.bg} shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
