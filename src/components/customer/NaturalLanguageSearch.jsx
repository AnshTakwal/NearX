import React, { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import ProductCard from '../shared/ProductCard';

export default function NaturalLanguageSearch({ onSearchStart, onSearchComplete }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const prompts = [
    "snacks for kids expiring this week",
    "dairy items under ₹50 expiring soon",
    "bakery items expiring in 3 days",
    "beverages under ₹100"
  ];

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    if (onSearchStart) onSearchStart();

    try {
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await response.json();
      const productsList = data.products || [];
      setResults(productsList);
      if (onSearchComplete) {
        onSearchComplete(productsList);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setResults([]);
      if (onSearchComplete) {
        onSearchComplete([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setHasSearched(false);
      if (onSearchComplete) {
        onSearchComplete(null);
      }
    }
  };

  const handleSuggestionClick = (prompt) => {
    setQuery(prompt);
    setShowSuggestions(false);
    executeSearch(prompt);
  };

  return (
    <div className="w-full relative">
      {/* Search Input Container */}
      <div className="flex items-center gap-4 w-full mb-6">
        {/* Gemini Sparkles Icon Outside */}
        <div className="bg-[#E0F7FA] p-3.5 rounded-2xl text-[#00BCD4] shadow-sm flex-shrink-0 border border-[#00BCD4]/25 hover:scale-105 active:scale-95 transition-all duration-300">
          <Sparkles size={24} className="animate-pulse" />
        </div>

        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder='Ask AI: "snacks for kids expiring this week"...'
            className="w-full bg-white pl-5 pr-36 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#00BCD4] focus:ring-2 focus:ring-[#00BCD4]/20 shadow-sm text-lg transition-all font-medium"
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
      </div>

      {/* Suggestion Chips */}
      {showSuggestions && (
        <div className="absolute left-14 right-0 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-xl z-30 flex flex-col gap-2 transition-all">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Suggested Prompts</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={() => handleSuggestionClick(p)}
                className="text-xs font-semibold px-4 py-2 bg-[#E0F7FA]/40 hover:bg-[#E0F7FA] text-[#0097A7] border border-[#00BCD4]/10 hover:border-[#00BCD4]/30 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

      {/* Results Section (Only render if not delegated to parent listing page) */}
      {!onSearchComplete && hasSearched && !loading && (
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
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Sparkles size={48} className="text-slate-300 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-[#1A1A2E] mb-2">No deals found</h4>
              <p className="text-slate-500">Try rewording your search or checking a different category.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton (Only render if not delegated to parent) */}
      {!onSearchComplete && loading && (
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
