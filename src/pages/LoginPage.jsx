import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Store, Bike, Loader2, Mail, Lock } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#F7F8FA] p-4 md:p-6 lg:p-8 gap-6 md:gap-8 justify-center items-center">
      {/* Left Pane - Branding */}
      <div className="w-full md:w-[42%] bg-[#0F172A] text-white flex flex-col justify-between p-10 md:p-14 relative overflow-hidden rounded-2xl shadow-lg md:h-[calc(100vh-64px)] min-h-[420px]">
        {/* Glow Spheres */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#0097A7]/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0097A7]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-[#0097A7]/15 border border-[#0097A7]/25 flex items-center justify-center text-[#00BCD4]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">NearX</span>
        </div>

        <div className="my-auto space-y-6 pt-10 pb-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold leading-tight">
            Secure Access to<br/>
            <span className="text-[#00BCD4]">Hyperlocal Deals.</span>
          </h2>
          <p className="text-slate-400 text-[15px] leading-relaxed max-w-md">
            The platform for discovering discounts on near-expiry items from local stores — save money, reduce waste.
          </p>

          <ul className="space-y-5 pt-3">
            {[
              { title: "Real-Time Savings", desc: "Discover discounts on near-expiry items near you." },
              { title: "Waste Reduction", desc: "Help local stores reduce food waste." },
              { title: "Secure Transactions", desc: "Safe checkout with integrated payment channels." }
            ].map((f, idx) => (
              <li key={idx} className="flex gap-3.5 items-start">
                <div className="w-5 h-5 rounded-full bg-[#0097A7]/10 border border-[#0097A7]/25 flex items-center justify-center text-[#00BCD4] shrink-0 mt-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">{f.title}</span>
                  <span className="text-[13px] text-slate-400 block mt-0.5">{f.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-slate-500 text-xs font-medium relative z-10">
          © {new Date().getFullYear()} NearX. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full md:w-[58%] bg-white rounded-2xl shadow-lg md:h-[calc(100vh-64px)] overflow-y-auto p-6 sm:p-8 md:p-12">
        <div className="w-full h-full flex flex-col justify-center items-center py-4">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Welcome Back</h1>
              <p className="text-gray-500 text-[15px]">Enter your credentials to continue.</p>
            </div>

            {/* Role Selector */}
            <div className="flex p-1.5 bg-gray-50 rounded-xl mb-8 border border-gray-100">
              {[
                { id: 'customer', icon: User, label: 'Customer' },
                { id: 'store', icon: Store, label: 'Store' },
                { id: 'delivery', icon: Bike, label: 'Delivery' }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === r.id
                      ? 'bg-[#0097A7] text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <r.icon size={16} />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm py-3.5 px-4 rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 rounded-xl text-[15px] mt-4"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  <>
                    <span>Continue as {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-10 text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#0097A7] hover:text-[#00838F] font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
