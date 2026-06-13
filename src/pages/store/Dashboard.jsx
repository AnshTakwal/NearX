import { orders } from '../../data/mockData';
import StatCard from '../../components/store/StatCard';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    // Simulated stats for store-1
    const todayOrders = orders.filter((o) => o.storeId === 'store-1');
    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Store Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back! Here's your store overview.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    title="Total Orders Today"
                    value={todayOrders.length}
                    subtitle="+2 from yesterday"
                    icon="📦"
                    color="blue"
                />
                <StatCard
                    title="Revenue Saved"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    subtitle="From near-expiry deals"
                    icon="💰"
                    color="emerald"
                />
                <StatCard
                    title="Food Waste Prevented"
                    value="24.5 kg"
                    subtitle="This month"
                    icon="🌱"
                    color="amber"
                />
            </div>

            {/* Quick actions */}
            <div className="mb-8">
                <h2 className="text-base font-bold text-gray-800 mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                        to="/store/products/new"
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue/20 transition-all flex items-center gap-4 no-underline group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            ➕
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Add New Product</p>
                            <p className="text-xs text-gray-400">List near-expiry items for sale</p>
                        </div>
                    </Link>
                    <Link
                        to="/store/orders"
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue/20 transition-all flex items-center gap-4 no-underline group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            📋
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">View Orders</p>
                            <p className="text-xs text-gray-400">
                                {todayOrders.filter((o) => o.status === 'placed').length} pending orders
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent orders preview */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-800">Recent Orders</h2>
                    <Link to="/store/orders" className="text-sm text-blue font-semibold no-underline hover:underline">
                        View All →
                    </Link>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {todayOrders.slice(0, 3).map((order, idx) => (
                        <div
                            key={order.id}
                            className={`flex items-center justify-between px-5 py-4 hover:bg-blue/2 transition-colors ${idx < 2 ? 'border-b border-gray-50' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-blue">#{order.id.split('-')[1]}</span>
                                <span className="text-sm text-gray-600">{order.customerName}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">₹{order.total}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
