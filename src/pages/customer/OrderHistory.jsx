import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, Bike, PartyPopper, Package } from 'lucide-react';
import { orders } from '../../data/mockData';

const statusConfig = {
    placed: { label: 'Placed', color: 'bg-blue/10 text-blue', icon: ClipboardList },
    accepted: { label: 'Accepted', color: 'bg-emerald/10 text-emerald', icon: CheckCircle },
    picked_up: { label: 'In Transit', color: 'bg-amber/10 text-amber', icon: Bike },
    delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-500', icon: PartyPopper },
};

export default function OrderHistory() {
    // Filter to show only customer-1 orders
    const customerOrders = orders.filter((o) => o.customerId === 'customer-1');

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Order History</h1>

            {customerOrders.length === 0 ? (
                <div className="text-center py-16">
                    <p className="flex justify-center mb-4 text-gray-300"><Package size={60} strokeWidth={1} /></p>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">No orders yet</h2>
                    <p className="text-gray-400 text-sm mb-6">Start browsing deals to place your first order</p>
                    <Link
                        to="/"
                        className="inline-flex px-6 py-3 bg-blue text-white text-sm font-semibold rounded-2xl no-underline hover:bg-blue-dark transition-all shadow-sm shadow-blue/20 hover:-translate-y-0.5"
                    >
                        Browse Deals
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {customerOrders.map((order) => {
                        const config = statusConfig[order.status] || statusConfig.placed;
                        return (
                            <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue/20 transition-all no-underline group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-blue">#{order.id.split('-')[1]}</span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${config.color}`}>
                                            <config.icon size={14} /> {config.label}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{order.storeName}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-extrabold text-blue">₹{order.total}</span>
                                        <span className="text-gray-300 group-hover:text-blue transition-colors">→</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
