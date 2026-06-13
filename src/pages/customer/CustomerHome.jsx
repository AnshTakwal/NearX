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
  const { products, loading } = useProducts({ maxDaysToExpiry: 30 }); // Initial fetch

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
    <div className="bg-[#FAFEFF] min-h-screen pb-20 md:pb-0">
      {/* Top Bar */}
      <div className="bg-white px-6 py-4 sticky top-16 z-40 border-b border-slate-100 shadow-sm md:px-16 lg:px-24">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-[#E0F7FA] p-2 rounded-full text-[#00BCD4]">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[12px] text-slate-500 font-medium">Delivering to</p>
            <p className="text-[14px] font-bold text-[#1A1A2E]">{profile?.full_name || 'Customer'}</p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for groceries, brands..." 
            className="w-full bg-slate-50 pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00BCD4] focus:border-transparent transition-all"
          />
        </form>
      </div>

      <div className="px-6 md:px-16 lg:px-24 py-6 space-y-12">
        {/* Categories */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-6 px-6 md:mx-0 md:px-0">
          {categories.map((cat, i) => (
            <Link key={i} to={cat === 'All' ? '/products' : `/products?category=${cat}`} className={`whitespace-nowrap px-6 py-2.5 rounded-full font-medium transition-colors ${i === 0 ? 'bg-[#1A1A2E] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#00BCD4] hover:text-[#00BCD4]'}`}>
              {cat}
            </Link>
          ))}
        </div>

        {/* Flash Deals Banner */}
        <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 md:w-2/3">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
              <Timer size={16} /> Ends soon
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Midnight Mega Sale</h2>
            <p className="text-white/90 mb-6 text-lg">Up to 70% off on near-expiry essentials.</p>
            <Link to="/products?flash=true" className="bg-white text-[#0097A7] px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors inline-block">
              Shop Now
            </Link>
          </div>
        </div>

        {/* Near You */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Trending Near You</h2>
            <Link to="/products" className="text-[#00BCD4] font-semibold flex items-center hover:underline">
              See all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 h-80 animate-pulse">
                  <div className="w-full h-40 bg-slate-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
                  <div className="h-8 bg-slate-100 rounded w-1/3"></div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-slate-500 col-span-full">No products found near you.</p>
            )}
          </div>
        </section>

        {/* Expiring Today */}
        {flashDeals.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#EF4444] flex items-center gap-2">
                🔥 Expiring Very Soon
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
