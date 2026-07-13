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
  const [aiProducts, setAiProducts] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  const filters = {
    category: categoryParam || 'All',
    search: searchParam || '',
    maxDaysToExpiry: flashParam ? 7 : null
  };

  const { products, loading } = useProducts(filters);

  // If URL search params change, reset the AI search results
  useEffect(() => {
    setAiProducts(null);
  }, [categoryParam, searchParam, flashParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchInput) prev.set('search', searchInput);
      else prev.delete('search');
      return prev;
    });
  };

  const showLoading = loading || aiLoading;
  const displayProducts = aiProducts !== null ? aiProducts : products;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 pb-24 md:pb-8 text-[#1F2937] w-full flex flex-col items-center">
      <div className="container-premium">
        {/* Magic AI Search Bar */}
        <NaturalLanguageSearch 
          onSearchStart={() => setAiLoading(true)} 
          onSearchComplete={(results) => {
            setAiProducts(results);
            setAiLoading(false);
          }} 
        />

        <div className="mt-14 mb-8 border-t border-gray-150 pt-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-6">Or browse normally</h2>
          
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                {aiProducts !== null ? 'AI Search Results' : flashParam ? 'Flash Deals' : categoryParam ? `${categoryParam} Deals` : 'All Deals'}
              </h1>
              <p className="text-[11px] text-gray-450 font-bold uppercase tracking-wider mt-1">{displayProducts.length} fresh items near you</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="text-gray-400 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
                <Search size={16} />
              </div>
              <form onSubmit={handleSearchSubmit} className="flex-1 md:w-64">
                <input 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-premium !py-3 bg-white"
                  placeholder="Search products..." 
                />
              </form>
              <button className="btn-secondary !py-3 !px-4 !rounded-xl text-xs font-bold whitespace-nowrap">
                <Filter size={14} />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {showLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 h-80 animate-pulse">
                <div className="w-full h-40 bg-slate-100 rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-slate-100 rounded w-1/3"></div>
              </div>
            ))
          ) : displayProducts.length > 0 ? (
            displayProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-400 font-semibold bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              No products found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
