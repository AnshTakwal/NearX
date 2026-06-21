import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import ProductCard from '../components/shared/ProductCard';
import { mockProducts } from '../data/mockData';

export default function LandingPage() {
  return (
    <div className="bg-[#FAFEFF] min-h-screen overflow-x-hidden text-[#1A1A2E]">
      {/* Hero Section */}
      <section className="relative w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-10 py-16 lg:py-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Glow Effects */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#00BCD4]/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0097A7]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#E0F7FA]/75 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-[#0097A7] uppercase tracking-wider mb-2">
            🌱 Smart Food Shopping
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1A1A2E] leading-[1.15] tracking-tight">
            Fresh Deals.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7]">Zero Waste.</span>
          </h1>
          <p className="text-md sm:text-lg md:text-xl text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Get premium groceries at massive discounts right before they expire. Save money while saving the planet.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
            <Link 
              to="/products" 
              className="bg-[#00BCD4] text-white px-10 py-4 rounded-2xl font-bold text-base hover:bg-[#0097A7] active:scale-95 transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              Shop Now
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/register" 
              className="border-2 border-slate-200 text-[#1A1A2E] hover:border-[#00BCD4] hover:text-[#00BCD4] px-10 py-4 rounded-2xl font-bold text-base hover:bg-[#E0F7FA]/40 active:scale-95 transition-all duration-300 flex items-center justify-center"
            >
              List Your Store
            </Link>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-lg relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#E0F7FA] to-[#00BCD4]/10 rounded-[3.5rem] rotate-3 transform scale-105 -z-10"></div>
          <div className="relative overflow-hidden bg-white p-5 rounded-[3.5rem] shadow-2xl border border-slate-100/80 transform -rotate-1 transition-transform hover:rotate-0 duration-500">
             <img 
               src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
               alt="Groceries" 
               className="rounded-[2.5rem] w-full h-auto object-cover aspect-square shadow-inner" 
             />
             <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/60 flex items-center gap-4">
                <div className="bg-[#E8F5E9] p-3.5 rounded-2xl text-[#22C55E] shadow-sm">
                  <Leaf size={22} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Food Saved</p>
                  <p className="text-2xl font-black text-[#1A1A2E]">2.4 Tons</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white relative">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] mb-4">How It Works</h2>
          <p className="text-slate-400 text-md sm:text-lg max-w-md mx-auto">Three simple steps to save money and reduce supermarket waste.</p>
        </div>
        
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-10 grid sm:grid-cols-2 md:grid-cols-3 gap-10 lg:gap-14">
          {[
            { step: 1, title: "Find Deals", desc: "Discover near-expiry products at huge discounts from local stores.", icon: Clock, color: "bg-amber-50 text-amber-500" },
            { step: 2, title: "Book Safely", desc: "All products are quality-checked and 100% safe to consume.", icon: ShieldCheck, color: "bg-emerald-50 text-emerald-500" },
            { step: 3, title: "Pickup or Delivery", desc: "Get it delivered fast or pick it up directly from the store.", icon: CheckCircle, color: "bg-cyan-50 text-cyan-500" }
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center group bg-[#FAFEFF]/60 hover:bg-white p-8 rounded-3xl border border-slate-100 hover:border-slate-200/60 hover:shadow-xl transition-all duration-300 relative">
              <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                <item.icon size={26} />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Stats */}
      <section className="relative px-4 md:px-8 lg:px-10 py-20 bg-gradient-to-r from-[#1A1A2E] to-[#111122] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00BCD4]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
          <div className="pt-6 md:pt-0">
            <p className="text-5xl font-black text-[#00BCD4] mb-2 tracking-tight">50K+</p>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Happy Customers</p>
          </div>
          <div className="pt-6 md:pt-0">
            <p className="text-5xl font-black text-[#00BCD4] mb-2 tracking-tight">₹2M+</p>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Money Saved</p>
          </div>
          <div className="pt-6 md:pt-0">
            <p className="text-5xl font-black text-[#00BCD4] mb-2 tracking-tight">100+</p>
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Partner Stores</p>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-10 py-24 bg-[#FAFEFF]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] mb-3">Featured Deals</h2>
            <p className="text-slate-400 text-md">Top discounts expiring soon near you.</p>
          </div>
          <Link to="/products" className="hidden sm:flex items-center gap-2 text-[#00BCD4] font-bold hover:text-[#0097A7] transition-all group">
            View All Deals 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProducts.slice(0, 4).map(product => {
            // Map mock product format to DB schema format
            const mappedProduct = {
              id: product.id,
              name: product.name,
              brand: product.brand,
              mrp: product.mrp * 100, // convert to paise
              sale_price: Math.round(product.mrp * (1 - (product.daysToExpiry < 7 ? 60 : product.daysToExpiry <= 15 ? 40 : 25) / 100)) * 100,
              discount_percent: product.daysToExpiry < 7 ? 60 : product.daysToExpiry <= 15 ? 40 : 25,
              expiry_date: new Date(Date.now() + product.daysToExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              image_url: product.image,
              stock: product.stock,
              store_id: 'ssssssss-ssss-ssss-ssss-ssssssssssss',
              store_name: product.store,
            };
            return <ProductCard key={mappedProduct.id} product={mappedProduct} />;
          })}
        </div>
        
        <div className="mt-10 text-center sm:hidden">
          <Link to="/products" className="inline-flex items-center gap-2 text-[#00BCD4] font-bold">
            View All Deals <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-16 px-6 md:px-16 lg:px-24 text-center">
        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00BCD4] to-[#0097A7] mb-4">NearX</p>
        <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">Saving food, saving money. One deal at a time.</p>
        <p className="text-xs text-slate-350">© 2026 NearX Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
