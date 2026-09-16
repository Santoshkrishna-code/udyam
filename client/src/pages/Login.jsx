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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600 text-white shadow-xl shadow-sky-600/30 mb-4">
          <Boxes className="w-9 h-9 stroke-[2.2]" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">UDYAM ERP</h2>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          Business Operations & Inventory Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 sm:px-10 shadow-xl border-slate-200/90">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="user@udyam.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              className="mt-2"
            >
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Demo Sign-In
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('ADMIN')}
                disabled={loading}
                className="text-xs font-semibold py-2 border-purple-200 hover:bg-purple-50 text-purple-700"
              >
                <Shield className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Admin
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('SALES_USER')}
                disabled={loading}
                className="text-xs font-semibold py-2 border-sky-200 hover:bg-sky-50 text-sky-700"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 text-sky-600" />
                Sales User
              </Button>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[11px] text-slate-400">
                Credentials: <span className="font-mono">admin@udyam.local</span> / <span className="font-mono">sales@udyam.local</span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
