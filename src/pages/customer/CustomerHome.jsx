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
    <div className="bg-[#FAFEFF] min-h-screen pb-24 md:pb-8 text-[#1A1A2E] w-full flex flex-col items-center">
      {/* Top Bar / Search Sticky Container */}
      <div className="bg-white/80 backdrop-blur-md sticky top-16 z-40 border-b border-slate-100 shadow-sm w-full flex justify-center">
        <div className="max-w-[1440px] w-full px-4 py-5 md:px-8 lg:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#E0F7FA] p-3 rounded-2xl text-[#00BCD4] shadow-sm active:scale-95 transition-transform">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Delivering to</p>
              <p className="text-[16px] font-extrabold text-[#1A1A2E] leading-tight">{profile?.full_name || 'Customer'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="text-slate-400 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
              <Search size={18} />
            </div>
            <form onSubmit={handleSearch} className="flex-1">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for fresh items, dairy, snacks..." 
                className="w-full bg-slate-50/70 px-4 py-3.5 rounded-2xl border border-slate-200 focus:bg-white focus:border-[#00BCD4] focus:outline-none focus:ring-4 focus:ring-cyan-50/50 transition-all text-sm font-medium"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] w-full px-4 md:px-8 lg:px-10 py-8 space-y-12">
        {/* Categories Horizontal Scroller */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Categories</h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-6 px-6 md:mx-0 md:px-0">
            {categories.map((cat, i) => {
              const icons = { All: '📦', Dairy: '🥛', Bakery: '🍞', Snacks: '🍿', Beverages: '🧃', Pantry: '🫙', Cleaning: '🧹' };
              const icon = icons[cat] || '🏷️';
              return (
                <Link 
                  key={i} 
                  to={cat === 'All' ? '/products' : `/products?category=${cat}`} 
                  className="whitespace-nowrap px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 border border-slate-100 hover:border-[#00BCD4] hover:text-[#00BCD4] bg-white shadow-sm hover:shadow flex items-center gap-2 active:scale-95"
                >
                  <span>{icon}</span>
                  <span>{cat}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Flash Deals Banner */}
        <div className="bg-gradient-to-br from-[#00BCD4] to-[#0097A7] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-lg shadow-cyan-100/40">
          <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10 md:w-2/3 space-y-4">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide backdrop-blur-md">
              <Timer size={14} /> Ends soon
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">Midnight Mega Sale</h2>
            <p className="text-white/80 text-sm md:text-md max-w-md leading-relaxed font-medium">
              Get up to 70% off on near-expiry essentials. Top quality checked items ready for delivery.
            </p>
            <div className="pt-2">
              <Link 
                to="/products?flash=true" 
                className="bg-white text-[#0097A7] px-8 py-3.5 rounded-2xl font-extrabold hover:bg-slate-50 active:scale-95 shadow-md hover:shadow-lg transition-all inline-block text-sm"
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
              <h2 className="text-2xl font-extrabold text-[#1A1A2E]">Trending Near You</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Directly sourced from trusted partner stores</p>
            </div>
            <Link to="/products" className="text-[#00BCD4] hover:text-[#0097A7] font-bold text-sm flex items-center gap-1 hover:underline transition-all">
              See all <ChevronRight size={16} />
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
