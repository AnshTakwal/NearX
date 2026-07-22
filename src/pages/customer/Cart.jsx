import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import CartItem from '../../components/customer/CartItem';

export default function Cart({ cartItems, cartTotal, onUpdateQuantity, onRemove, onClearCart }) {
    const navigate = useNavigate();

    const handlePlaceOrder = () => {
        alert('🎉 Order placed successfully! This is a demo — no real order was created.');
        onClearCart();
        navigate('/orders');
    };

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <p className="flex justify-center mb-4 text-gray-300"><ShoppingCart size={60} strokeWidth={1} /></p>
                <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
                <p className="text-gray-400 text-sm mb-6">Browse deals and add items to get started</p>
                <Link
                    to="/"
                    className="inline-flex px-6 py-3 bg-blue text-white text-sm font-semibold rounded-2xl no-underline hover:bg-blue-dark transition-all shadow-sm shadow-blue/20 hover:-translate-y-0.5"
                >
                    Browse Deals
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900">Your Cart</h1>
                <span className="text-sm text-gray-400">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart items */}
                <div className="lg:col-span-2 space-y-3">
                    {cartItems.map((item) => (
                        <CartItem
                            key={item.id}
                            item={item}
                            onUpdateQuantity={onUpdateQuantity}
                            onRemove={onRemove}
                        />
                    ))}
                </div>

                {/* Order summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
                        <h3 className="text-base font-bold text-gray-800 mb-4">Order Summary</h3>

                        <div className="space-y-2 mb-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-500 truncate mr-2">
                                        {item.name} × {item.quantity}
                                    </span>
                                    <span className="text-gray-700 font-medium shrink-0">
                                        ₹{(item.discountedPrice * item.quantity).toFixed(0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 pt-3 mb-2">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="text-gray-700 font-medium">₹{cartTotal.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Delivery Fee</span>
                                <span className="text-emerald font-semibold">FREE</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 mb-5">
                            <div className="flex justify-between">
                                <span className="text-base font-bold text-gray-800">Total</span>
                                <span className="text-xl font-extrabold text-blue">₹{cartTotal.toFixed(0)}</span>
                            </div>
                            <p className="text-xs text-emerald font-semibold mt-1">
                                You save ₹{cartItems.reduce((s, i) => s + (i.originalPrice - i.discountedPrice) * i.quantity, 0).toFixed(0)}!
                            </p>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            className="w-full py-3.5 bg-blue hover:bg-blue-dark text-white text-sm font-semibold rounded-xl transition-all cursor-pointer border-none shadow-md shadow-blue/20 hover:shadow-lg hover:shadow-blue/30 hover:-translate-y-0.5"
                        >
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
