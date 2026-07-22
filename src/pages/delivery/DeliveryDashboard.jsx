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
    return <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]"><Loader2 className="animate-spin text-[#0097A7] w-10 h-10" /></div>;
  }

  const todayEarnings = history
    .filter(h => new Date(h.delivered_at).toDateString() === new Date().toDateString())
    .length * 40; // Flat ₹40 per delivery for demo

  return (
    <div className="bg-[#F7F8FA] min-h-[calc(100vh-68px)] pb-10 w-full flex flex-col items-center">
      {/* Header */}
      <div className="bg-gray-900 text-white w-full shadow-md relative z-10 flex flex-col items-center pb-8 pt-8">
        <div className="container-premium flex justify-between items-center px-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Partner Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h1 className="text-xl md:text-2xl font-bold">Online & Ready</h1>
            </div>
          </div>
          <div className="text-right">
             <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Today's Earnings</p>
             <h2 className="text-xl md:text-2xl font-bold text-[#0097A7]">₹{todayEarnings}</h2>
          </div>
        </div>
      </div>

      <div className="container-premium mt-8 space-y-10 px-6">
        
        {/* Active Order */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Current Delivery</h2>
          
          {!activeOrder ? (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
                <Package size={40} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No active deliveries</h3>
                <p className="text-gray-500 text-sm font-medium">Stay online. Accepted orders will show up here.</p>
              </div>

              {/* Available requests list */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Available Delivery Requests</h2>
                {availableOrders.filter(o => !rejectedOrders.includes(o.id)).length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm font-medium">No new delivery requests in your area right now.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {availableOrders.filter(o => !rejectedOrders.includes(o.id)).map((ord) => (
                      <div key={ord.id} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between gap-6 relative overflow-hidden group hover:border-[#0097A7]/30 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#0097A7]"></div>
                        <div className="flex-1 space-y-5">
                          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <span className="text-xs font-bold text-gray-400 font-mono tracking-wider">ORDER #{ord.id.split('-')[0]}</span>
                            <span className="text-sm font-bold text-[#0097A7] bg-[#E0F7FA] px-3 py-1 rounded-full">Payout: ₹40.00</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[15px]">
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Pickup</p>
                              <p className="font-bold text-gray-800">{ord.stores?.name}</p>
                              <p className="text-sm text-gray-500 mt-1">{ord.stores?.address}, {ord.stores?.city}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Deliver To</p>
                              <p className="font-bold text-gray-800">{ord.profiles?.full_name}</p>
                              <p className="text-sm text-gray-500 mt-1">{ord.addresses?.address_line || 'TBD'}, {ord.addresses?.city || 'Delhi'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-row lg:flex-col justify-end items-center gap-3 border-t lg:border-t-0 pt-5 lg:pt-0 shrink-0">
                          <button
                            onClick={() => handleReject(ord.id)}
                            className="w-full lg:w-36 btn-secondary py-4 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <X size={16} /> Ignore
                          </button>
                          <button
                            onClick={() => handleAccept(ord.id)}
                            disabled={updating}
                            className="w-full lg:w-36 btn-primary py-4 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
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

            <div className="bg-white rounded-2xl shadow-sm border border-[#0097A7] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#0097A7]"></div>
              
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                  <span className="bg-[#E0F7FA] text-[#0097A7] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
                    {activeOrder.status?.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-gray-500 font-mono tracking-wider">ORDER #{activeOrder.order_id?.split('-')[0]}</span>
                </div>

                {/* Pickup */}
                <div className="flex gap-5 mb-8 relative">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 z-10 shrink-0 border border-gray-200">
                    <MapPin size={20} />
                  </div>
                  <div className="absolute left-6 top-12 bottom-[-32px] w-0.5 bg-gray-200 z-0"></div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1.5">Pickup From</p>
                    <p className="font-bold text-gray-900 text-lg">{activeOrder.orders?.stores?.name ?? 'Store'}</p>
                    <p className="text-sm text-gray-600 mb-4">{activeOrder.orders?.stores?.address ?? ''}{activeOrder.orders?.stores?.city ? `, ${activeOrder.orders.stores.city}` : ''}</p>
                    <div className="flex gap-3">
                      <a href={`tel:${activeOrder.orders?.stores?.phone ?? ''}`} className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-fit">
                        <Phone size={16} /> Call Store
                      </a>
                    </div>
                  </div>
                </div>

                {/* Dropoff */}
                <div className="flex gap-5 relative">
                  <div className="w-12 h-12 rounded-full bg-[#E0F7FA] border border-[#B2EBF2] flex items-center justify-center text-[#0097A7] z-10 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#0097A7] font-bold tracking-wider uppercase mb-1.5">Deliver To</p>
                    <p className="font-bold text-gray-900 text-lg">{activeOrder.orders?.profiles?.full_name ?? 'Customer'}</p>
                    <p className="text-sm text-gray-600 mb-4">{activeOrder.orders?.addresses?.address_line ?? 'Address not provided'}{activeOrder.orders?.addresses?.city ? `, ${activeOrder.orders.addresses.city}` : ''}</p>
                    <div className="flex gap-3">
                      <a href={`tel:${activeOrder.orders?.profiles?.phone ?? ''}`} className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-fit">
                        <Phone size={16} /> Call Customer
                      </a>
                    </div>
                  </div>
                </div>

                {/* Map Viewer */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <h4 className="text-[15px] font-bold text-gray-900 mb-4">Route Map</h4>
                  <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <MapViewer 
                      markers={[
                        { lat: activeOrder.orders?.stores?.lat ?? 28.6139, lng: activeOrder.orders?.stores?.lng ?? 77.2090, popupText: `Pickup: ${activeOrder.orders?.stores?.name ?? 'Store'}` },
                        { lat: activeOrder.orders?.addresses?.lat ?? (activeOrder.orders?.stores?.lat ?? 28.6139) + 0.01, lng: activeOrder.orders?.addresses?.lng ?? (activeOrder.orders?.stores?.lng ?? 77.2090) + 0.01, popupText: `Dropoff: ${activeOrder.orders?.profiles?.full_name ?? 'Customer'}` }
                      ]} 
                      className="w-full h-56"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  {activeOrder.status === 'assigned' && (
                    <button 
                      onClick={() => handleUpdateStatus('picked_up')}
                      disabled={updating}
                      className="w-full btn-primary py-4 rounded-xl font-bold text-lg"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Pickup'}
                    </button>
                  )}
                  {activeOrder.status === 'picked_up' && (
                    <button 
                      onClick={() => handleUpdateStatus('in_transit')}
                      disabled={updating}
                      className="w-full btn-primary py-4 rounded-xl font-bold text-lg"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto" /> : 'Start Delivery'}
                    </button>
                  )}
                  {activeOrder.status === 'in_transit' && (
                    <button 
                      onClick={() => handleUpdateStatus('delivered')}
                      disabled={updating}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="animate-spin mx-auto" /> : <><CheckCircle2 /> Mark as Delivered</>}
                    </button>
                  )}
                  {/* Fallback for unrecognised status */}
                  {!['assigned','picked_up','in_transit'].includes(activeOrder.status) && (
                    <p className="text-center text-gray-400 text-sm font-medium">Status: {activeOrder.status}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recent Deliveries</h2>
            <span className="text-sm font-bold text-[#0097A7] bg-[#E0F7FA] px-3 py-1 rounded-full">{history.length} total</span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <p className="p-8 text-center text-gray-400 font-medium">No completed deliveries yet.</p>
              ) : (
                history.slice(0, 5).map(h => (
                  <div key={h.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900 text-[15px]">Order #{h.order_id?.split('-')[0] ?? h.id?.split('-')[0]}</p>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">{h.delivered_at ? new Date(h.delivered_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Completed'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-[15px]">+₹40.00</p>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Earned</p>
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
