import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, Button } from '../common';
import {
  Boxes,
  FileSpreadsheet,
  FileCheck2,
  ShoppingCart,
  Users,
  LayoutDashboard,
  LogOut,
  ArrowLeftRight,
  Shield,
  UserCheck,
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, logout, quickLogin, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Enquiries', icon: FileSpreadsheet },
    { id: 'quotations', label: 'Quotations', icon: FileCheck2 },
    { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  const handleSwitchRole = () => {
    if (isAdmin) {
      quickLogin('SALES_USER');
    } else {
      quickLogin('ADMIN');
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePage('dashboard')}>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200/60 p-1 shadow-xs hover:scale-105 transition-transform">
              <img
                src="/logo-icon-transparent.png"
                alt="Udyam Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Udyam
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200/50">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-bold tracking-wider uppercase">
                Building Business. Together.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? 'bg-orange-50/80 text-orange-700 font-semibold border border-orange-200/60 shadow-xs'
                        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/40'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Profile & Quick Switch */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <button
              onClick={handleSwitchRole}
              title={`Switch to ${isAdmin ? 'Sales User' : 'Admin'}`}
              className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-orange-200/80 bg-orange-50/50 hover:bg-orange-100/70 text-orange-800 transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-orange-600" />
              <span className="hidden sm:inline">Switch to {isAdmin ? 'Sales' : 'Admin'}</span>
            </button>

            {/* Role & User Badge */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
                <div className="mt-1">
                  <StatusBadge status={user?.role} />
                </div>
              </div>

              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                  isAdmin
                    ? 'bg-slate-900 text-orange-400 border border-slate-700'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-brand'
                }`}
              >
                {isAdmin ? <Shield className="w-4 h-4 text-orange-400" /> : <UserCheck className="w-4 h-4" />}
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between border-t border-slate-100 py-2 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium shrink-0 ${
                  isActive ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200' : 'text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
