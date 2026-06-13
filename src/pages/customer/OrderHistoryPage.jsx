import React from 'react';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';

export default function OrderHistoryPage() {
  const { orders, loading, error } = useOrders();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAFEFF]">
        <Loader2 className="w-8 h-8 text-[#00BCD4] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#FAFEFF] px-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-[#00BCD4] font-medium hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-[#1A1A2E] mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-6">When you place an order, it will appear here.</p>
          <Link to="/products" className="bg-[#00BCD4] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#0097A7] transition-colors inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const date = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            });
            const itemCount = order.order_items?.length || 0;
            
            return (
              <Link key={order.id} to={`/track/${order.id}`} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-[#00BCD4] transition-colors gap-4">
                <div className="flex items-center gap-5">
                  <div className="bg-[#E0F7FA] p-3 rounded-full text-[#00BCD4]">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E] mb-1 truncate max-w-[200px] sm:max-w-xs">{order.stores?.name}</p>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500">
                      <span>{date}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span>{itemCount} items</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="font-medium text-[#1A1A2E]">₹{(order.total / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'delivered' ? 'bg-[#E8F5E9] text-[#22C55E]' :
                    order.status === 'out_for_delivery' ? 'bg-[#FFFBEB] text-[#F59E0B]' :
                    order.status === 'cancelled' ? 'bg-[#FEF2F2] text-[#EF4444]' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <ChevronRight size={20} className="text-slate-400 group-hover:text-[#00BCD4] transition-colors hidden sm:block" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
