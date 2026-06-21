import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, CheckCircle2, Package, Loader2, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getActiveDeliveryOrder, updateDeliveryStatus, getDeliveryHistory, getAvailableDeliveryOrders, acceptDeliveryRequest } from '../../api/orders';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/shared/Toast';
import MapViewer from '../../components/shared/MapViewer';

export default function DeliveryDashboard() {
  const { user, profile } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rejected_deliveries') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const active = await getActiveDeliveryOrder(user.id);
        setActiveOrder(active);
        
        const hist = await getDeliveryHistory(user.id);
        setHistory(hist);

        if (!active) {
          const avail = await getAvailableDeliveryOrders();
          setAvailableOrders(avail);
        }
      } catch (err) {
        toast.error("Failed to load delivery data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);


  // Listen for new assignments
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`delivery-assignments-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_assignments',
        filter: `partner_id=eq.${user.id}`
      }, async (payload) => {
        // Only load if we don't have an active order
        if (!activeOrder) {
          try {
            const data = await getActiveDeliveryOrder(user.id);
            setActiveOrder(data);
            toast.info("New Delivery Assigned!");
            if (Notification.permission === 'granted') {
              new Notification("New Delivery Assigned!");
            }
          } catch(e){}
        }
      })
      .subscribe();

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => supabase.removeChannel(channel);
  }, [user, activeOrder]);

  // Listen for new available orders (orders being placed/updated)
  useEffect(() => {
    if (!user || activeOrder) return;

    const channel = supabase
      .channel('available-delivery-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, async () => {
        try {
          const avail = await getAvailableDeliveryOrders();
          setAvailableOrders(avail);
        } catch (e) {
          console.error(e);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, activeOrder]);

  const handleAccept = async (orderId) => {
    setUpdating(true);
    try {
      await acceptDeliveryRequest(orderId, user.id);
      toast.success("Delivery accepted!");
      
      const active = await getActiveDeliveryOrder(user.id);
      setActiveOrder(active);
      setAvailableOrders([]);
    } catch (err) {
      toast.error("Failed to accept delivery");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = (orderId) => {
    const updatedRejections = [...rejectedOrders, orderId];
    setRejectedOrders(updatedRejections);
    localStorage.setItem('rejected_deliveries', JSON.stringify(updatedRejections));
    toast.info("Delivery request hidden.");
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeOrder) return;
    setUpdating(true);
    try {
      await updateDeliveryStatus(activeOrder.id, newStatus);
      
      if (newStatus === 'delivered') {
        toast.success("Delivery completed successfully!");
        setHistory([{ ...activeOrder, status: 'delivered', delivered_at: new Date().toISOString() }, ...history]);
        setActiveOrder(null);
        
        // Reload available orders now that we are free
        const avail = await getAvailableDeliveryOrders();
        setAvailableOrders(avail);
      } else {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        setActiveOrder({ ...activeOrder, status: newStatus });
      }
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFEFF]"><Loader2 className="animate-spin text-[#00BCD4] w-10 h-10" /></div>;
  }

  const todayEarnings = history
    .filter(h => new Date(h.delivered_at).toDateString() === new Date().toDateString())
    .length * 40; // Flat ₹40 per delivery for demo

  return (
    <div className="bg-[#FAFEFF] min-h-[calc(100vh-64px)] pb-10">
      {/* Header */}
      <div className="bg-[#1A1A2E] text-white px-6 md:px-16 py-8 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <div>
            <p className="text-slate-400 text-sm mb-1">Partner Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h1 className="text-2xl font-bold">Online & Ready</h1>
            </div>
          </div>
          <div className="text-right">
             <p className="text-slate-400 text-sm mb-1">Today's Earnings</p>
             <h2 className="text-2xl font-bold text-[#00BCD4]">₹{todayEarnings}</h2>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Active Order */}
        <section>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Current Delivery</h2>
          
          {!activeOrder ? (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 mb-6">
                <Package size={40} className="text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-1">No active deliveries</h3>
                <p className="text-slate-500 text-sm">Stay online. Accepted orders will show up here.</p>
              </div>

              {/* Available requests list */}
              <div>
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">Available Delivery Requests</h2>
                {availableOrders.filter(o => !rejectedOrders.includes(o.id)).length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
                    <p className="text-slate-400 text-sm">No new delivery requests in your area right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {availableOrders.filter(o => !rejectedOrders.includes(o.id)).map((ord) => (
                      <div key={ord.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00BCD4]"></div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 font-mono">ORDER #{ord.id.split('-')[0]}</span>
                            <span className="text-sm font-bold text-[#00BCD4]">Payout: ₹40.00</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pickup</p>
                              <p className="font-semibold text-slate-700">{ord.stores?.name}</p>
                              <p className="text-xs text-slate-500">{ord.stores?.address}, {ord.stores?.city}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Deliver To</p>
                              <p className="font-semibold text-slate-700">{ord.profiles?.full_name}</p>
                              <p className="text-xs text-slate-500">{ord.addresses?.address_line || 'TBD'}, {ord.addresses?.city || 'Delhi'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-row md:flex-col justify-end items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 shrink-0">
                          <button
                            onClick={() => handleReject(ord.id)}
                            className="w-full md:w-32 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <X size={16} /> Ignore
                          </button>
                          <button
                            onClick={() => handleAccept(ord.id)}
                            disabled={updating}
                            className="w-full md:w-32 bg-[#00BCD4] hover:bg-[#0097A7] text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-100"
                          >
                            Accept <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (

            <div className="bg-white rounded-3xl shadow-sm border border-[#00BCD4] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00BCD4]"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-[#E0F7FA] text-[#0097A7] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                    {activeOrder.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-medium text-slate-500">Order #{activeOrder.order_id.split('-')[0]}</span>
                </div>

                {/* Pickup */}
                <div className="flex gap-4 mb-6 relative">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 z-10 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="absolute left-5 top-10 bottom-[-24px] w-0.5 bg-slate-200 z-0"></div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-1">Pickup From</p>
                    <p className="font-bold text-[#1A1A2E]">{activeOrder.orders.stores.name}</p>
                    <p className="text-sm text-slate-600 mb-3">{activeOrder.orders.stores.address}, {activeOrder.orders.stores.city}</p>
                    <div className="flex gap-2">
                      <a href={`tel:${activeOrder.orders.stores.phone}`} className="flex-1 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors py-2 gap-2 text-sm font-semibold">
                        <Phone size={16} /> Call Store
                      </a>
                    </div>
                  </div>
                </div>

                {/* Dropoff */}
                <div className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-full bg-[#00BCD4] flex items-center justify-center text-white z-10 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#00BCD4] font-bold tracking-wider uppercase mb-1">Deliver To</p>
                    <p className="font-bold text-[#1A1A2E]">{activeOrder.orders.profiles.full_name}</p>
                    <p className="text-sm text-slate-600 mb-3">{activeOrder.orders.addresses.address_line}, {activeOrder.orders.addresses.city}</p>
                    <div className="flex gap-2">
                      <a href={`tel:${activeOrder.orders.profiles.phone}`} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                        <Phone size={16} /> Call Customer
                      </a>
                    </div>
                  </div>
                </div>

                {/* Map Viewer */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-[#1A1A2E] mb-3">Route Map</h4>
                  <MapViewer 
                    markers={[
                      { lat: activeOrder.orders.stores.lat, lng: activeOrder.orders.stores.lng, popupText: `Pickup: ${activeOrder.orders.stores.name}` },
                      { lat: activeOrder.orders.addresses.lat || activeOrder.orders.stores.lat + 0.01, lng: activeOrder.orders.addresses.lng || activeOrder.orders.stores.lng + 0.01, popupText: `Dropoff: ${activeOrder.orders.profiles.full_name}` }
                    ]} 
                    className="w-full h-48"
                  />
                </div>

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  {activeOrder.status === 'assigned' && (
                    <button 
                      onClick={() => handleUpdateStatus('picked_up')}
                      disabled={updating}
                      className="w-full bg-[#1A1A2E] text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Pickup'}
                    </button>
                  )}
                  {activeOrder.status === 'picked_up' && (
                    <button 
                      onClick={() => handleUpdateStatus('in_transit')}
                      disabled={updating}
                      className="w-full bg-[#00BCD4] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0097A7] transition-colors shadow-sm disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto" /> : 'Start Delivery'}
                    </button>
                  )}
                  {activeOrder.status === 'in_transit' && (
                    <button 
                      onClick={() => handleUpdateStatus('delivered')}
                      disabled={updating}
                      className="w-full bg-[#22C55E] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto" /> : <><CheckCircle2 /> Mark as Delivered</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#1A1A2E]">Recent Deliveries</h2>
            <span className="text-sm font-medium text-[#00BCD4]">{history.length} total</span>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <p className="p-6 text-center text-slate-500">No completed deliveries yet.</p>
              ) : (
                history.slice(0, 5).map(h => (
                  <div key={h.id} className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#1A1A2E]">Order #{h.order_id.split('-')[0]}</p>
                      <p className="text-sm text-slate-500">{new Date(h.delivered_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#22C55E]">+₹40.00</p>
                      <p className="text-xs text-slate-500 font-medium">Earned</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
