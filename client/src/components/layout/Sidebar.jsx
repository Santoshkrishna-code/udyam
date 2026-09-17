import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  ShoppingCart,
  Boxes,
  Users,
  LogOut,
  X,
  Shield,
  UserCheck,
} from 'lucide-react';

export default function Sidebar({
  activePage,
  setActivePage,
  mobileOpen = false,
  setMobileOpen = () => {},
}) {
  const { user, logout, quickLogin, isAdmin } = useAuth();

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileOpen(false);
  };

  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SALES',
      items: [
        { id: 'enquiries', label: 'Enquiries', icon: FileSpreadsheet },
        { id: 'quotations', label: 'Quotations', icon: FileCheck2 },
        { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'inventory', label: 'Inventory', icon: Boxes },
        { id: 'customers', label: 'Customers', icon: Users },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1220] text-white flex flex-col justify-between border-r border-[#1E293B] transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E293B]">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="w-8 h-8 rounded-lg bg-white p-1.5 flex items-center justify-center shadow-xs">
                <img
                  src="/logo-icon-transparent.png"
                  alt="Udyam"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Udyam</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30">
                  ERP
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-6 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                          ${
                            isActive
                              ? 'bg-[#FF7A00] text-white shadow-xs font-semibold'
                              : 'text-[#94A3B8] hover:text-white hover:bg-[#111A2E]'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Account & Bottom Section */}
        <div className="p-4 border-t border-[#1E293B] bg-[#070D18] space-y-3">
          {/* User Details */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.name || 'Workspace User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isAdmin ? 'bg-[#FF7A00]' : 'bg-blue-400'}`} />
                <span className="text-xs text-[#94A3B8] truncate">
                  {isAdmin ? 'Administrator' : 'Sales Representative'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-[#64748B] hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Dev / Demo Mode Role Selector (Spec Section 25) */}
          <div className="pt-2 border-t border-[#1E293B]/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
              Evaluation Role
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => quickLogin('ADMIN')}
                className={`py-1 px-2 rounded text-[11px] font-medium text-center transition-colors ${
                  isAdmin
                    ? 'bg-[#FF7A00] text-white font-semibold'
                    : 'bg-[#111A2E] text-[#94A3B8] hover:text-white hover:bg-[#16223B]'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('SALES_USER')}
                className={`py-1 px-2 rounded text-[11px] font-medium text-center transition-colors ${
                  !isAdmin
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-[#111A2E] text-[#94A3B8] hover:text-white hover:bg-[#16223B]'
                }`}
              >
                Sales
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
