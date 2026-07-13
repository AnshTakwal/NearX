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
      // Place order directly in DB (Cash on Delivery / Pay Later)
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
      <div className="bg-[#FAFEFF] min-h-[calc(100vh-64px)] px-6 py-16 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Trash2 size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 text-center max-w-sm">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="bg-[#00BCD4] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0097A7] transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 pb-32 md:pb-8 text-[#1F2937] w-full flex flex-col items-center">
      <div className="container-premium">
        <h1 className="text-3xl font-black text-gray-800 mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-150 mb-4 flex justify-between items-center">
            <span className="font-bold text-gray-700 text-sm">From: {storeName}</span>
            <button onClick={clearCart} className="text-xs font-bold text-red-550 hover:underline cursor-pointer">Clear Cart</button>
          </div>
          
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150 flex gap-4 items-center">
              <img src={item.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e"} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-slate-50 border border-gray-100" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm leading-snug">{item.name}</h3>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">{item.brand || item.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-black text-base text-gray-900">₹{(item.sale_price / 100).toFixed(0)}</span>
                  <span className="text-xs text-gray-450 line-through">₹{(item.mrp / 100).toFixed(0)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-[#EF4444] transition-colors p-1 cursor-pointer">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9 bg-white">
                  <button onClick={() => updateQuantity(item.id, item.cartQty - 1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"><Minus size={12} /></button>
                  <span className="w-8 text-center font-bold text-xs text-gray-850">{item.cartQty}</span>
                  <button onClick={() => updateQuantity(item.id, item.cartQty + 1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"><Plus size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-150 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-3">Order Summary</h2>
            
            {address ? (
              <div className="mb-6 p-4 bg-[#E0F7FA]/50 rounded-xl border border-[#B2EBF2]">
                <p className="text-[10px] font-bold text-[#0097A7] uppercase tracking-wider mb-1">Delivering to:</p>
                <p className="font-bold text-gray-800 text-sm">{address.label}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{address.address_line}, {address.city}</p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-semibold text-amber-800">No delivery address found.</p>
                <Link to="/profile" className="text-xs font-bold text-amber-700 hover:underline">Add address in Profile →</Link>
              </div>
            )}

            <div className="space-y-4 mb-6 text-sm font-semibold">
              <div className="flex justify-between text-gray-500">
                <span>Item Total</span>
                <span className="text-gray-800 font-bold">₹{((mrp - saved) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery Fee</span>
                <span className="text-gray-800 font-bold">₹{(deliveryFee / 100).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                <span className="font-bold text-gray-800">To Pay</span>
                <span className="font-black text-xl text-[#0097A7]">₹{(total / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-6 text-center font-bold text-xs uppercase tracking-wider">
              You're saving ₹{(saved / 100).toFixed(2)} on this order!
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={loading || !address}
              className="w-full btn-primary !py-3.5 !rounded-xl text-sm"
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
