import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Loader2, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getOrderById } from '../../api/orders';
import { toast } from '../../components/shared/Toast';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Realtime subscription for order status & delivery assignments
  useEffect(() => {
    if (!id) return;
    
    const orderChannel = supabase
      .channel(`order-track-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`
      }, (payload) => {
        setOrder(prev => ({ ...prev, status: payload.new.status }));
        toast.info(`Order status updated to: ${payload.new.status}`);
      })
      .subscribe();

    const assignmentChannel = supabase
      .channel(`order-assignment-track-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_assignments',
        filter: `order_id=eq.${id}`
      }, async () => {
        try {
          const data = await getOrderById(id);
          setOrder(data);
          toast.success("Delivery partner updated!");
        } catch(e){}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(assignmentChannel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFEFF]">
        <Loader2 className="w-8 h-8 border-4 border-[#00BCD4] animate-spin text-[#00BCD4]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFEFF] text-center">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <Link to="/orders" className="text-[#00BCD4] hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const statuses = ['placed', 'accepted', 'packed', 'out_for_delivery', 'delivered'];
  const currentIndex = statuses.indexOf(order.status);
  
  const steps = [
    { label: "Order Placed", active: currentIndex >= 0, completed: currentIndex > 0 },
    { label: "Accepted by Store", active: currentIndex >= 1, completed: currentIndex > 1 },
    { label: "Packed", active: currentIndex >= 2, completed: currentIndex > 2 },
    { label: "Out for Delivery", active: currentIndex >= 3, completed: currentIndex > 3 },
    { label: "Delivered", active: currentIndex === 4, completed: currentIndex === 4 }
  ];

  if (order.status === 'cancelled') {
    return (
      <div className="bg-[#FAFEFF] min-h-screen py-8 text-center w-full flex flex-col items-center justify-center">
        <div className="max-w-[1440px] w-full px-4 md:px-8 lg:px-10">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Order Cancelled</h1>
          <Link to="/orders" className="text-[#00BCD4] hover:underline">Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFEFF] min-h-screen py-8 pb-24 md:pb-8 text-[#1A1A2E] w-full flex flex-col items-center">
      <div className="max-w-[1440px] w-full px-4 md:px-8 lg:px-10">
        <Link to="/orders" className="flex items-center gap-2 text-slate-500 hover:text-[#1A1A2E] mb-8 font-medium w-fit">
          <ArrowLeft size={20} /> Back to Orders
        </Link>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Order ID</p>
              <h1 className="text-lg sm:text-xl font-bold text-[#1A1A2E] font-mono break-all">{order.id}</h1>
              <p className="text-sm text-slate-500 mt-2">From: <span className="font-medium text-[#1A1A2E]">{order.stores?.name}</span></p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-slate-500 font-medium mb-1">Amount Paid</p>
              <h2 className="text-xl font-bold text-[#00BCD4]">₹{(order.total / 100).toFixed(2)}</h2>
            </div>
          </div>

          <div className="relative pl-6 py-4">
            <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-slate-100"></div>
            
            <div className="space-y-8 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-6 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-sm border-2 ${
                    step.completed ? 'bg-[#00BCD4] border-[#00BCD4] text-white' : 
                    step.active ? 'bg-white border-[#00BCD4] text-[#00BCD4]' : 
                    'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {step.completed ? <CheckCircle2 size={16} /> : <div className={`w-2.5 h-2.5 rounded-full ${step.active ? 'bg-[#00BCD4]' : 'bg-slate-300'}`}></div>}
                  </div>
                  <div className="pt-1">
                    <h3 className={`font-semibold text-lg leading-none ${step.active ? 'text-[#1A1A2E]' : 'text-slate-400'}`}>{step.label}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Partner Info */}
        {order.delivery_assignments?.[0] && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#00BCD4] flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#E0F7FA] flex items-center justify-center text-[#00BCD4] shrink-0 font-black">
              🚴
            </div>
            <div className="flex-1 text-center sm:text-left">
               <h3 className="text-xs text-[#00BCD4] font-bold uppercase tracking-wider">Delivery Partner Assigned</h3>
               <p className="font-bold text-[#1A1A2E] text-lg">{order.delivery_assignments[0].profiles?.full_name}</p>
               <p className="text-sm text-slate-500">Phone: {order.delivery_assignments[0].profiles?.phone || 'N/A'}</p>
            </div>
            {order.delivery_assignments[0].profiles?.phone && (
               <a href={`tel:${order.delivery_assignments[0].profiles.phone}`} className="bg-[#00BCD4] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#0097A7] transition-all flex items-center gap-2 text-sm shadow-sm shadow-cyan-100">
                 <Phone size={16} /> Call Partner
               </a>
            )}
          </div>
        )}

        {/* Store Info since we don't have delivery partner data attached simply here yet */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
             <h3 className="text-sm text-slate-500 font-medium">Store Support</h3>
             <p className="font-bold text-[#1A1A2E]">{order.stores?.name}</p>
             <p className="text-sm text-slate-500">{order.stores?.phone || 'No phone number available'}</p>
          </div>
          {order.stores?.phone && (
             <a href={`tel:${order.stores.phone}`} className="bg-[#E0F7FA] text-[#0097A7] px-4 py-2 rounded-xl font-semibold hover:bg-[#00BCD4] hover:text-white transition-colors flex items-center gap-2">
               <Phone size={16} /> Call Store
             </a>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
