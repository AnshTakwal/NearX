import React from 'react';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';

export default function NeedsAttentionCard({ orders }) {
  const counts = {
    placed: 0,
    accepted: 0,
    packed: 0,
    out_for_delivery: 0,
  };

  orders.forEach((order) => {
    if (counts[order.status] !== undefined) {
      counts[order.status]++;
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Needs Attention</h3>
        <p className="text-sm text-gray-500">Orders in active fulfillment</p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Placed - Needs acceptance (High priority) */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full -mr-8 -mt-8"></div>
          <Clock size={24} className="text-amber-500 mb-2 relative z-10" />
          <p className="text-3xl font-extrabold text-amber-700 relative z-10">{counts.placed}</p>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mt-1 relative z-10">New Orders</p>
        </div>

        {/* Accepted - Needs packing */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center">
          <CheckCircle size={20} className="text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-gray-700">{counts.accepted}</p>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">To Pack</p>
        </div>

        {/* Packed - Needs delivery assignment */}
        <div className="bg-[#E0F7FA] rounded-xl p-4 border border-[#B2EBF2] flex flex-col items-center justify-center text-center">
          <Package size={20} className="text-[#00BCD4] mb-2" />
          <p className="text-2xl font-bold text-[#0097A7]">{counts.packed}</p>
          <p className="text-[10px] font-semibold text-[#0097A7] uppercase tracking-wider mt-1">Packed</p>
        </div>

        {/* Out for delivery */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center justify-center text-center">
          <Truck size={20} className="text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-700">{counts.out_for_delivery}</p>
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mt-1">Out for Delivery</p>
        </div>
      </div>
      
      {counts.placed > 0 && (
        <a href="/store/orders" className="mt-4 w-full bg-amber-100 text-amber-700 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors">
          Accept {counts.placed} Orders
        </a>
      )}
    </div>
  );
}
