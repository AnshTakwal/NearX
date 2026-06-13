import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Clock } from 'lucide-react';
import ProductCard from '../components/shared/ProductCard';
import { mockProducts } from '../data/mockData';

export default function LandingPage() {
  return (
    <div className="bg-[#FAFEFF] min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="w-full max-w-screen-xl mx-auto px-6 md:px-16 lg:px-24 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1A1A2E] leading-tight tracking-tight">
            Fresh Deals.<br/>
            <span className="text-[#00BCD4]">Zero Waste.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed">
            Get premium groceries at massive discounts right before they expire. Save money while saving the planet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/products" className="bg-[#00BCD4] text-white px-8 py-3 rounded-xl font-semibold text-base hover:bg-[#0097A7] transition-all duration-200 shadow-md hover:shadow-lg min-h-[48px] flex items-center justify-center">
              Shop Now
            </Link>
            <Link to="/register" className="border-2 border-[#00BCD4] text-[#00BCD4] px-8 py-3 rounded-xl font-semibold text-base hover:bg-[#E0F7FA] transition-all duration-200 min-h-[48px] flex items-center justify-center">
              List Your Store
            </Link>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-lg relative">
          <div className="absolute inset-0 bg-[#E0F7FA] rounded-[3rem] rotate-3 transform scale-105 -z-10"></div>
          <div className="relative overflow-hidden bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100 transform -rotate-1 transition-transform hover:rotate-0 duration-500">
             <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" alt="Groceries" className="rounded-3xl w-full h-auto object-cover aspect-square" />
             <div className="absolute bottom-4 right-4 bg-white p-4 rounded-2xl shadow-lg border border-slate-50 flex items-center gap-4">
                <div className="bg-[#E8F5E9] p-3 rounded-full text-[#22C55E]">
                  <Leaf size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Food Saved</p>
                  <p className="text-xl font-bold text-[#1A1A2E]">2.4 Tons</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="mt-24 px-6 md:px-16 lg:px-24 py-24 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4">How It Works</h2>
          <p className="text-slate-500 text-lg">Three simple steps to save money and reduce waste.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {[
            { step: 1, title: "Find Deals", desc: "Discover near-expiry products at huge discounts from local stores.", icon: Clock },
            { step: 2, title: "Book Safely", desc: "All products are quality-checked and 100% safe to consume.", icon: ShieldCheck },
            { step: 3, title: "Pickup or Delivery", desc: "Get it delivered fast or pick it up directly from the store.", icon: ArrowRight }
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-[#E0F7FA] text-[#00BCD4] rounded-full flex items-center justify-center text-2xl font-bold mb-6 group-hover:bg-[#00BCD4] group-hover:text-white transition-colors">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Stats */}
      <section className="px-6 md:px-16 lg:px-24 py-20 bg-[#1A1A2E] text-white">
        <div className="grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="pt-6 md:pt-0">
            <p className="text-5xl font-bold text-[#00BCD4] mb-2">50K+</p>
            <p className="text-slate-400 font-medium">Happy Customers</p>
          </div>
          <div className="pt-6 md:pt-0">
            <p className="text-5xl font-bold text-[#00BCD4] mb-2">₹2M+</p>
            <p className="text-slate-400 font-medium">Money Saved</p>
          </div>
          <div className="pt-6 md:pt-0">
            <p className="text-5xl font-bold text-[#00BCD4] mb-2">100+</p>
            <p className="text-slate-400 font-medium">Partner Stores</p>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="px-6 md:px-16 lg:px-24 py-24 bg-[#FAFEFF]">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4">Featured Deals</h2>
            <p className="text-slate-500 text-lg">Top discounts expiring soon near you.</p>
          </div>
          <Link to="/products" className="hidden md:flex items-center gap-2 text-[#00BCD4] font-semibold hover:text-[#0097A7] transition-colors">
            View All <ArrowRight size={20} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockProducts.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="mt-10 text-center md:hidden">
          <Link to="/products" className="inline-flex items-center gap-2 text-[#00BCD4] font-semibold">
            View All Deals <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-12 px-6 md:px-16 lg:px-24 text-center">
        <p className="text-2xl font-bold text-[#00BCD4] mb-4">NearX</p>
        <p className="text-slate-500 mb-8">Saving food, saving money. One deal at a time.</p>
        <p className="text-sm text-slate-400">© 2026 NearX Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
