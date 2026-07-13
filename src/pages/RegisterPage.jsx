import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Store, Bike, Loader2, Mail, Phone, Lock, MapPin, Globe, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import '../lib/leaflet-setup';

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function RegisterPage() {
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  
  const mapRef = useRef(null);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

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

  const handleMapClick = async (lat, lng) => {
    setForm(f => ({ ...f, lat, lng }));
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        
        // Extract road/suburb for cleaner street address
        const road = addr.road || addr.suburb || addr.neighbourhood || '';
        const suburb = addr.suburb || addr.neighbourhood || '';
        const streetAddress = [road, suburb].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';
        
        const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
        const pincode = addr.postcode || '';
        
        setForm(f => ({
          ...f,
          storeAddress: streetAddress,
          city: city,
          pincode: pincode,
          lat,
          lng
        }));
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          setForm(f => ({ ...f, lat, lng }));
          
          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 15);
          }
          
          // Auto-fill address for this new location
          handleMapClick(lat, lng);
        } else {
          alert('Location not found. Please try another query.');
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Geolocate on role change to store
  useEffect(() => {
    if (role === 'store' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setForm(f => ({ ...f, lat: latitude, lng: longitude }));
          handleMapClick(latitude, longitude);
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 15);
          }
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
        }
      );
    }
  }, [role]);

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
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#F1F5F9] p-4 md:p-6 lg:p-8 gap-6 md:gap-8 justify-center items-center">
      {/* Left Pane - Branding & Features OR Big Map for Store */}
      <div className="w-full md:w-[40%] bg-[#0F172A] text-white flex flex-col justify-between relative overflow-hidden rounded-[2.5rem] shadow-xl md:h-[calc(100vh-64px)] min-h-[450px]">
        {role === 'store' ? (
          <div className="absolute inset-0 w-full h-full z-0 flex flex-col rounded-[2.5rem] overflow-hidden">
            {/* Header overlay */}
            <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3 bg-[#0F172A]/90 backdrop-blur-md p-3 px-4 rounded-2xl border border-slate-700/50 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#00BCD4]/15 border border-[#00BCD4]/30 flex items-center justify-center text-[#00BCD4]">
                <Globe size={20} />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white block">Select Store Location</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Click or search to set</span>
              </div>
            </div>

            {/* Search overlay on map */}
            <form onSubmit={handleSearch} className="absolute top-6 right-6 z-[1000] flex items-center gap-2 bg-[#0F172A]/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 shadow-lg max-w-xs w-[240px] sm:w-[280px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store address..."
                className="w-full bg-transparent px-3 py-1.5 text-xs text-white outline-none font-medium placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-[#00BCD4] hover:bg-[#0097A7] text-white p-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
              </button>
            </form>

            {geocoding && (
              <div className="absolute bottom-6 left-6 z-[1000] bg-[#00BCD4] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 shadow-md animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                <span>Fetching Address...</span>
              </div>
            )}

            <MapContainer 
              center={[form.lat, form.lng]} 
              zoom={15} 
              scrollWheelZoom={true} 
              className="w-full h-full"
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapEventsHandler onMapClick={handleMapClick} />
              <Marker position={[form.lat, form.lng]} />
            </MapContainer>
          </div>
        ) : (
          <div className="p-10 md:p-16 flex flex-col justify-between h-full w-full">
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
        )}
      </div>

      {/* Right Pane - Form */}
      <div className="w-full md:w-[60%] bg-white rounded-[2.5rem] shadow-xl md:h-[calc(100vh-64px)] overflow-y-auto p-6 sm:p-8 md:p-12">
        <div className="w-full h-full flex flex-col justify-center py-4">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-3">Create Account</h1>
            <p className="text-gray-400 text-base font-semibold">Join NearX and start saving food & money</p>
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
                    ? 'bg-[#0097A7] text-white shadow-lg shadow-[#0097A7]/15'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <r.icon size={16} />
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-[#B91C1C] text-sm py-3.5 px-4 rounded-2xl font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={handle('fullName')}
                  style={{ paddingLeft: '3rem' }}
                  className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                  placeholder="John Doe"
                  required 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={handle('email')}
                  style={{ paddingLeft: '3rem' }}
                  className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                  placeholder="you@example.com"
                  required 
                  autoComplete="email" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="focus" 
                  value={form.phone} 
                  onChange={handle('phone')}
                  style={{ paddingLeft: '3rem' }}
                  className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                  placeholder="+91 98765 43210" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={handle('password')}
                  style={{ paddingLeft: '3rem' }}
                  className="input-premium h-14 bg-slate-50/50 focus:bg-white"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Store Name</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={form.storeName} 
                      onChange={handle('storeName')}
                      style={{ paddingLeft: '3rem' }}
                      className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                      placeholder="Fresh Mart"
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Store Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={form.storeAddress} 
                      onChange={handle('storeAddress')}
                      style={{ paddingLeft: '3rem' }}
                      className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                      placeholder="123 Market St"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">City</label>
                    <input 
                      type="text" 
                      value={form.city} 
                      onChange={handle('city')}
                      className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                      placeholder="Delhi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Pincode</label>
                    <input 
                      type="text" 
                      value={form.pincode} 
                      onChange={handle('pincode')}
                      className="input-premium h-14 bg-slate-50/50 focus:bg-white"
                      placeholder="110001"
                      required
                    />
                  </div>
                </div>
                
                <div className="text-[11px] text-slate-400 font-bold bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span>Coordinates: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span>
                  <span className="text-[#0097A7]">Set on map (left side)</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary h-14 !rounded-2xl text-sm mt-8"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-10 text-sm text-slate-400 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0097A7] hover:text-[#00838F] font-bold transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
