import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, X, Store } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/shared/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { getAllStores } from '../../api/stores';
import NaturalLanguageSearch from '../../components/customer/NaturalLanguageSearch';

const CATEGORIES = ['All', 'Dairy', 'Bakery', 'Snacks', 'Beverages', 'Pantry', 'Cleaning'];

const DISCOUNT_RANGES = [
  { label: 'Any Discount', min: 0 },
  { label: '10%+', min: 10 },
  { label: '20%+', min: 20 },
  { label: '30%+', min: 30 },
  { label: '40%+', min: 40 },
  { label: '50%+', min: 50 },
];

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');
  const flashParam = searchParams.get('flash');

  const [aiKeywords, setAiKeywords] = useState(null);
  const [aiMaxPrice, setAiMaxPrice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Store selection state
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');
  const [selectedDiscount, setSelectedDiscount] = useState(0);

  const filters = {
    category: selectedCategory || 'All',
    search: searchParam || '',
    maxDaysToExpiry: flashParam ? 7 : null,
    minDiscount: selectedDiscount > 0 ? selectedDiscount : null,
    aiKeywords: aiKeywords,
    aiMaxPrice: aiMaxPrice,
    storeId: selectedStoreId
  };

  const { products, loading, loadingMore, hasMore, totalCount, fetchNextPage } = useProducts(filters);

  // Infinite Scroll Observer
  const observer = useRef();
  const lastProductElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchNextPage]);

  useEffect(() => {
    setAiKeywords(null);
    setAiMaxPrice(null);
  }, [categoryParam, searchParam, flashParam]);

  // Fetch stores for tabs
  useEffect(() => {
    async function loadStores() {
      try {
        const storeData = await getAllStores();
        setStores(storeData || []);
      } catch (err) {
        console.error("Failed to load stores", err);
      }
    }
    loadStores();
  }, []);

  // Sync category from URL params
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSearchParams(prev => {
      if (cat && cat !== 'All') prev.set('category', cat);
      else prev.delete('category');
      return prev;
    });
  };

  const handleDiscountChange = (min) => {
    setSelectedDiscount(min);
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedDiscount(0);
    setSearchParams(prev => {
      prev.delete('category');
      return prev;
    });
  };

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedDiscount > 0 ? 1 : 0);

  const showLoading = loading || aiLoading;

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-8 pb-24 md:pb-8 text-gray-900 w-full flex flex-col items-center">
      <div className="container-premium">
        {/* Magic AI Search Bar */}
        <NaturalLanguageSearch
          onSearchStart={() => setAiLoading(true)}
          onSearchComplete={(result) => {
            if (result) {
              setAiKeywords(result.keywords || []);
              setAiMaxPrice(result.maxPrice || null);
            } else {
              setAiKeywords(null);
              setAiMaxPrice(null);
            }
            setAiLoading(false);
          }}
        />

        <div className="mt-8 mb-4">
          <div className="flex flex-row overflow-x-auto hide-scrollbar gap-3 pb-2 w-full mask-linear">
            <button
              onClick={() => setSelectedStoreId(null)}
              className={`px-5 py-2.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedStoreId === null
                  ? 'bg-[#00BCD4] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Store size={16} className={selectedStoreId === null ? 'text-white' : 'text-gray-400'} />
              All Stores
            </button>
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`px-5 py-2.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all ${
                  selectedStoreId === store.id
                    ? 'bg-[#00BCD4] text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 mb-8 border-t border-gray-100 pt-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-6">Or browse normally</h2>

          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                {aiKeywords !== null ? 'AI Search Results' : flashParam ? 'Flash Deals' : selectedCategory !== 'All' ? `${selectedCategory} Deals` : 'All Deals'}
              </h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1.5">
                {products.length}{totalCount > products.length ? ` of ${totalCount}` : ''} fresh items near you
              </p>
            </div>

            <div className="flex gap-3 w-full md:w-auto items-center">
              <button
                type="button"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`btn-secondary py-3 px-4 rounded-xl text-sm font-semibold whitespace-nowrap relative transition-all ${
                  showFilterPanel ? 'bg-purple-50 border-purple-200 text-purple-700' : ''
                }`}
              >
                <Filter size={14} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-full text-[15px] whitespace-nowrap text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors font-medium flex items-center gap-1"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Category Filter */}
                <div className="w-full">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Category</h3>
                  <div className="flex flex-row overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-2 px-2 mask-linear">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-6 py-3 rounded-full text-[15px] whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Filter */}
                <div className="w-full mt-4 md:mt-0">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Minimum Discount</h3>
                  <div className="flex flex-row overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-2 px-2 mask-linear">
                    {DISCOUNT_RANGES.map(range => (
                      <button
                        key={range.min}
                        type="button"
                        onClick={() => handleDiscountChange(range.min)}
                        className={`px-6 py-3 rounded-full text-[15px] whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                          selectedDiscount === range.min
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {showLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-80 animate-pulse">
                <div className="w-full h-44 bg-gray-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
                <div className="h-10 bg-gray-100 rounded w-full"></div>
              </div>
            ))
          ) : products.length > 0 ? (
            <>
              {products.map((product, index) => {
                if (products.length === index + 1) {
                  return (
                    <div ref={lastProductElementRef} key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  );
                } else {
                  return <ProductCard key={product.id} product={product} />;
                }
              })}
              {loadingMore && [...Array(4)].map((_, i) => (
                <div key={`loading-${i}`} className="bg-white rounded-2xl p-4 border border-gray-100 h-80 animate-pulse">
                  <div className="w-full h-44 bg-gray-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-6"></div>
                  <div className="h-10 bg-gray-100 rounded w-full"></div>
                </div>
              ))}
              {!hasMore && products.length > 0 && (
                <div className="col-span-full py-6 text-center text-gray-400 text-sm font-medium">
                  You've seen all {totalCount} products
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full py-16 text-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No products found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
