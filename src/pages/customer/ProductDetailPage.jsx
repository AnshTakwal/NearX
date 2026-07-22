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
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="w-12 h-12 border-4 border-[#0097A7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/products')} className="text-[#0097A7] hover:underline font-medium">
          Browse Products
        </button>
      </div>
    );
  }

  const daysToExpiry = Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
  const discount = product.discount_percent;
  const salePrice = product.sale_price;

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 pb-24 md:pb-8 text-gray-900 w-full flex flex-col items-center">
      <div className="container-premium">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 font-medium transition-colors w-fit cursor-pointer py-2">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Image */}
            <div className="w-full lg:w-1/2">
              <div className="bg-gray-50 rounded-2xl p-8 aspect-square relative flex items-center justify-center border border-gray-100">
                <div className="absolute top-6 right-6">
                  <DiscountBadge discount={discount} />
                </div>
                <img 
                  src={product.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=500&fit=crop"} 
                  alt={product.name} 
                  className="w-full max-w-sm h-auto object-cover rounded-xl" 
                />
              </div>
            </div>

            {/* Details */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="mb-3">
                <span className="text-[#0097A7] font-semibold text-sm uppercase tracking-wider">{product.brand || product.category}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-tight">{product.name}</h1>
              
              <div className="mb-6">
                <SafetyBadge days={daysToExpiry} />
              </div>

              <div className="flex items-end gap-4 mb-8">
                <p className="text-3xl md:text-4xl font-bold text-gray-900">₹{(salePrice / 100).toFixed(0)}</p>
                <p className="text-lg text-gray-400 line-through mb-1">₹{(product.mrp / 100).toFixed(0)}</p>
                <p className="text-green-600 font-semibold mb-1 ml-2 text-sm">
                  Save ₹{((product.mrp - salePrice) / 100).toFixed(0)}
                </p>
              </div>

              {product.description && (
                <p className="text-gray-500 mb-8 leading-relaxed">{product.description}</p>
              )}

              <div className="border-t border-b border-gray-100 py-6 mb-8 space-y-4 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Store size={18} className="text-[#0097A7]" />
                  <span className="font-medium">{product.stores?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[#0097A7]" />
                  <span>{product.stores?.address}, {product.stores?.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-[#0097A7]" />
                  <span>Delivery available</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-[52px] w-full sm:w-36 flex-shrink-0 bg-white">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Minus size={16} />
                  </button>
                  <span className="flex-1 text-center font-semibold text-lg text-gray-800">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Plus size={16} />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full btn-primary py-4 rounded-xl text-[15px]"
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
              <p className="text-center sm:text-left text-xs text-gray-400 mt-4 font-medium">
                {product.stock > 0 ? `Only ${product.stock} items left in stock!` : 'Currently unavailable'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
