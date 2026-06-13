import { useState } from 'react';
import { categories } from '../../data/mockData';
import { getDiscountInfo } from '../../utils/discountCalc';

export default function ProductForm({ onSubmit, initialData = null }) {
    const [form, setForm] = useState(
        initialData || {
            name: '',
            category: '',
            originalPrice: '',
            expiryDate: '',
            stock: '',
        }
    );

    const discountInfo = form.expiryDate ? getDiscountInfo(form.expiryDate) : null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(form);
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name</label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Greek Yogurt Pack"
                    className={inputClass}
                    required
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}
                    required
                >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Price and Stock row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Original Price (₹)</label>
                    <input
                        type="number"
                        name="originalPrice"
                        value={form.originalPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Quantity</label>
                    <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        className={inputClass}
                        required
                    />
                </div>
            </div>

            {/* Expiry Date */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className={inputClass}
                    required
                />
            </div>

            {/* Auto-calculated discount preview */}
            {discountInfo && (
                <div className={`rounded-xl p-4 ${discountInfo.bgColor} border border-current/10`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-bold ${discountInfo.textColor}`}>
                                Auto Discount: {discountInfo.discountPercent}% OFF
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {discountInfo.daysLeft} days until expiry
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${discountInfo.badgeColor}`}>
                            {discountInfo.badge}
                        </span>
                    </div>
                    {form.originalPrice && (
                        <p className="text-xs text-gray-500 mt-2">
                            Selling price: <span className="font-bold text-gray-700">
                                ₹{Math.round(form.originalPrice * (1 - discountInfo.discountPercent / 100) * 100) / 100}
                            </span>
                        </p>
                    )}
                </div>
            )}

            {/* Image upload placeholder */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Image</label>
                <div className="w-full h-32 bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue hover:text-blue transition-all cursor-pointer">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs font-medium">Click to upload image</span>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="w-full py-3 bg-blue hover:bg-blue-dark text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-blue/20 hover:shadow-lg hover:shadow-blue/30 border-none hover:-translate-y-0.5"
            >
                {initialData ? 'Update Product' : 'Add Product'}
            </button>
        </form>
    );
}
