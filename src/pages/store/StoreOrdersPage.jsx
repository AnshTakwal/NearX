import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
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

  // Realtime subscription for new orders
  useEffect(() => {
    if (!store) return;
    
    const channel = supabase
      .channel(`store-orders-${store.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${store.id}`
      }, async (payload) => {
        // Fetch full order to get joined data (profiles, items)
        try {
          const { data } = await supabase
            .from('orders')
            .select(`
              *,
              profiles!orders_customer_id_fkey (full_name, phone),
              order_items (id, product_name, quantity, unit_price, total_price)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            setOrders(prev => [data, ...prev]);
            toast.success(`New Order Received: ${data.id.split('-')[0]}`);
            if (Notification.permission === 'granted') {
              new Notification("New Order Received!", { body: `Order #${data.id.split('-')[0]} for ₹${data.total/100}` });
            }
          }
        } catch(e) { console.error(e) }
      })
      .subscribe();

    // Request notification permission if not asked
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00BCD4] w-10 h-10" /></div>;
  }

  const statuses = ['All', 'placed', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  
  const filteredOrders = orders.filter(o => filter === 'All' || o.status === filter);

  return (
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A2E]">Order Management</h1>
          <p className="text-slate-500 mt-1">Track and manage customer orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
        {statuses.map(status => (
          <button 
            key={status}
            onClick={() => setFilter(status)}
            className={`whitespace-nowrap px-5 py-2 rounded-xl font-medium transition-colors capitalize ${
              filter === status 
                ? 'bg-[#1A1A2E] text-white' 
                : 'bg-white border border-slate-200 text-slate-600 hover:border-[#00BCD4] hover:text-[#00BCD4]'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
            No orders found matching this filter.
          </div>
        )}
        
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Order ID / Date</p>
                <p className="font-bold text-[#1A1A2E] font-mono">{order.id.split('-')[0]}</p>
                <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 mb-1">Customer</p>
                <p className="font-semibold text-[#1A1A2E]">{order.profiles?.full_name}</p>
                <p className="text-sm text-slate-600">{order.profiles?.phone || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 mb-1">Order Details</p>
                <p className="font-semibold text-[#1A1A2E]">₹{(order.total / 100).toFixed(2)}</p>
                <p className="text-sm text-slate-600">{order.order_items?.length} items</p>
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-3 min-w-[200px] border-t lg:border-t-0 pt-4 lg:pt-0">
               <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block capitalize ${
                  order.status === 'delivered' ? 'bg-[#E8F5E9] text-[#22C55E]' :
                  order.status === 'placed' ? 'bg-[#E0F7FA] text-[#00BCD4]' :
                  order.status === 'cancelled' ? 'bg-[#FEF2F2] text-[#EF4444]' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  Current: {order.status.replace(/_/g, ' ')}
                </span>
                
                <div className="flex gap-2 w-full lg:w-auto">
                  {order.status === 'placed' && (
                    <>
                      <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} disabled={updatingId === order.id} className="flex-1 lg:flex-none px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors border border-red-200">Reject</button>
                      <button onClick={() => handleUpdateStatus(order.id, 'accepted')} disabled={updatingId === order.id} className="flex-1 lg:flex-none px-4 py-2 bg-[#00BCD4] text-white hover:bg-[#0097A7] rounded-lg font-medium text-sm transition-colors shadow-sm">Accept Order</button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'packed')} disabled={updatingId === order.id} className="w-full px-4 py-2 bg-[#00BCD4] text-white hover:bg-[#0097A7] rounded-lg font-medium text-sm transition-colors shadow-sm">Mark as Packed</button>
                  )}
                  {order.status === 'packed' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')} disabled={updatingId === order.id} className="w-full px-4 py-2 bg-[#00BCD4] text-white hover:bg-[#0097A7] rounded-lg font-medium text-sm transition-colors shadow-sm">Assign Delivery</button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <p className="text-sm text-slate-500 italic">Awaiting partner delivery</p>
                  )}
                </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
