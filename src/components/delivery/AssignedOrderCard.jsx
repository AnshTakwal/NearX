import { useState } from 'react';
import { Package, Bike, Store, MapPin, CheckCircle } from 'lucide-react';

export default function AssignedOrderCard({ order }) {
    const [status, setStatus] = useState(order.status);

    const handlePickedUp = () => setStatus('picked_up');
    const handleDelivered = () => setStatus('delivered');

    const statusConfig = {
        accepted: { label: 'Ready for Pickup', color: 'bg-blue/10 text-blue', icon: Package },
        picked_up: { label: 'In Transit', color: 'bg-amber/10 text-amber', icon: Bike },
        delivered: { label: 'Delivered', color: 'bg-emerald/10 text-emerald', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.accepted;
    const StatusIcon = config.icon;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue to-blue-dark flex items-center justify-between">
                <div>
                    <span className="text-white/70 text-xs font-medium">Order</span>
                    <p className="text-white text-lg font-bold">#{order.id.split('-')[1]}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-white/20 text-white backdrop-blur-sm`}>
                    <StatusIcon size={14} /> {config.label}
                </span>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Store address */}
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center text-blue shrink-0"><Store size={16} /></div>
                    <div>
                        <p className="text-xs font-medium text-gray-400">Pickup from</p>
                        <p className="text-sm font-semibold text-gray-700">{order.storeName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.storeAddress}</p>
                    </div>
                </div>

                {/* Customer address */}
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center text-rose-500 shrink-0"><MapPin size={16} /></div>
                    <div>
                        <p className="text-xs font-medium text-gray-400">Deliver to</p>
                        <p className="text-sm font-semibold text-gray-700">{order.customerName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.customerAddress}</p>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Items</p>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                            <span className="text-sm text-gray-600">{item.name} × {item.quantity}</span>
                            <span className="text-sm font-semibold text-gray-700">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                        <span className="text-sm font-bold text-gray-700">Total</span>
                        <span className="text-sm font-extrabold text-blue">₹{order.total}</span>
                    </div>
                </div>

                {/* Action buttons */}
                {status !== 'delivered' && (
                    <div className="flex gap-3">
                        {status === 'accepted' && (
                            <button
                                onClick={handlePickedUp}
                                className="flex-1 py-3 bg-blue hover:bg-blue-dark text-white text-sm font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm shadow-blue/20 hover:shadow-md hover:shadow-blue/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <Bike size={16} /> Mark as Picked Up
                            </button>
                        )}
                        {status === 'picked_up' && (
                            <button
                                onClick={handleDelivered}
                                className="flex-1 py-3 bg-emerald hover:bg-emerald-dark text-white text-sm font-semibold rounded-xl transition-all cursor-pointer border-none shadow-sm shadow-emerald/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} /> Mark as Delivered
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
