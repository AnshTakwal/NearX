import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { placeOrder } from '../../api/orders';
import { getAddresses } from '../../api/addresses';
import { toast } from '../../components/shared/Toast';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, storeName, updateQuantity, removeFromCart, total, mrp, saved, deliveryFee, clearCart } = useCart();
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAddress() {
      if (user) {
        const addresses = await getAddresses(user.id);
        if (addresses && addresses.length > 0) {
          setAddress(addresses.find(a => a.is_default) || addresses[0]);
        }
      }
    }
    loadAddress();
  }, [user]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    if (!address) {
      toast.error('Please add a delivery address in your profile first');
      navigate('/profile');
      return;
    }
    
    setLoading(true);
    try {
      const newOrder = await placeOrder(cartItems, address.id, user.id);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/track/${newOrder.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save order. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#F7F8FA] min-h-[calc(100vh-68px)] px-6 py-16 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Trash2 size={28} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn-primary px-8 py-4 rounded-xl font-semibold">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 pb-32 md:pb-8 text-gray-900 w-full flex flex-col items-center">
      <div className="container-premium">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700 text-sm">From: {storeName}</span>
              <button onClick={clearCart} className="text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors cursor-pointer">Clear Cart</button>
            </div>
            
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                <img src={item.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e"} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-gray-50 border border-gray-100" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-[15px] leading-snug">{item.name}</h3>
                  <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1">{item.brand || item.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-base text-gray-900">₹{(item.sale_price / 100).toFixed(0)}</span>
                    <span className="text-xs text-gray-400 line-through">₹{(item.mrp / 100).toFixed(0)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-[#DC2626] transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-12 bg-white">
                    <button onClick={() => updateQuantity(item.id, item.cartQty - 1)} className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"><Minus size={13} /></button>
                    <span className="w-12 text-center font-semibold text-sm text-gray-800">{item.cartQty}</span>
                    <button onClick={() => updateQuantity(item.id, item.cartQty + 1)} className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"><Plus size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Order Summary</h2>
              
              {address ? (
                <div className="mb-6 p-4 bg-[#E0F7FA]/40 rounded-xl border border-[#B2EBF2]">
                  <p className="text-[10px] font-semibold text-[#0097A7] uppercase tracking-wider mb-1">Delivering to:</p>
                  <p className="font-semibold text-gray-800 text-sm">{address.label}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{address.address_line}, {address.city}</p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-amber-800">No delivery address found.</p>
                  <Link to="/profile" className="text-sm font-semibold text-amber-700 hover:underline">Add address in Profile →</Link>
                </div>
              )}

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Item Total</span>
                  <span className="text-gray-800 font-semibold">₹{((mrp - saved) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="text-gray-800 font-semibold">₹{(deliveryFee / 100).toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="font-semibold text-gray-800">To Pay</span>
                  <span className="font-bold text-xl text-[#0097A7]">₹{(total / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl mb-6 text-center font-semibold text-sm">
                You're saving ₹{(saved / 100).toFixed(2)} on this order!
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={loading || !address}
                className="w-full btn-primary py-4 rounded-xl text-[15px]"
              >
                {loading ? <><Loader2 size={18} className="animate-spin"/> Processing...</> : <><ArrowRight size={18} /> Proceed to Pay</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
