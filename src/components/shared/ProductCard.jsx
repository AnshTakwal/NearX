import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import SafetyBadge from './SafetyBadge';
import DiscountBadge from './DiscountBadge';
import { useCart } from '../../hooks/useCart';
import { toast } from '../shared/Toast';

export default function ProductCard({ product }) {
  const { id, name, brand, mrp, sale_price, expiry_date, discount_percent, image_url, stock } = product;
  const { addToCart } = useCart();

  // Calculate days left
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiry_date);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const formattedMrp = (mrp / 100).toFixed(0);
  const formattedSalePrice = (sale_price / 100).toFixed(0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0) {
      toast.error('Item is out of stock!');
      return;
    }
    const success = addToCart(product, 1);
    if (success) {
      toast.success(`${name} added to cart!`);
    }
  };

  return (
    <Link 
      to={`/product/${id}`} 
      className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1.5 border border-slate-100/85 p-3.5 transition-all duration-300 group flex flex-col relative overflow-hidden h-full min-h-[310px] justify-between"
    >
      <div>
        {/* Discount Badge */}
        <div className="absolute top-3 right-3 z-10">
          <DiscountBadge discount={discount_percent} />
        </div>
        
        {/* Product Image */}
        <div className="w-full h-36 bg-slate-50/50 rounded-2xl mb-3 overflow-hidden relative border border-slate-100/60 flex items-center justify-center">
          {image_url && image_url.length > 2 ? (
            <img 
              src={image_url} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-555"
              onError={(e) => { 
                e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop";
              }}
            />
          ) : (
            <div className="text-3xl select-none">📦</div>
          )}
          {stock <= 0 && (
            <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px] flex items-center justify-center text-white font-bold rounded-2xl text-xs uppercase tracking-wider">
              Out of Stock
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">{brand || 'Generic'}</p>
          <h3 className="text-[14px] font-bold text-[#1A1A2E] leading-snug line-clamp-2 group-hover:text-[#00BCD4] transition-colors">{name}</h3>
          
          <div>
            <SafetyBadge days={daysLeft} />
          </div>
        </div>
      </div>

      {/* Pricing and Action */}
      <div className="pt-2 border-t border-slate-100/60 mt-3 space-y-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-black text-[#1A1A2E]">₹{formattedSalePrice}</span>
          <span className="text-[11px] text-slate-400 line-through">₹{formattedMrp}</span>
        </div>
        <button 
          onClick={handleAddToCart}
          disabled={stock <= 0}
          className="w-full btn-primary !py-2.5 !rounded-lg text-xs"
        >
          <ShoppingCart size={13} />
          <span>Add to Cart</span>
        </button>
      </div>
    </Link>
  );
}
