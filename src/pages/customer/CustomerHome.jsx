import React, { useState } from 'react';
import { MapPin, Search, ChevronRight, Timer } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/shared/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerHome() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { products, loading } = useProducts({ maxDaysToExpiry: 30 });

  const categories = ["All", "Dairy", "Bakery", "Snacks", "Beverages", "Pantry", "Cleaning"];

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const flashDeals = products.filter(p => {
    const days = Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days < 7;
  });

  return (
    <div className="bg-[#F7F8FA] min-h-screen pb-24 md:pb-8 text-gray-900 w-full flex flex-col items-center">
      {/* Top Bar / Search */}
      <div className="bg-white/90 backdrop-blur-md sticky top-[68px] z-40 border-b border-gray-100 shadow-sm w-full flex justify-center">
        <div className="container-premium py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#E0F7FA] p-2.5 rounded-xl text-[#0097A7]">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Delivering to</p>
              <p className="text-[15px] font-semibold text-gray-800 leading-tight">{profile?.full_name || 'Customer'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-200 flex-shrink-0">
              <Search size={16} />
            </div>
            <form onSubmit={handleSearch} className="flex-1">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for fresh items, dairy, snacks..." 
                className="input-premium py-3 rounded-xl text-sm"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="container-premium py-8 space-y-14">
        {/* Categories */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">Categories</h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-6 px-6 md:mx-0 md:px-0">
            {categories.map((cat, i) => (
              <Link 
                key={i} 
                to={cat === 'All' ? '/products' : `/products?category=${cat}`} 
                className="whitespace-nowrap px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 border border-gray-200 hover:border-[#0097A7] hover:text-[#0097A7] bg-white shadow-sm hover:shadow-md flex items-center active:scale-95"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Flash Deals Banner */}
        <div className="bg-gradient-to-br from-[#0097A7] to-[#00838F] rounded-2xl p-8 md:p-12 text-white relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/8 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10 md:w-2/3 space-y-4">
            <div className="flex items-center gap-2 bg-white/15 w-fit px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <Timer size={12} /> Ends soon
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">Midnight Mega Sale</h2>
            <p className="text-white/80 text-sm md:text-[15px] max-w-md leading-relaxed">
              Get up to 70% off on near-expiry essentials. Top quality checked items ready for delivery.
            </p>
            <div className="pt-2">
              <Link 
                to="/products?flash=true" 
                className="bg-white text-[#0097A7] px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-50 active:scale-95 shadow-md hover:shadow-lg transition-all inline-block text-sm"
              >
                Shop Deals Now
              </Link>
            </div>
          </div>
        </div>

        {/* Near You */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Trending Near You</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1.5">Directly sourced from trusted partner stores</p>
            </div>
            <Link to="/products" className="text-[#0097A7] hover:text-[#00838F] font-semibold text-sm flex items-center gap-0.5 transition-all">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-80 animate-pulse">
                  <div className="w-full h-44 bg-gray-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2 mb-6"></div>
                  <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-gray-400 font-medium col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">No products found near you.</p>
            )}
          </div>
        </section>

        {/* Expiring Today */}
        {flashDeals.length > 0 && (
          <section className="border-t border-gray-100 pt-12">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold text-[#DC2626] flex items-center gap-2">
                  Last Chance Deals
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1.5">Expiring in less than 7 days, maximum discounts!</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {flashDeals.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
