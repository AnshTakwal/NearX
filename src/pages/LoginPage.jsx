import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Store, Bike, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, role);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-[#FAFEFF]">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-3">Welcome back</h1>
          <p className="text-slate-500">Sign in to continue to NearX</p>
        </div>

        {/* Role Selector */}
        <div className="flex p-1 bg-slate-50 rounded-xl mb-8 border border-slate-100">
          {[
            { id: 'customer', icon: User, label: 'Customer' },
            { id: 'store', icon: Store, label: 'Store' },
            { id: 'delivery', icon: Bike, label: 'Delivery' }
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === r.id
                  ? 'bg-[#00BCD4] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <r.icon size={16} />
              <span className="hidden sm:inline">{r.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-[#FEF2F2] border border-red-200 text-[#991B1B] text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00BCD4] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0097A7] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Signing in...</>
            ) : (
              `Continue as ${role.charAt(0).toUpperCase() + role.slice(1)}`
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#00BCD4] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
