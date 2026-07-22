import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Package, Calendar, Clock, Search } from 'lucide-react';
import { products, stores } from '../../data/mockData';
import { getDiscountInfo, getDiscountedPrice } from '../../utils/discountCalc';
import Badge from '../../components/common/Badge';

export default function ProductDetail({ onAddToCart }) {
    const { id } = useParams();
    const product = products.find((p) => p.id === id);

    if (!product) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-500 font-medium">Product not found</p>
                <Link to="/" className="text-blue font-semibold text-sm mt-2 inline-block">← Back to Home</Link>
            </div>
        );
    }

    const store = stores.find((s) => s.id === product.storeId);
    const { discountPercent, badge, badgeColor, borderColor, daysLeft, bgColor, textColor } = getDiscountInfo(product.expiryDate);
    const discountedPrice = getDiscountedPrice(product.originalPrice, discountPercent);

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link to="/" className="hover:text-blue transition-colors no-underline text-gray-400">Home</Link>
                <span>/</span>
                <span className="text-gray-600 font-medium">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image */}
                <div className={`relative h-72 sm:h-96 bg-gradient-to-br from-blue/5 to-blue/10 rounded-3xl flex items-center justify-center border border-gray-100 border-l-4 ${borderColor}`}>
                    <span className="text-gray-300">
                        <Package size={100} strokeWidth={1} />
                    </span>
                    <div className="absolute top-4 right-4">
                        <div className="bg-blue text-white text-xl font-extrabold px-4 py-2 rounded-2xl shadow-md shadow-blue/30">
                            {discountPercent}% OFF
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge label={badge} className={badgeColor} />
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-400">{daysLeft} days left</span>
                    </div>

                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-sm text-gray-400 mb-4">{product.category}</p>

                    <div className="flex items-end gap-3 mb-6">
                        <span className="text-4xl font-extrabold text-blue">₹{discountedPrice}</span>
                        <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
                        <span className={`text-sm font-bold ${textColor}`}>Save ₹{(product.originalPrice - discountedPrice).toFixed(0)}</span>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>

                    {/* Expiry info card */}
                    <div className={`rounded-2xl p-4 mb-6 ${bgColor}`}>
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl ${textColor}`}><Calendar size={28} /></span>
                            <div>
                                <p className={`text-sm font-bold ${textColor}`}>Expires: {new Date(product.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{daysLeft} days remaining • Auto-discount applied</p>
                            </div>
                        </div>
                    </div>

                    {/* Store info */}
                    {store && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center text-blue"><Store size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700">{store.name}</p>
                                    <p className="text-xs text-gray-400">{store.address} • {store.distance}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stock */}
                    <p className="text-sm text-gray-400 mb-4 flex items-center gap-2"><Package size={16} /> {product.stock} units in stock</p>

                    {/* Add to cart */}
                    <button
                        onClick={() =>
                            onAddToCart({
                                ...product,
                                discountPercent,
                                discountedPrice,
                            })
                        }
                        className="w-full py-4 bg-blue hover:bg-blue-dark text-white text-base font-semibold rounded-2xl transition-all cursor-pointer border-none shadow-lg shadow-blue/20 hover:shadow-xl hover:shadow-blue/30 hover:-translate-y-0.5"
                    >
                        Add to Cart — ₹{discountedPrice}
                    </button>
                </div>
            </div>
        </div>
    );
}
