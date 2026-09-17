import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, ChevronDown, User, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ activePage, setActivePage, setMobileOpen }) {
  const { user, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const titles = {
    dashboard: 'Dashboard',
    enquiries: 'Enquiries',
    quotations: 'Quotations',
    'sales-orders': 'Sales Orders',
    inventory: 'Inventory',
    customers: 'Customers',
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger */}
        <button
          type="button"
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title & breadcrumb */}
        <div>
          <h1 className="text-lg font-bold text-[#111827]">
            {titles[activePage] || 'Overview'}
          </h1>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Quick action button */}
        <button
          type="button"
          onClick={() => setActivePage('enquiries')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FF7A00] hover:bg-[#F05A00] shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Enquiry</span>
        </button>

        {/* User Account Dropdown (Spec Section 26) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-3 py-1 text-left border-l border-slate-200 hover:bg-slate-50 rounded-r-lg transition-colors"
          >
            <div className="hidden sm:block text-right">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                {user?.name || 'User'}
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-[#FF7A00]' : 'bg-blue-500'}`} />
                <span className="text-[11px] text-slate-500">
                  {isAdmin ? 'Administrator' : 'Sales User'}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 text-left font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
