import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Store, MapPin, Truck } from 'lucide-react';
import SafetyBadge from '../../components/shared/SafetyBadge';
import DiscountBadge from '../../components/shared/DiscountBadge';
import { getProductById } from '../../api/products';
import { useCart } from '../../hooks/useCart';
import { toast } from '../../components/shared/Toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock < qty) {
      toast.error('Not enough stock available');
      return;
    }
    const success = addToCart(product, qty);
    if (success) {
      toast.success('Added to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFEFF]">
        <div className="w-12 h-12 border-4 border-[#00BCD4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFEFF]">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="text-[#00BCD4] hover:underline">
          Browse Products
        </button>
      </div>
    );
  }

  const daysToExpiry = Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
  const discount = product.discount_percent;
  const salePrice = product.sale_price;

  return (
    <div className="bg-[#FAFEFF] min-h-screen py-8 pb-24 md:pb-8 text-[#1A1A2E] w-full flex flex-col items-center">
      <div className="max-w-[1440px] w-full px-4 md:px-8 lg:px-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-[#1A1A2E] mb-8 font-medium transition-colors w-fit">
          <ArrowLeft size={20} /> Back
        </button>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Image */}
          <div className="w-full lg:w-1/2">
            <div className="bg-slate-50 rounded-2xl p-8 aspect-square relative flex items-center justify-center">
              <div className="absolute top-6 right-6">
                <DiscountBadge discount={discount} />
              </div>
              <img 
                src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=500&fit=crop"} 
                alt={product.name} 
                className="w-full max-w-sm h-auto object-cover rounded-xl shadow-sm" 
              />
            </div>
          </div>

          {/* Details */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-2">
              <span className="text-[#00BCD4] font-semibold text-sm">{product.brand || product.category}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4 leading-tight">{product.name}</h1>
            
            <div className="mb-6">
              <SafetyBadge days={daysToExpiry} />
            </div>

            <div className="flex items-end gap-4 mb-8">
              <p className="text-4xl font-bold text-[#1A1A2E]">₹{(salePrice / 100).toFixed(2)}</p>
              <p className="text-xl text-slate-400 line-through mb-1">₹{(product.mrp / 100).toFixed(2)}</p>
              <p className="text-[#22C55E] font-semibold mb-1 ml-2">
                Save ₹{((product.mrp - salePrice) / 100).toFixed(2)}
              </p>
            </div>

            {product.description && (
              <p className="text-slate-600 mb-8">{product.description}</p>
            )}

            <div className="border-t border-b border-slate-100 py-6 mb-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Store size={20} className="text-[#00BCD4]" />
                <span className="font-medium">{product.stores?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={20} className="text-[#00BCD4]" />
                <span>{product.stores?.address}, {product.stores?.city}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Truck size={20} className="text-[#00BCD4]" />
                <span>Delivery available</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden h-14 w-full sm:w-32 flex-shrink-0">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <Minus size={18} />
                </button>
                <span className="flex-1 text-center font-semibold text-lg">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-[#00BCD4] text-white h-14 rounded-xl font-bold text-lg hover:bg-[#0097A7] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
            <p className="text-center sm:text-left text-sm text-slate-500 mt-4">
              {product.stock > 0 ? `Only ${product.stock} items left in stock!` : 'Currently unavailable'}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
