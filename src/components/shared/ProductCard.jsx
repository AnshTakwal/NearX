import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
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
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check if product is expired
  const isExpired = daysLeft < 0;
  const isOutOfStock = stock <= 0;
  const isUnavailable = isExpired || isOutOfStock;

  const formattedMrp = (mrp / 100).toFixed(0);
  const formattedSalePrice = (sale_price / 100).toFixed(0);

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
  const getImageUrl = (url, prodName, cat) => {
    const lowerName = prodName.toLowerCase();
    
    // Exact mapping for all DB products to guarantee accurate images (overrides DB fallback)
    if (lowerName.includes('juice')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Orangejuice.jpg/500px-Orangejuice.jpg';
    if (lowerName.includes('milk')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Glass_of_Milk_%2833657535532%29.jpg/500px-Glass_of_Milk_%2833657535532%29.jpg';
    if (lowerName.includes('cheese')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Cheese_platter.jpg/500px-Cheese_platter.jpg';
    if (lowerName.includes('curd') || lowerName.includes('yogurt')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Curd_Setting.jpg/500px-Curd_Setting.jpg';
    if (lowerName.includes('coffee')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Affogato_al_Caffe.jpg/500px-Affogato_al_Caffe.jpg';
    if (lowerName.includes('bread')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Korb_mit_Br%C3%B6tchen.JPG/500px-Korb_mit_Br%C3%B6tchen.JPG';
    if (lowerName.includes('croissant')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Croissant-Petr_Kratochvil.jpg/500px-Croissant-Petr_Kratochvil.jpg';
    if (lowerName.includes('apples')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Pink_lady_and_cross_section.jpg/500px-Pink_lady_and_cross_section.jpg';
    if (lowerName.includes('cookies') || lowerName.includes('choco')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Choco_chip_cookie.png/500px-Choco_chip_cookie.png';
    if (lowerName.includes('oats')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Rolled_oats.jpg/500px-Rolled_oats.jpg';
    if (lowerName.includes('salt') && !lowerName.includes('chips')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Salt_shaker_on_white_background.jpg/500px-Salt_shaker_on_white_background.jpg'; // Wiki salt
    if (lowerName.includes('chips')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Potato-Chips.jpg/500px-Potato-Chips.jpg'; // Wiki chips
    if (lowerName.includes('noodle')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Instant_noodles.jpg/500px-Instant_noodles.jpg'; // Wiki noodles
    if (lowerName.includes('clean') || lowerName.includes('wash')) return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop';

    if (url && url.startsWith('http')) return url;

    const fallbackMap = {
      'Dairy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Glass_of_Milk_%2833657535532%29.jpg/500px-Glass_of_Milk_%2833657535532%29.jpg',
      'Bakery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Korb_mit_Br%C3%B6tchen.JPG/500px-Korb_mit_Br%C3%B6tchen.JPG',
      'Beverages': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Orangejuice.jpg/500px-Orangejuice.jpg',
      'Snacks': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Potato-Chips.jpg/500px-Potato-Chips.jpg',
      'Pantry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Rolled_oats.jpg/500px-Rolled_oats.jpg',
      'Cleaning': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop'
    };

    return fallbackMap[cat] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';
  };

  const finalImageUrl = getImageUrl(image_url, name, product.category);

  return (
    <Link
      to={`/product/${id}`}
      className={`bg-white rounded-[16px] shadow-sm hover:shadow-xl hover:-translate-y-1.5 border border-gray-100 p-4 transition-all duration-300 group flex flex-col relative overflow-hidden h-full min-h-[340px] justify-between ${
        isExpired
          ? 'opacity-50 grayscale pointer-events-auto hover:-translate-y-0 hover:shadow-sm'
          : ''
      }`}
    >
      <div>
        {/* Discount Badge */}
        <div className="absolute top-3.5 right-3.5 z-10">
          <DiscountBadge discount={discount_percent} />
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
              e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop";
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
          <p className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase">{brand || 'Generic'}</p>
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
          disabled={isUnavailable}
          className={`w-full py-4 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            isExpired
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-accent text-white hover:bg-accent-dark shadow-sm active:scale-95'
          }`}
        >
          {isExpired ? (
            <>
              <AlertTriangle size={14} />
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
    </Link>
  );
}
