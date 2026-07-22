import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import ProductCard from '../components/shared/ProductCard';
import { mockProducts } from '../data/mockData';

export default function LandingPage() {
  return (
    <div className="bg-[#F7F8FA] min-h-screen overflow-x-hidden text-gray-900">
      {/* Hero Section */}
      <section className="relative bg-white py-20 md:py-28 border-b border-gray-100">
        <div className="container-premium flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#0097A7]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#0097A7]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#E0F7FA] border border-[#B2EBF2] px-5 py-2.5 rounded-full text-sm font-semibold text-[#0097A7] tracking-wide">
              🌱 Smart Food Shopping
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Fresh Deals.<br/>
              <span className="text-[#0097A7]">Zero Waste.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Get premium groceries at massive discounts right before they expire. Save money while saving the planet.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <Link 
                to="/products" 
                className="btn-primary text-white px-10 py-5 rounded-xl font-semibold text-[15px] hover:bg-[#00838F] active:scale-[0.98] transition-all duration-300 shadow-md flex items-center justify-center gap-2.5 group"
              >
                Shop Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/register?role=store" 
                className="bg-white border border-gray-200 text-gray-700 hover:border-[#0097A7] hover:text-[#0097A7] px-10 py-5 rounded-xl font-semibold text-[15px] hover:bg-gray-50 active:scale-[0.98] transition-all duration-300 flex items-center justify-center"
              >
                List Your Store
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-lg relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E0F7FA] to-[#0097A7]/10 rounded-2xl rotate-3 transform scale-105 -z-10"></div>
            <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl shadow-lg border border-gray-100">
               <img 
                 src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                 alt="Groceries" 
                 className="rounded-xl w-full h-auto object-cover aspect-square" 
               />
               <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-md border border-gray-100 flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-xl text-green-600">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Food Saved</p>
                    <p className="text-xl font-bold text-gray-800">2.4 Tons</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 md:py-28 bg-[#F7F8FA] border-b border-gray-100">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 text-[15px] max-w-md mx-auto">Three simple steps to save money and reduce supermarket waste.</p>
        </div>
        
        <div className="container-premium grid sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10">
          {[
            { step: 1, title: "Find Deals", desc: "Discover near-expiry products at huge discounts from local stores.", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-200" },
            { step: 2, title: "Book Safely", desc: "All products are quality-checked and 100% safe to consume.", icon: ShieldCheck, color: "bg-green-50 text-green-600 border-green-200" },
            { step: 3, title: "Pickup or Delivery", desc: "Get it delivered fast or pick it up directly from the store.", icon: CheckCircle, color: "bg-cyan-50 text-cyan-600 border-cyan-200" }
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center p-8 md:p-10 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 transition-all duration-300 relative group">
              <div className={`w-12 h-12 ${item.color} border rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                <item.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* Featured Deals */}
      <section className="py-20 md:py-28 bg-[#F7F8FA] border-b border-gray-100">
        <div className="container-premium">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Deals</h2>
              <p className="text-gray-500 text-sm">Top discounts expiring soon near you.</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center gap-2 text-[#0097A7] font-semibold hover:text-[#00838F] transition-all group">
              View All Deals 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {mockProducts.slice(0, 4).map(product => {
              const mappedProduct = {
                id: product.id,
                name: product.name,
                brand: product.brand,
                mrp: product.mrp * 100,
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
            <Link to="/products" className="inline-flex items-center gap-2 text-[#0097A7] font-semibold">
              View All Deals <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-14 px-6 text-center">
        <p className="text-2xl font-bold text-[#0097A7] mb-2">NearX</p>
        <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm leading-relaxed">Saving food, saving money. One deal at a time.</p>
        <p className="text-xs text-gray-400 font-medium">© 2026 NearX Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
