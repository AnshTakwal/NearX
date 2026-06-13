import { orders } from '../../data/mockData';
import AssignedOrderCard from '../../components/delivery/AssignedOrderCard';

export default function MyOrders() {
    // Filter orders assigned to delivery person
    const deliveryOrders = orders.filter(
        (o) => o.deliveryPersonId === 'delivery-1' && o.status !== 'placed'
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">My Deliveries</h1>
                <p className="text-gray-500 text-sm">
                    {deliveryOrders.length} order{deliveryOrders.length !== 1 ? 's' : ''} assigned to you
                </p>
            </div>

            {deliveryOrders.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-6xl mb-4">🚴</p>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">No deliveries right now</h2>
                    <p className="text-gray-400 text-sm">New orders will appear here when assigned to you</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveryOrders.map((order) => (
                        <AssignedOrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
