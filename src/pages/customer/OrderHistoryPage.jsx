import React from 'react';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';

/**
 * Formats order_items into a compact summary string.
 * Shows up to 2 item names, then "+N more" for the remainder.
 * e.g. ["Milk 1L", "Bread", "Eggs", "Butter"] → "Milk 1L, Bread, +2 more"
 */
function formatItemNames(items = [], max = 2) {
  if (!items || items.length === 0) return 'No items';
  const names = items.map(i => i.product_name).filter(Boolean);
  if (names.length === 0) return `${items.length} items`;
  if (names.length <= max) return names.join(', ');
  return `${names.slice(0, max).join(', ')}, +${names.length - max} more`;
}

export default function OrderHistoryPage() {
  const { orders, loading, error } = useOrders();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex items-center justify-center bg-[#F7F8FA]">
        <Loader2 className="w-8 h-8 text-[#0097A7] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center bg-[#F7F8FA] px-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-[#0097A7] font-medium hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 pb-24 md:pb-8 text-gray-900 w-full flex flex-col items-center">
      <div className="container-premium">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center border border-gray-100 shadow-sm">
            <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
            <Link to="/products" className="btn-primary px-6 py-3 rounded-xl text-sm inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              });
              
              return (
                <Link key={order.id} to={`/track/${order.id}`} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-[#0097A7] transition-all gap-4">
                  <div className="flex items-center gap-5">
                    <div className="bg-[#E0F7FA] p-3 rounded-xl text-[#0097A7]">
                      <Package size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1 truncate max-w-[200px] sm:max-w-xs">{order.stores?.name}</p>
                      <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500">
                        <span>{date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="truncate max-w-[180px]">{formatItemNames(order.order_items)}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="font-semibold text-gray-800">₹{(order.total / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                      order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                      order.status === 'out_for_delivery' ? 'bg-amber-50 text-amber-600' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-[#0097A7] transition-colors hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
