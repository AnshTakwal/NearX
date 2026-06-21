import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, IndianRupee, Loader2, MapPin, Store, Phone, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStoreByOwner, getStoreAnalytics, createStore } from '../../api/stores';
import { getStoreOrders } from '../../api/orders';
import { supabase } from '../../lib/supabase';

export default function StoreOwnerDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Store setup form state
  const [setupForm, setSetupForm] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Delhi',
    pincode: '',
    phone: '',
    lat: 28.6139,
    lng: 77.2090
  });
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const storeData = await getStoreByOwner(user.id);
        setStore(storeData);
        if (storeData) {
          const stats = await getStoreAnalytics(storeData.id);
          setAnalytics(stats);
          
          const orders = await getStoreOrders(storeData.id);
          setRecentOrders(orders.slice(0, 5)); // Show only latest 5
        }
      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Realtime subscription for dashboard updates
  useEffect(() => {
    if (!store) return;

    const reloadData = async () => {
      try {
        const stats = await getStoreAnalytics(store.id);
        setAnalytics(stats);
        const orders = await getStoreOrders(store.id);
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };

    const ordersChannel = supabase
      .channel(`store-dashboard-orders-${store.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${store.id}`
      }, () => {
        reloadData();
      })
      .subscribe();

    const assignmentsChannel = supabase
      .channel(`store-dashboard-assignments-${store.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_assignments'
      }, () => {
        reloadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [store]);


  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSetupForm(prev => ({
            ...prev,
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6))
          }));
        },
        (err) => {
          console.warn('Geolocation failed or denied:', err);
          alert('Could not detect location automatically. Using default coordinates.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupSubmitting(true);
    setSetupError('');
    try {
      const created = await createStore({
        owner_id: user.id,
        name: setupForm.name,
        description: setupForm.description || null,
        address: setupForm.address,
        city: setupForm.city,
        pincode: setupForm.pincode,
        phone: setupForm.phone || null,
        lat: parseFloat(setupForm.lat),
        lng: parseFloat(setupForm.lng),
        is_active: true
      });
      setStore(created);
      
      const stats = await getStoreAnalytics(created.id);
      setAnalytics(stats);
      
      const orders = await getStoreOrders(created.id);
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error(err);
      setSetupError(err.message || 'Failed to set up store profile. Please try again.');
    } finally {
      setSetupSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00BCD4] w-10 h-10" /></div>;
  }

  if (!store) {
    return (
      <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-12 flex items-center justify-center">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 max-w-2xl w-full border border-slate-100 relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#00BCD4]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#00BCD4]/10 border border-[#00BCD4]/30 flex items-center justify-center text-[#00BCD4]">
                <Store size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#1A1A2E]">Store Setup</h1>
                <p className="text-slate-500 mt-1">Complete your store profile to start listing products</p>
              </div>
            </div>

            {setupError && (
              <div className="mb-6 bg-red-50 border border-red-100 text-[#B91C1C] text-sm py-3.5 px-4 rounded-2xl font-medium">
                {setupError}
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={setupForm.name}
                    onChange={e => setSetupForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ paddingLeft: '3rem' }}
                    className="w-full pr-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium bg-[#F1F5F9]/60 transition-all duration-200"
                    placeholder="e.g. Fresh Foods Mart"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">Description (Optional)</label>
                <textarea
                  value={setupForm.description}
                  onChange={e => setSetupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium bg-[#F1F5F9]/60 transition-all duration-200 min-h-[100px]"
                  placeholder="Tell customers about your store, specialty items, or hours."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      required
                      value={setupForm.phone}
                      onChange={e => setSetupForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ paddingLeft: '3rem' }}
                      className="w-full pr-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium bg-[#F1F5F9]/60 transition-all duration-200"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-2">Store Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={setupForm.address}
                      onChange={e => setSetupForm(prev => ({ ...prev, address: e.target.value }))}
                      style={{ paddingLeft: '3rem' }}
                      className="w-full pr-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium bg-[#F1F5F9]/60 transition-all duration-200"
                      placeholder="Street, locality, landmark"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={setupForm.city}
                    onChange={e => setSetupForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium bg-[#F1F5F9]/60 transition-all duration-200"
                    placeholder="Delhi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-2">Pincode</label>
                  <input
                    type="text"
                    required
                    value={setupForm.pincode}
                    onChange={e => setSetupForm(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 h-14 rounded-2xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 text-sm font-medium bg-[#F1F5F9]/60 transition-all duration-200"
                    placeholder="110001"
                  />
                </div>
              </div>

              <div className="bg-slate-55 shadow-inner border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                  <MapPin size={16} className="text-[#00BCD4]" />
                  <span>GPS Coordinates: {setupForm.lat.toFixed(4)}, {setupForm.lng.toFixed(4)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="bg-white border border-slate-200 hover:border-[#00BCD4] hover:text-[#00BCD4] text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  Detect My Location
                </button>
              </div>

              <button
                type="submit"
                disabled={setupSubmitting}
                className="w-full bg-[#00BCD4] hover:bg-[#0097A7] text-white h-14 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
              >
                {setupSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating Store Profile...</>
                ) : (
                  <>
                    <span>Create Store Profile</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }


  const stats = [
    { label: "Total Revenue", value: `₹${((analytics?.totalRevenue || 0) / 100).toFixed(2)}`, icon: IndianRupee, color: "text-[#22C55E]", bg: "bg-[#E8F5E9]" },
    { label: "Total Orders", value: analytics?.totalOrders || 0, icon: Package, color: "text-[#00BCD4]", bg: "bg-[#E0F7FA]" },
    { label: "Expiring Soon (5 days)", value: analytics?.expiringSoon || 0, icon: AlertTriangle, color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
    { label: "Food Waste Saved", value: `₹${((analytics?.totalSavings || 0) / 100).toFixed(2)}`, icon: TrendingUp, color: "text-[#F59E0B]", bg: "bg-[#FFFBEB]" }
  ];

  return (
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A2E]">Store Dashboard</h1>
          <p className="text-slate-500 mt-1">{store.name}</p>
        </div>
        <a href="/store/products" className="bg-[#00BCD4] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#0097A7] transition-colors inline-block text-center">
          Manage Products
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#00BCD4] border-y border-r border-slate-100 relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${stat.bg} opacity-50`}></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium mb-1 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1A1A2E] truncate max-w-[150px]">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#1A1A2E]">Recent Orders</h2>
          <a href="/store/orders" className="text-[#00BCD4] font-medium hover:underline">View All</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-500">No orders yet.</td>
                </tr>
              )}
              {recentOrders.map((order, i) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-[#1A1A2E] font-mono text-sm">{order.id.split('-')[0]}...</td>
                  <td className="p-4 text-slate-600">{order.profiles?.full_name}</td>
                  <td className="p-4 font-semibold text-[#1A1A2E]">₹{(order.total / 100).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block capitalize ${
                      order.status === 'delivered' ? 'bg-[#E8F5E9] text-[#22C55E]' :
                      order.status === 'placed' ? 'bg-[#E0F7FA] text-[#00BCD4]' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
