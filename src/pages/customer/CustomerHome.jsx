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
    <div className="bg-[#F8FAFC] min-h-screen pb-24 md:pb-8 text-[#1A1A2E] w-full flex flex-col items-center">
      {/* Top Bar / Search Sticky Container */}
      <div className="bg-white/85 backdrop-blur-md sticky top-16 z-40 border-b border-gray-150 shadow-sm w-full flex justify-center">
        <div className="container-premium py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#E0F7FA] p-2.5 rounded-xl text-[#0097A7] shadow-sm active:scale-95 transition-transform">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivering to</p>
              <p className="text-[15px] font-extrabold text-gray-800 leading-tight">{profile?.full_name || 'Customer'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="text-gray-400 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 shadow-inner flex-shrink-0">
              <Search size={16} />
            </div>
            <form onSubmit={handleSearch} className="flex-1">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for fresh items, dairy, snacks..." 
                className="input-premium !py-3.5 !rounded-xl text-xs font-semibold focus:bg-white"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="container-premium py-8 space-y-12">
        {/* Categories Horizontal Scroller */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4">Categories</h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-6 px-6 md:mx-0 md:px-0">
            {categories.map((cat, i) => {
              const icons = { All: '📦', Dairy: '🥛', Bakery: '🍞', Snacks: '🍿', Beverages: '🧃', Pantry: '🫙', Cleaning: '🧹' };
              const icon = icons[cat] || '🏷️';
              return (
                <Link 
                  key={i} 
                  to={cat === 'All' ? '/products' : `/products?category=${cat}`} 
                  className="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 border border-gray-200 hover:border-[#0097A7] hover:text-[#0097A7] bg-white shadow-sm hover:shadow-md flex items-center gap-2 active:scale-95"
                >
                  <span>{icon}</span>
                  <span>{cat}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Flash Deals Banner */}
        <div className="bg-gradient-to-br from-[#00BCD4] to-[#0097A7] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-lg shadow-[#0097A7]/10">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10 md:w-2/3 space-y-4">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              <Timer size={12} /> Ends soon
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">Midnight Mega Sale</h2>
            <p className="text-blue-100 text-xs md:text-sm max-w-md leading-relaxed font-semibold">
              Get up to 70% off on near-expiry essentials. Top quality checked items ready for delivery.
            </p>
            <div className="pt-2">
              <Link 
                to="/products?flash=true" 
                className="bg-white text-[#0097A7] px-6 py-3 rounded-xl font-black hover:bg-gray-50 active:scale-95 shadow-md hover:shadow-lg transition-all inline-block text-xs uppercase tracking-wider"
              >
                Shop Deals Now
              </Link>
            </div>
          </div>
        </div>

        {/* Near You */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-800">Trending Near You</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">Directly sourced from trusted partner stores</p>
            </div>
            <Link to="/products" className="text-[#0097A7] hover:text-[#00838F] font-bold text-xs flex items-center gap-0.5 hover:underline transition-all uppercase tracking-wider">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 h-80 animate-pulse">
                  <div className="w-full h-40 bg-slate-100 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded-lg w-1/2 mb-6"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-1/3"></div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-slate-400 font-semibold col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">No products found near you.</p>
            )}
          </div>
        </section>

        {/* Expiring Today */}
        {flashDeals.length > 0 && (
          <section className="border-t border-slate-100 pt-10">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#EF4444] flex items-center gap-2">
                  🔥 Last Chance Deals
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Expiring in less than 7 days, maximum discounts!</p>
              </div>
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
