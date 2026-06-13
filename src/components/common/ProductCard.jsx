import { Link } from 'react-router-dom';
import { getDiscountInfo, getDiscountedPrice } from '../../utils/discountCalc';
import Badge from './Badge';

export default function ProductCard({ product, onAddToCart }) {
    const { discountPercent, badge, badgeColor, borderColor, daysLeft } = getDiscountInfo(product.expiryDate);
    const discountedPrice = getDiscountedPrice(product.originalPrice, discountPercent);

    return (
        <div
            className={`bg-white rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue/8 transition-all duration-300 overflow-hidden border border-gray-100 border-l-4 ${borderColor} group`}
        >
            <Link to={`/product/${product.id}`} className="block no-underline text-inherit">
                {/* Image placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-blue/5 to-blue/10 flex items-center justify-center overflow-hidden">
                    <div className="text-5xl opacity-50 group-hover:scale-110 transition-transform duration-300">
                        {product.category === 'Dairy' && '🥛'}
                        {product.category === 'Bakery' && '🍞'}
                        {product.category === 'Beverages' && '🧃'}
                        {product.category === 'Pantry' && '🫙'}
                        {product.category === 'Snacks' && '🍫'}
                        {product.category === 'Breakfast' && '🥣'}
                        {!['Dairy', 'Bakery', 'Beverages', 'Pantry', 'Snacks', 'Breakfast'].includes(product.category) && '📦'}
                    </div>

                    {/* Discount badge */}
                    <div className="absolute top-3 right-3">
                        <div className="bg-blue text-white text-sm font-extrabold px-3 py-1 rounded-xl shadow-md shadow-blue/30">
                            {discountPercent}% OFF
                        </div>
                    </div>

                    {/* Safety badge */}
                    <div className="absolute bottom-3 left-3">
                        <Badge label={badge} className={badgeColor} />
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-xs text-gray-400 font-medium mb-1">{product.category}</p>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 leading-snug">
                        {product.name}
                    </h3>

                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-xl font-extrabold text-blue">₹{discountedPrice}</span>
                        <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                            ⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                        </span>
                        <span className="text-xs text-gray-400">
                            📦 {product.stock} in stock
                        </span>
                    </div>
                </div>
            </Link>

            {/* Add to cart button */}
            {onAddToCart && (
                <div className="px-4 pb-4">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onAddToCart({
                                ...product,
                                discountPercent,
                                discountedPrice,
                            });
                        }}
                        className="w-full py-2.5 bg-blue hover:bg-blue-dark text-white text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer border-none shadow-sm shadow-blue/20 hover:shadow-md hover:shadow-blue/30 hover:-translate-y-0.5"
                    >
                        Add to Cart
                    </button>
                </div>
            )}
        </div>
    );
}
