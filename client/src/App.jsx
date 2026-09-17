import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Enquiries from './pages/Enquiries';
import Quotations from './pages/Quotations';
import SalesOrders from './pages/SalesOrders';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedEnquiryForQuote, setSelectedEnquiryForQuote] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-2" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading UDYAM ERP...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSelectEnquiryForQuote = (enquiry) => {
    setSelectedEnquiryForQuote(enquiry);
    setActivePage('quotations');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
        {activePage === 'enquiries' && (
          <Enquiries
            setActivePage={setActivePage}
            onSelectEnquiryForQuote={handleSelectEnquiryForQuote}
          />
        )}
        {activePage === 'quotations' && (
          <Quotations
            preselectedEnquiry={selectedEnquiryForQuote}
            setActivePage={setActivePage}
          />
        )}
        {activePage === 'sales-orders' && <SalesOrders />}
        {activePage === 'inventory' && <Inventory />}
        {activePage === 'customers' && <Customers />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          UDYAM — Business Operations & Inventory ERP © {new Date().getFullYear()} | Modular PERN Architecture
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
