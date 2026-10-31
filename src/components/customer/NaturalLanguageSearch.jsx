import React, { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import ProductCard from '../shared/ProductCard';
import { supabase } from '../../lib/supabase';

// Authentic Google Gemini 4-point star SVG icon
function GeminiIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M21.5 12C16.25 12 12 7.75 12 2.5C12 7.75 7.75 12 2.5 12C7.75 12 12 16.25 12 21.5C12 16.25 16.25 12 21.5 12Z"
        fill="url(#geminiGradient)"
      />
      <defs>
        <linearGradient id="geminiGradient" x1="2.5" y1="2.5" x2="21.5" y2="21.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285F4" />
          <stop offset="0.5" stopColor="#D96570" />
          <stop offset="1" stopColor="#F4B400" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function NaturalLanguageSearch({ onSearchStart, onSearchComplete, onStandardSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);

  const prompts = [
    "breakfast items for kids",
    "healthy snacks under 100 rupees",
    "cleaning supplies for kitchen",
    "cold drinks and juices",
    "biscuits and cookies for tea time",
    "items for making sandwiches"
  ];

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    if (onSearchStart) onSearchStart();

    try {
      // Step 1: Get keywords from server-side Gemini (key never touches the browser)
      const response = await fetch('/api/search-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Search failed (${response.status})`);
      }

      const { keywords, maxPrice } = await response.json();

      // Step 2: Fetch active products from Supabase and filter by keywords client-side
      let supaQuery = supabase
        .from('products')
        .select('id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, store_id, is_active, status')
        .eq('is_active', true);

      // Apply price filter if Gemini extracted a budget (maxPrice is in rupees, DB stores paise)
      if (maxPrice) {
        supaQuery = supaQuery.lte('sale_price', maxPrice * 100);
      }

      const { data: products, error: dbError } = await supaQuery;
      if (dbError) throw new Error('Failed to search products.');

      // Match products whose name/brand/category/description contain any keyword
      const matchedProducts = (products || []).filter(product => {
        const haystack = [product.name, product.brand, product.category, product.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return keywords.some(kw => haystack.includes(kw.toLowerCase()));
      });

      if (onSearchComplete) {
        onSearchComplete({ products: matchedProducts });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'AI search failed. Please try again.');
      if (onSearchComplete) {
        onSearchComplete({ products: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (isAiMode) {
      executeSearch(query);
    } else {
      if (onStandardSearch) onStandardSearch(query);
    }
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
    setIsAiMode(true);
    executeSearch(prompt);
  };

  const toggleAiMode = () => {
    if (!isAiMode) {
      setIsAiMode(true);
      setShowSuggestions(true);
    } else {
      setIsAiMode(false);
      setShowSuggestions(false);
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setError(null);
      if (onSearchComplete) {
        onSearchComplete(null);
      }
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    if (onSearchComplete) {
      onSearchComplete(null);
    }
  };

  return (
    <div className="w-full relative z-30 mb-8">
      <div className="bg-white rounded-[20px] shadow-sm hover:shadow-md border border-gray-100 p-3 sm:p-4 transition-shadow duration-300">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 w-full relative z-40">
          {/* Gemini Toggle Button */}
          <button
            type="button"
            onClick={toggleAiMode}
            title={isAiMode ? 'Exit AI Search' : 'Search with Gemini AI'}
            className="flex-shrink-0 p-2 transition-transform duration-300 active:scale-95 cursor-pointer bg-transparent border-none outline-none"
          >
            <GeminiIcon size={28} className={isAiMode ? "" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all"} />
          </button>

          {/* Input Field */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => isAiMode && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              placeholder={isAiMode ? 'Ask Gemini: "breakfast items for kids"...' : 'Search products...'}
              style={{ paddingLeft: '2.75rem', paddingRight: query ? '10rem' : '5.5rem' }}
              className={`input-premium py-3.5 text-[15px] w-full transition-all duration-300 relative z-20 ${isAiMode ? 'border-purple-200 bg-purple-50/30 focus:border-purple-400 focus:ring-purple-100' : ''
                }`}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-30">
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
              {isAiMode ? (
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="bg-primary text-white hover:bg-primary-dark px-8 py-3.5 rounded-[12px] font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <GeminiIcon size={14} />}
                  <span className="hidden sm:inline">{loading ? 'Thinking...' : 'Ask AI'}</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="bg-primary text-white hover:bg-primary-dark px-6 py-3.5 rounded-[12px] font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Search size={16} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Suggestion Chips */}
        {isAiMode && showSuggestions && !loading && (
          <div className="w-[calc(100%-48px)] sm:w-[calc(100%-60px)] ml-[48px] sm:ml-[60px] bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mt-4 transition-all">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Try asking</p>
            <div className="flex flex-wrap gap-2.5">
              {prompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => handleSuggestionClick(p)}
                  className="text-[13px] font-semibold px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300 rounded-full transition-all duration-200 cursor-pointer active:scale-95 text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Mode indicator */}
        {isAiMode && !loading && !hasSearched && (
          <p className="mt-4 text-xs text-primary font-medium flex items-center gap-1.5 ml-[48px] sm:ml-[60px]">
            <GeminiIcon size={10} />
            Powered by Google Gemini — describe what you need in plain English
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mt-4 border border-red-100 text-sm font-medium flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 text-lg">!</span>
          <div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Results Section (Only render if not delegated to parent listing page) */}
      {!onSearchComplete && hasSearched && !loading && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <GeminiIcon size={18} className="text-purple-500" />
            <h3 className="font-bold text-xl text-gray-900">
              {results.length > 0 ? `Found ${results.length} matching products` : 'No matches found'}
            </h3>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <GeminiIcon size={40} className="text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-2">No products matched</h4>
              <p className="text-gray-500 text-sm">Try rephrasing your search or browse categories instead.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton (Only render if not delegated to parent) */}
      {!onSearchComplete && loading && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-spin" />
            <p className="text-sm font-semibold text-purple-600">Gemini is analyzing your request...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-80 animate-pulse">
                <div className="w-full h-44 bg-gray-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
