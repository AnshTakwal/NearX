import { useParams, Link } from 'react-router-dom';
import { orders } from '../../data/mockData';
import OrderStatusStepper from '../../components/customer/OrderStatusStepper';

export default function OrderTracking() {
    const { id } = useParams();
    const order = orders.find((o) => o.id === id);

    if (!order) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-500 font-medium">Order not found</p>
                <Link to="/orders" className="text-blue font-semibold text-sm mt-2 inline-block">← View all orders</Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link to="/orders" className="text-sm text-gray-400 hover:text-blue no-underline transition-colors">
                        ← Back to Orders
                    </Link>
                    <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Order #{order.id.split('-')[1]}</h1>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Placed on</p>
                    <p className="text-sm font-semibold text-gray-700">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* Status Stepper */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">Order Status</h2>
                <OrderStatusStepper status={order.status} />
            </div>

            {/* Order details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                <h3 className="text-base font-bold text-gray-800 mb-4">Order Details</h3>

                {/* Store */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center text-sm">🏪</div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700">{order.storeName}</p>
                        <p className="text-xs text-gray-400">{order.storeAddress}</p>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-700">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div className="flex justify-between pt-3 mt-1">
                        <span className="text-sm font-bold text-gray-700">Total</span>
                        <span className="text-lg font-extrabold text-blue">₹{order.total}</span>
                    </div>
                </div>
            </div>

            {/* Delivery address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-base font-bold text-gray-800 mb-3">Delivery Address</h3>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose/10 flex items-center justify-center text-sm">📍</div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700">{order.customerName}</p>
                        <p className="text-xs text-gray-400">{order.customerAddress}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
