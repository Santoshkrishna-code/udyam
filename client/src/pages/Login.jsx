import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Alert } from '../components/common';
import { ArrowRight, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';

export default function Login() {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F8FA] text-[#111827]">
      {/* Left Side: Industrial Dark Brand Panel */}
      <div className="md:w-5/12 lg:w-9/20 bg-[#0B1220] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white border-b md:border-b-0 md:border-r border-[#1E293B]">
        {/* Subtle industrial grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#FFFFFF 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Subtle orange ambient glow */}
        <div className="absolute top-12 left-12 w-64 h-64 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 mb-12">
            <div className="w-11 h-11 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
              <img
                src="/logo-icon-transparent.png"
                alt="Udyam"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">Udyam</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30">
                ERP
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-md">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
              Business Operations <br className="hidden sm:inline" />& Inventory Platform
            </h2>
            <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">
              Manage every customer order seamlessly from enquiry and commercial quotation to atomic inventory reservation and product dispatch.
            </p>
          </div>

          {/* Industrial Workflow Timeline */}
          <div className="mt-10 space-y-3 max-w-sm">
            <div className="flex items-start gap-3 text-xs text-[#CBD5E1]">
              <CheckCircle2 className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
              <span>Multi-item customer enquiries and commercial quotation engine</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-[#CBD5E1]">
              <CheckCircle2 className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
              <span>Strict transactional sales order conversion</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-[#CBD5E1]">
              <CheckCircle2 className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
              <span>Atomic stock reservation with concurrency safety</span>
            </div>
            <div className="flex items-start gap-3 text-xs text-[#CBD5E1]">
              <CheckCircle2 className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
              <span>Strict physical deduction upon verified dispatch</span>
            </div>
          </div>
        </div>

        {/* Footer brand promise */}
        <div className="relative z-10 pt-8 border-t border-[#1E293B]/80 text-xs text-[#64748B]">
          Building Business. Together. &copy; {new Date().getFullYear()} Udyam Operations.
        </div>
      </div>

      {/* Right Side: Clean Enterprise Sign-in Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-[#64748B] mt-1.5">
              Sign in to your enterprise workspace
            </p>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#374151] mb-1.5"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-sm px-3.5 py-2.5 placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#374151]"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-sm px-3.5 py-2.5 placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center font-semibold rounded-lg text-sm px-4 py-2.5 text-white bg-[#FF7A00] hover:bg-[#F05A00] active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </button>
          </form>

          {/* Security & Access Badge */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secure business access</span>
            </div>
            
            {/* Discreet demo helper for rapid testing without dominating the production UI */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDemoOptions(!showDemoOptions)}
                className="text-xs text-[#64748B] hover:text-[#111827] flex items-center gap-1 font-medium transition-colors"
              >
                <span>Demo access</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDemoOptions ? 'rotate-180' : ''}`} />
              </button>

              {showDemoOptions && (
                <div className="absolute right-0 bottom-6 w-48 bg-white rounded-lg shadow-lg border border-[#E5E7EB] p-2 text-xs z-20 animate-in fade-in-50">
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-2 py-1">
                    Instant Demo Login
                  </p>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ADMIN')}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#F7F8FA] font-medium text-[#111827]"
                  >
                    Administrator
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('SALES_USER')}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#F7F8FA] font-medium text-[#111827]"
                  >
                    Sales Representative
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
