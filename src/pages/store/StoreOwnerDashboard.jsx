import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, IndianRupee, Loader2, MapPin, Store, Phone, Globe, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStoreByOwner, getStoreAnalytics, createStore } from '../../api/stores';
import { getStoreOrders } from '../../api/orders';
import { getProductsByStore } from '../../api/products';
import { supabase } from '../../lib/supabase';
import RevenueChart from '../../components/store/RevenueChart';
import TopProductsList from '../../components/store/TopProductsList';
import NeedsAttentionCard from '../../components/store/NeedsAttentionCard';
import LowStockAlert from '../../components/store/LowStockAlert';

export default function StoreOwnerDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
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
          setAllOrders(orders);
          setRecentOrders(orders.slice(0, 5)); // Show only latest 5

          const prods = await getProductsByStore(storeData.id);
          setInventory(prods);
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
        setAllOrders(orders);
        setRecentOrders(orders.slice(0, 5));
        const prods = await getProductsByStore(store.id);
        setInventory(prods);
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
      setAllOrders(orders);
      setRecentOrders(orders.slice(0, 5));

      const prods = await getProductsByStore(created.id);
      setInventory(prods);
    } catch (err) {
      console.error(err);
      setSetupError(err.message || 'Failed to set up store profile. Please try again.');
    } finally {
      setSetupSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]"><Loader2 className="animate-spin text-[#0097A7] w-10 h-10" /></div>;
  }

  if (!store) {
    return (
      <div className="bg-[#F7F8FA] min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 max-w-2xl w-full border border-gray-100 relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[#0097A7]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#0097A7]">
                <Store size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Store Setup</h1>
                <p className="text-gray-500 text-sm mt-0.5">Complete your store profile to start listing products</p>
              </div>
            </div>

            {setupError && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm py-3.5 px-4 rounded-xl font-medium">
                {setupError}
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Store Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={setupForm.name}
                    onChange={e => setSetupForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ paddingLeft: '3rem' }}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="e.g. Fresh Foods Mart"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Description (Optional)</label>
                <textarea
                  value={setupForm.description}
                  onChange={e => setSetupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-premium min-h-[100px] py-3"
                  placeholder="Tell customers about your store, specialty items, or hours."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      required
                      value={setupForm.phone}
                      onChange={e => setSetupForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ paddingLeft: '3rem' }}
                      className="input-premium bg-gray-50 focus:bg-white w-full"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Store Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={setupForm.address}
                      onChange={e => setSetupForm(prev => ({ ...prev, address: e.target.value }))}
                      style={{ paddingLeft: '3rem' }}
                      className="input-premium bg-gray-50 focus:bg-white w-full"
                      placeholder="Street, locality, landmark"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={setupForm.city}
                    onChange={e => setSetupForm(prev => ({ ...prev, city: e.target.value }))}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="Delhi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Pincode</label>
                  <input
                    type="text"
                    required
                    value={setupForm.pincode}
                    onChange={e => setSetupForm(prev => ({ ...prev, pincode: e.target.value }))}
                    className="input-premium bg-gray-50 focus:bg-white w-full"
                    placeholder="110001"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <MapPin size={16} className="text-[#0097A7]" />
                  <span>GPS: {setupForm.lat.toFixed(4)}, {setupForm.lng.toFixed(4)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="btn-secondary py-2.5 px-4 rounded-xl text-sm whitespace-nowrap"
                >
                  Detect My Location
                </button>
              </div>

              <button
                type="submit"
                disabled={setupSubmitting}
                className="w-full btn-primary py-4 rounded-xl text-[15px] mt-4"
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
    { label: "Total Revenue", value: `₹${((analytics?.totalRevenue || 0) / 100).toFixed(2)}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: analytics?.totalOrders || 0, icon: Package, color: "text-[#0097A7]", bg: "bg-[#E0F7FA]" },
    { label: "Expiring Soon (5 days)", value: analytics?.expiringSoon || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Food Waste Saved", value: `₹${((analytics?.totalSavings || 0) / 100).toFixed(2)}`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" }
  ];

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 w-full flex flex-col items-center">
      <div className="container-premium">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Store Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">{store.name}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <a href="/store/products" className="btn-secondary py-3 px-6 rounded-xl text-sm whitespace-nowrap hidden md:block">
              Manage Products
            </a>
            <a href="/store/products?action=add" className="btn-primary py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 flex-1 sm:flex-initial whitespace-nowrap">
              <Plus size={16} /> Add Product
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        {/* TODO: profit tracking needs a cost_price column on products — see database/migrations/add_cost_price.sql (not yet applied) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="card-premium border-l-4 border-l-[#0097A7] flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-medium uppercase tracking-wider text-[11px] mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 truncate max-w-[150px]">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RevenueChart storeId={store.id} initialData={analytics?.revenueTrend} />
          </div>
          <div className="space-y-6">
            <NeedsAttentionCard orders={allOrders} />
            <LowStockAlert products={inventory} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Recent Orders</h2>
                <a href="/store/orders" className="text-sm font-semibold text-[#0097A7] hover:text-[#00838F] hover:underline">View All</a>
              </div>
              
              <div className="overflow-x-auto">
            <table className="table-premium min-w-[600px]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-400 py-10">No orders yet.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono text-xs font-semibold text-gray-500">{order.id.split('-')[0]}...</td>
                      <td className="text-gray-700 font-semibold">{order.profiles?.full_name}</td>
                      <td className="font-bold text-gray-900">₹{(order.total / 100).toFixed(2)}</td>
                      <td>
                        <span className={`badge-premium ${
                          order.status === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                          order.status === 'placed' ? 'bg-[#E0F7FA] text-[#0097A7] border border-[#B2EBF2]' :
                          'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </div>
          <div>
            <TopProductsList products={analytics?.topProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}
