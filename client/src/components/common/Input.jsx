import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full rounded-lg border text-sm transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            hover:border-slate-400 focus:hover:border-orange-500
            disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : 'pl-3.5'}
            pr-3.5 py-2
            ${
              error
                ? 'border-rose-300 text-rose-900 bg-rose-50/40 focus:ring-rose-400 focus:border-rose-400'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
            }
          `}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
