import React, { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import ProductCard from '../shared/ProductCard';

export default function NaturalLanguageSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // 1. Call our local Express backend route
      // Make sure your backend server is running on port 3000!
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await response.json();
      
      // 2. data.products contains the filtered list from Supabase
      setResults(data.products || []);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      // Edge Case: If it fails entirely, we just show empty results
      setResults([]); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="relative w-full mb-8">
        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00BCD4]" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "snacks for kids expiring this week"...'
          className="w-full bg-white pl-12 pr-32 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#00BCD4] focus:ring-1 focus:ring-[#00BCD4] shadow-sm text-lg transition-all"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00BCD4] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0097A7] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          <span className="hidden sm:inline">{loading ? 'Thinking...' : 'Search'}</span>
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

      {/* Results Section */}
      {hasSearched && !loading && (
        <div>
          <h3 className="font-bold text-xl text-[#1A1A2E] mb-6">
            Found {results.length} Deals
          </h3>
          
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // Edge Case: No products match the filters
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Sparkles size={48} className="text-slate-300 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-[#1A1A2E] mb-2">No deals found</h4>
              <p className="text-slate-500">Try rewording your search or checking a different category.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 h-80 animate-pulse">
              <div className="w-full h-40 bg-slate-100 rounded-xl mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
              <div className="h-8 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
