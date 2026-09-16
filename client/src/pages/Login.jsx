import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert } from '../components/common';
import { Boxes, Shield, UserCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#0B0F17] relative overflow-hidden">
      {/* Ambient background glow matching Udyam warm orange */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-orange-500/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Official Udyam Logo Lockup */}
        <div className="inline-flex flex-col items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-white to-slate-100 p-2.5 shadow-2xl shadow-orange-500/20 border border-white/20 hover:scale-105 transition-transform duration-300">
            <img
              src="/logo-icon-transparent.png"
              alt="Udyam Logo Mark"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-4">
            Udyam
          </h1>
          <p className="text-[11px] text-orange-400 font-bold tracking-[0.25em] uppercase mt-1">
            Building Business. Together.
          </p>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl shadow-black/60 p-8">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="user@udyam.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              className="mt-3 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 shadow-brand hover:shadow-brand-lg"
            >
              Sign In to ERP <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center mb-3">
              One-Click Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 hover:border-orange-500/60 text-white text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
              >
                <div className="w-5 h-5 rounded-md bg-slate-950 flex items-center justify-center text-orange-400">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('SALES_USER')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm"
              >
                <div className="w-5 h-5 rounded-md bg-orange-500 text-white flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span>Sales User</span>
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-500">
                Demo: <span className="text-slate-400 font-mono">admin@udyam.local</span> / <span className="text-slate-400 font-mono">sales@udyam.local</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
