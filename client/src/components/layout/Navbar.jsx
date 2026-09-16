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
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Boxes className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-800 to-slate-900 bg-clip-text text-transparent">
                  UDYAM
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Business Operations & Inventory
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
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
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
              className="flex items-center gap-1.5 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
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
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  isAdmin ? 'bg-purple-600' : 'bg-sky-600'
                }`}
              >
                {isAdmin ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
                  isActive ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600'
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
