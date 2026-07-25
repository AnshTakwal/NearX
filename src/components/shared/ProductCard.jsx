import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, AlertTriangle, Store, Ban } from 'lucide-react';
import SafetyBadge from './SafetyBadge';
import DiscountBadge from './DiscountBadge';
import { getDiscountInfo, getDiscountedPrice } from '../../utils/discountCalc';
import { useCart } from '../../hooks/useCart';
import { toast } from '../shared/Toast';

export default function ProductCard({ product }) {
  const { id, name, brand, mrp, expiry_date, image_url, stock } = product;
  const { addToCart } = useCart();

  // Dynamically calculate discount based on expiry date
  const discountInfo = getDiscountInfo(expiry_date);
  const daysLeft = discountInfo.daysLeft;
  const dynamicDiscountPercent = discountInfo.discountPercent;

  // Calculate sale price dynamically from MRP and dynamic discount
  const dynamicSalePrice = Math.round(mrp * (1 - dynamicDiscountPercent / 100));

  // Check if product is expired (discountCalc floors daysLeft to 0 when expired)
  const isExpired = daysLeft === 0;
  const isOutOfStock = stock <= 0;
  const isUnavailable = isExpired || isOutOfStock;

  const formattedMrp = (mrp / 100).toFixed(0);
  const formattedSalePrice = (dynamicSalePrice / 100).toFixed(0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnavailable) {
      if (isExpired) {
        toast.error('This item has expired and cannot be added to cart.');
      } else {
        toast.error('Item is out of stock!');
      }
      return;
    }
    const success = addToCart(product, 1);
    if (success) {
      toast.success(`${name} added to cart!`);
    }
  };

  // Dynamically resolve image URL if it's an emoji or missing
  const getImageUrl = (url, name, cat) => {
    if (url && url.includes('supabase.co')) return url;
    return 'https://ebhjyczbjldqufvxoeqm.supabase.co/storage/v1/object/public/product-images/products/placeholder-1784974879709.png';
  };

  const finalImageUrl = getImageUrl(image_url, name, product.category);

  const Wrapper = isExpired ? 'div' : Link;
  const wrapperProps = isExpired ? {} : { to: `/product/${id}` };

  return (
    <Wrapper
      {...wrapperProps}
      className={`bg-white rounded-[16px] shadow-sm hover:shadow-xl hover:-translate-y-1.5 border border-gray-100 p-4 transition-all duration-300 group flex flex-col relative overflow-hidden h-full min-h-[340px] justify-between ${
        isExpired
          ? 'opacity-70 grayscale-[0.5] !cursor-not-allowed hover:-translate-y-0 hover:shadow-sm'
          : ''
      }`}
    >
      <div className={isExpired ? 'pointer-events-none' : ''}>
        {/* Discount Badge */}
        <div className="absolute top-3.5 right-3.5 z-10">
          <DiscountBadge discount={dynamicDiscountPercent} />
        </div>

        {/* Expired Badge */}
        {isExpired && (
          <div className="absolute top-3.5 left-3.5 z-10 bg-gray-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
            <AlertTriangle size={12} />
            Expired
          </div>
        )}

        {/* Product Image */}
        <div className="w-full h-44 bg-gray-50 rounded-xl mb-4 overflow-hidden relative border border-gray-100 flex items-center justify-center">
          <img
            src={finalImageUrl}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isExpired ? '' : 'group-hover:scale-105'
            }`}
            onError={(e) => {
              e.target.src = "https://ebhjyczbjldqufvxoeqm.supabase.co/storage/v1/object/public/product-images/products/placeholder-1784974879709.png";
            }}
          />
          {isOutOfStock && !isExpired && (
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center text-white font-semibold rounded-xl text-xs uppercase tracking-wider">
              Out of Stock
            </div>
          )}
          {isExpired && (
            <div className="absolute top-0 left-0 w-full h-full bg-gray-900/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
          <span className="text-white font-bold text-sm bg-gray-900 px-6 py-2.5 rounded-full shadow-lg border border-gray-700">
            EXPIRED
          </span>
        </div>  )}
        </div>

        {/* Product Information */}
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2">
            <p className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase truncate">{brand || 'Generic'}</p>
            {product.stores?.name && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 max-w-[120px]">
                <Store size={10} className="shrink-0" />
                <span className="truncate">{product.stores.name}</span>
              </span>
            )}
          </div>
          <h3 className={`text-[15px] font-semibold leading-snug line-clamp-2 transition-colors ${
            isExpired ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary'
          }`}>{name}</h3>

          <div>
            <SafetyBadge days={Math.max(0, daysLeft)} />
          </div>
        </div>
      </div>

      {/* Pricing and Action */}
      <div className="pt-3 border-t border-gray-100 mt-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-black tracking-tight ${isExpired ? 'text-gray-400' : 'text-primary'}`}>₹{formattedSalePrice}</span>
          <span className="text-[13px] font-semibold text-gray-400 line-through">₹{formattedMrp}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className={`w-full py-4 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            isExpired
              ? 'bg-red-50 text-red-500 cursor-not-allowed border border-red-200'
              : isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-primary text-white hover:bg-primary-dark shadow-sm active:scale-95'
          }`}
        >
          {isExpired ? (
            <>
              <Ban size={16} strokeWidth={2.5} />
              <span>Expired</span>
            </>
          ) : isOutOfStock ? (
            <>
              <ShoppingCart size={14} />
              <span>Out of Stock</span>
            </>
          ) : (
            <>
              <ShoppingCart size={14} />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </Wrapper>
  );
}
