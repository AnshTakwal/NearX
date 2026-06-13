import React, { useState, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/shared/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import NaturalLanguageSearch from '../../components/customer/NaturalLanguageSearch';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');
  const flashParam = searchParams.get('flash');

  const [searchInput, setSearchInput] = useState(searchParam || '');
  
  const filters = {
    category: categoryParam || 'All',
    search: searchParam || '',
    maxDaysToExpiry: flashParam ? 7 : null
  };

  const { products, loading } = useProducts(filters);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchInput) prev.set('search', searchInput);
      else prev.delete('search');
      return prev;
    });
  };

  return (
    <div className="bg-[#FAFEFF] min-h-screen px-6 md:px-16 lg:px-24 py-8 pb-24 md:pb-8">
      
      {/* Magic AI Search Bar */}
      <NaturalLanguageSearch />

      <div className="mt-12 mb-8 border-t border-slate-100 pt-8">
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Or browse normally</h2>
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A2E]">
              {flashParam ? 'Flash Deals' : categoryParam ? `${categoryParam} Deals` : 'All Deals'}
            </h1>
            <p className="text-slate-500 mt-1">{products.length} items found near you</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-11 pr-4 py-3 w-full rounded-xl border border-slate-200 focus:border-[#00BCD4] focus:outline-none text-sm transition-all"
                placeholder="Search products..." 
              />
            </form>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 h-80 animate-pulse">
              <div className="w-full h-40 bg-slate-100 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
              <div className="h-8 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))
        ) : products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500">
            No products found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
