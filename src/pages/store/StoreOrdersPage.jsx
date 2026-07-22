import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertTriangle, Package } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStoreByOwner } from '../../api/stores';
import { getStoreOrders, updateOrderStatus } from '../../api/orders';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/shared/Toast';

export default function StoreOrdersPage() {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const storeData = await getStoreByOwner(user.id);
        setStore(storeData);
        if (storeData) {
          const data = await getStoreOrders(storeData.id);
          setOrders(data);
        }
      } catch (err) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Realtime subscription for orders & delivery updates
  useEffect(() => {
    if (!store) return;

    const loadOrders = async () => {
      try {
        const data = await getStoreOrders(store.id);
        setOrders(data);
      } catch (err) {
        console.error(err);
      }
    };

    const ordersChannel = supabase
      .channel(`store-orders-changes-${store.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${store.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast.success(`New Order Received!`);
          if (Notification.permission === 'granted') {
            new Notification("New Order Received!");
          }
        }
        loadOrders();
      })
      .subscribe();

    const assignmentsChannel = supabase
      .channel(`store-assignments-changes-${store.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_assignments'
      }, () => {
        loadOrders();
      })
      .subscribe();

    // Request notification permission if not asked
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [store]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
      toast.success("Order status updated");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]"><Loader2 className="animate-spin text-[#0097A7] w-10 h-10" /></div>;
  }

  if (!store) {
    return (
      <div className="bg-[#F7F8FA] min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] bg-[#0097A7]/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-6">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
            <p className="text-gray-500 text-sm mb-6">You need to set up your store profile before you can view orders.</p>
            <a href="/store/dashboard" className="w-full btn-primary h-[48px] rounded-xl flex items-center justify-center gap-2">
              Go to Dashboard Setup
            </a>
          </div>
        </div>
      </div>
    );
  }


  const statuses = ['All', 'placed', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  
  const filteredOrders = orders.filter(o => filter === 'All' || o.status === filter);

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 w-full flex flex-col items-center">
      <div className="container-premium">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage customer orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2 -mx-6 px-6 md:mx-0 md:px-0">
          {statuses.map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)}
              className={`whitespace-nowrap px-6 py-3 rounded-xl font-medium text-sm transition-all capitalize shadow-sm border active:scale-95 ${
                filter === status 
                  ? 'bg-gray-900 text-white border-gray-900' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#0097A7] hover:text-[#0097A7]'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-12 text-center flex flex-col items-center">
               <Package className="w-12 h-12 text-gray-300 mb-4" />
               <p className="text-gray-500 font-medium">No orders found matching this filter.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Order ID / Date</p>
                    <p className="font-bold text-gray-900 font-mono text-[15px]">{order.id.split('-')[0]}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Customer</p>
                    <p className="font-semibold text-gray-900 text-[15px]">{order.profiles?.full_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{order.profiles?.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Order Details</p>
                    <p className="font-bold text-gray-900 text-[15px]">₹{(order.total / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{order.order_items?.length} items</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Delivery Partner</p>
                    {order.delivery_assignments?.[0] ? (
                      <>
                        <p className="font-semibold text-gray-900 text-[15px]">{order.delivery_assignments[0].profiles?.full_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{order.delivery_assignments[0].profiles?.phone || 'N/A'}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not assigned yet</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start lg:items-end gap-4 min-w-[200px] border-t border-gray-100 lg:border-t-0 pt-6 lg:pt-0">
                   <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-block capitalize tracking-wide ${
                      order.status === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                      order.status === 'placed' ? 'bg-[#E0F7FA] text-[#0097A7] border border-[#B2EBF2]' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      Current: {order.status.replace(/_/g, ' ')}
                    </span>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      {order.status === 'placed' && (
                        <>
                          <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} disabled={updatingId === order.id} className="flex-1 lg:flex-none px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold text-sm transition-colors border border-red-100">Reject</button>
                          <button onClick={() => handleUpdateStatus(order.id, 'accepted')} disabled={updatingId === order.id} className="flex-1 lg:flex-none btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm">Accept Order</button>
                        </>
                      )}
                      {order.status === 'accepted' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'packed')} disabled={updatingId === order.id} className="w-full btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm">Mark as Packed</button>
                      )}
                      {order.status === 'packed' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')} disabled={updatingId === order.id} className="w-full btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm">Assign Delivery</button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <p className="text-sm text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">Awaiting partner delivery</p>
                      )}
                    </div>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
