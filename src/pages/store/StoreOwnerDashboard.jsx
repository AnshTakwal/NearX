import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, IndianRupee, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStoreByOwner, getStoreAnalytics } from '../../api/stores';
import { getStoreOrders } from '../../api/orders';

export default function StoreOwnerDashboard() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00BCD4] w-10 h-10" /></div>;
  }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center">Please complete your store profile setup.</div>;
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
