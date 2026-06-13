import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Store, Bike, Loader2 } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-[#FAFEFF]">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-3">Create an Account</h1>
          <p className="text-slate-500">Join NearX to start saving</p>
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

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input type="text" value={form.fullName} onChange={handle('fullName')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
              required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input type="email" value={form.email} onChange={handle('email')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
              required autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={handle('phone')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
              placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input type="password" value={form.password} onChange={handle('password')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
              required minLength={6} autoComplete="new-password" />
          </div>

          {/* Store owner extra fields */}
          {role === 'store' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Name</label>
                <input type="text" value={form.storeName} onChange={handle('storeName')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Address</label>
                <input type="text" value={form.storeAddress} onChange={handle('storeAddress')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input type="text" value={form.city} onChange={handle('city')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                  <input type="text" value={form.pincode} onChange={handle('pincode')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Location</label>
                <MapPicker 
                  initialPosition={{ lat: form.lat, lng: form.lng }}
                  onPositionChange={(pos) => setForm(f => ({ ...f, lat: pos.lat, lng: pos.lng }))}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00BCD4] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0097A7] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Creating account...</>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00BCD4] font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
