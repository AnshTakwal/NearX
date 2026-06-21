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
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#F1F5F9] p-4 md:p-6 lg:p-8 gap-6 md:gap-8 justify-center items-center">
      {/* Left Pane - Branding & Features */}
      <div className="w-full md:w-[40%] bg-[#0F172A] text-white flex flex-col justify-between p-10 md:p-16 relative overflow-hidden rounded-[2.5rem] shadow-xl md:h-[calc(100vh-64px)] min-h-[450px]">
        {/* Glow Spheres */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#00BCD4]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00BCD4]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Shield/Logo Icon */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#00BCD4]/15 border border-[#00BCD4]/30 flex items-center justify-center text-[#00BCD4]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-white">NearX</span>
        </div>

        <div className="my-auto space-y-8 pt-12 pb-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
            Secure Access to<br/>
            <span className="text-[#00BCD4]">Hyperlocal Deals.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-md">
            The global platform for navigating local store discounts on near-expiry items with absolute precision.
          </p>

          <ul className="space-y-6 pt-4">
            {[
              { title: "Real-Time Savings", desc: "Instantly discover discounts on near-expiry items near you." },
              { title: "Waste Reduction", desc: "Help local stores reduce food waste and save the planet." },
              { title: "Secure Transactions", desc: "Check out safely with integrated secure payment channels." }
            ].map((f, idx) => (
              <li key={idx} className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-[#00BCD4]/10 border border-[#00BCD4]/30 flex items-center justify-center text-[#00BCD4] shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <span className="text-base font-bold text-white block">{f.title}</span>
                  <span className="text-sm text-slate-400 font-medium block mt-0.5">{f.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-slate-500 text-xs font-semibold relative z-10">
          © {new Date().getFullYear()} NearX. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full md:w-[60%] bg-white rounded-[2.5rem] shadow-xl md:h-[calc(100vh-64px)] overflow-y-auto p-6 sm:p-8 md:p-10">
        <div className="w-full h-full flex flex-col justify-center py-4">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-[#1A1A2E] tracking-tight mb-3">Welcome Back</h1>
            <p className="text-slate-400 text-base font-medium">Please enter your credentials to continue.</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
            {[
              { id: 'customer', icon: User, label: 'Customer' },
              { id: 'store', icon: Store, label: 'Store' },
              { id: 'delivery', icon: Bike, label: 'Delivery' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  role === r.id
                    ? 'bg-[#00BCD4] text-white shadow-md shadow-cyan-150'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <r.icon size={16} />
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-[#B91C1C] text-sm py-3.5 px-4 rounded-2xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  className="w-full pr-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200 bg-[#F1F5F9]/60"
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-500 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  className="w-full pr-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200 bg-[#F1F5F9]/60"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00BCD4] hover:bg-[#0097A7] text-white h-14 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
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

          <p className="text-center mt-10 text-sm text-slate-400 font-semibold">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00BCD4] hover:text-[#0097A7] font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
