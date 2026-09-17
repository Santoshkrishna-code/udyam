import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedEnquiryForQuote, setSelectedEnquiryForQuote] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00] mb-2" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
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
    <div className="min-h-screen flex bg-[#F7F8FA] text-[#111827]">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activePage={activePage}
          setActivePage={setActivePage}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          {activePage === 'sales-orders' && <SalesOrders setActivePage={setActivePage} />}
          {activePage === 'inventory' && <Inventory />}
          {activePage === 'customers' && <Customers setActivePage={setActivePage} />}
        </main>
      </div>
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
