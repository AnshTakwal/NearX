import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Store, Bike, Loader2, Mail, Phone, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MapPicker from '../components/shared/MapPicker';

export default function RegisterPage() {
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    storeName: '',
    storeAddress: '',
    city: '',
    pincode: '',
    lat: 28.6139,
    lng: 77.2090,
  });

  const handle = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form, role);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-[#FAFEFF] to-[#E0F7FA]/30 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#00BCD4]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0097A7]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-100/80 w-full max-w-md relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1A1A2E] tracking-tight mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm font-medium">Join NearX and start saving food & money</p>
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
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                role === r.id
                  ? 'bg-[#00BCD4] text-white shadow-md shadow-cyan-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              <r.icon size={16} />
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-[#B91C1C] text-sm py-3 px-4 rounded-2xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={form.fullName} 
                onChange={handle('fullName')}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                placeholder="John Doe"
                required 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={form.email} 
                onChange={handle('email')}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                placeholder="you@example.com"
                required 
                autoComplete="email" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Phone (optional)</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="tel" 
                value={form.phone} 
                onChange={handle('phone')}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                placeholder="+91 98765 43210" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={form.password} 
                onChange={handle('password')}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                placeholder="••••••••"
                required 
                minLength={6} 
                autoComplete="new-password" 
              />
            </div>
          </div>

          {/* Store owner extra fields */}
          {role === 'store' && (
            <div className="space-y-5 border-t border-slate-100 pt-5 mt-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={form.storeName} 
                    onChange={handle('storeName')}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                    placeholder="Fresh Mart"
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Store Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={form.storeAddress} 
                    onChange={handle('storeAddress')}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                    placeholder="123 Market St"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">City</label>
                  <input 
                    type="text" 
                    value={form.city} 
                    onChange={handle('city')}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pincode</label>
                  <input 
                    type="text" 
                    value={form.pincode} 
                    onChange={handle('pincode')}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium transition-all duration-200"
                    placeholder="110001"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Store Location (Click on Map)</label>
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <MapPicker 
                    initialPosition={{ lat: form.lat, lng: form.lng }}
                    onPositionChange={(pos) => setForm(f => ({ ...f, lat: pos.lat, lng: pos.lng }))}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00BCD4] hover:bg-[#0097A7] text-white py-4 rounded-2xl font-bold transition-all duration-300 shadow-md shadow-cyan-100 hover:shadow-xl hover:shadow-cyan-200/50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Creating account...</>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-400 font-semibold">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00BCD4] hover:text-[#0097A7] font-bold transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
