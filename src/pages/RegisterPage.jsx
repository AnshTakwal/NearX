import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'customer';
  
  const [role, setRole] = useState(initialRole);
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
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[#F7F8FA] p-4 md:p-6 lg:p-8 gap-6 md:gap-8 justify-center items-center">
      {/* Left Pane */}
      <div className="w-full md:w-[42%] bg-[#0F172A] text-white flex flex-col justify-between relative overflow-hidden rounded-2xl shadow-lg md:h-[calc(100vh-64px)] min-h-[420px]">
        {role === 'store' ? (
          <div className="absolute inset-0 w-full h-full z-0 flex flex-col rounded-2xl overflow-hidden">
            {/* Header overlay */}
            <div className="absolute top-5 left-5 z-[1000] flex items-center gap-3 bg-[#0F172A]/90 backdrop-blur-md p-3 px-4 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="w-9 h-9 rounded-lg bg-[#0097A7]/15 border border-[#0097A7]/25 flex items-center justify-center text-[#00BCD4]">
                <Globe size={18} />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block">Select Store Location</span>
                <span className="text-[10px] text-slate-400 font-medium block">Click or search to set</span>
              </div>
            </div>

            {/* Search overlay */}
            <form onSubmit={handleSearch} className="absolute top-5 right-5 z-[1000] flex items-center gap-2 bg-[#0F172A]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/50 shadow-lg max-w-xs w-[240px] sm:w-[280px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store address..."
                className="w-full bg-transparent px-3 py-2 text-xs text-white outline-none font-medium placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-[#0097A7] hover:bg-[#00838F] text-white p-2.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
              </button>
            </form>

            {geocoding && (
              <div className="absolute bottom-5 left-5 z-[1000] bg-[#0097A7] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md animate-pulse">
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
          <div className="p-10 md:p-14 flex flex-col justify-between h-full w-full">
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
        )}
      </div>

      {/* Right Pane - Form */}
      <div className="w-full md:w-[58%] bg-white rounded-2xl shadow-lg md:h-[calc(100vh-64px)] overflow-y-auto p-6 sm:p-8 md:p-12">
        <div className="w-full min-h-full flex flex-col items-center py-4">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create Account</h1>
              <p className="text-gray-500 text-[15px]">Join NearX and start saving food & money</p>
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

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={form.fullName} 
                    onChange={handle('fullName')}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Enter full name"
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={handle('email')}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Enter email address"
                    required 
                    autoComplete="email" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    value={form.phone} 
                    onChange={handle('phone')}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Enter phone number" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    value={form.password} 
                    onChange={handle('password')}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Enter password"
                    required 
                    minLength={6} 
                    autoComplete="new-password" 
                  />
                </div>
              </div>

              {role === 'store' && (
                <div className="space-y-5 border-t border-gray-100 pt-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Store Name</label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={form.storeName} 
                        onChange={handle('storeName')}
                        style={{ paddingLeft: '3rem' }}
                        className="input-premium bg-gray-50 focus:bg-white w-full"
                        placeholder="Enter store name"
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}

              {(role === 'store' || role === 'customer') && (
                <div className="space-y-5 border-t border-gray-100 pt-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">{role === 'store' ? 'Store Address' : 'Full Address'}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={form.storeAddress} 
                        onChange={handle('storeAddress')}
                        style={{ paddingLeft: '3rem' }}
                        className="input-premium bg-gray-50 focus:bg-white w-full"
                        placeholder="Enter full address"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
                      <input 
                        type="text" 
                        value={form.city} 
                        onChange={handle('city')}
                        className="input-premium bg-gray-50 focus:bg-white w-full"
                        placeholder="Enter city"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Pincode</label>
                      <input 
                        type="text" 
                        value={form.pincode} 
                        onChange={handle('pincode')}
                        className="input-premium bg-gray-50 focus:bg-white w-full"
                        placeholder="Enter pincode"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 font-medium bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <span>Coordinates: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span>
                    <span className="text-[#0097A7] font-semibold">{role === 'store' ? 'Set on map (left side)' : 'Used for delivery routing'}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 rounded-xl text-[15px] mt-4"
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

            <p className="text-center mt-10 text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0097A7] hover:text-[#00838F] font-semibold transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
