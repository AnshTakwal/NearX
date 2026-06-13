import { useState } from 'react';

const statusColors = {
    placed: 'bg-blue/10 text-blue',
    accepted: 'bg-emerald/10 text-emerald',
    picked_up: 'bg-amber/10 text-amber',
    delivered: 'bg-gray-100 text-gray-500',
    rejected: 'bg-rose/10 text-rose',
};

const statusLabels = {
    placed: 'Placed',
    accepted: 'Accepted',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    rejected: 'Rejected',
};

export default function OrderTable({ orders: initialOrders }) {
    const [orders, setOrders] = useState(initialOrders);

    const handleAccept = (orderId) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'accepted' } : o))
        );
    };

    const handleReject = (orderId) => {
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'rejected' } : o))
        );
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-400 font-medium">No orders yet</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Order</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Customer</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Items</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Total</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Status</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-blue/2 transition-colors">
                            <td className="py-3 px-4">
                                <span className="text-sm font-bold text-blue">#{order.id.split('-')[1]}</span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm font-medium text-gray-700">{order.customerName}</span>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm text-gray-600">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-sm font-bold text-gray-800">₹{order.total}</span>
                            </td>
                            <td className="py-3 px-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || ''}`}>
                                    {statusLabels[order.status] || order.status}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                {order.status === 'placed' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(order.id)}
                                            className="px-3 py-1.5 bg-blue hover:bg-blue-dark text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border-none shadow-sm"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(order.id)}
                                            className="px-3 py-1.5 bg-rose/10 hover:bg-rose/20 text-rose text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-rose/20"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {order.status !== 'placed' && (
                                    <span className="text-xs text-gray-300">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
