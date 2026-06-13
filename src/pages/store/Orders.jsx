import { Link } from 'react-router-dom';
import { orders } from '../../data/mockData';
import OrderTable from '../../components/store/OrderTable';

export default function Orders() {
    // Filter to show store-1 orders
    const storeOrders = orders.filter((o) => o.storeId === 'store-1');

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="mb-6">
                <Link to="/store" className="text-sm text-gray-400 hover:text-blue no-underline transition-colors">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Incoming Orders</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Manage and respond to customer orders
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <OrderTable orders={storeOrders} />
            </div>
        </div>
    );
}
