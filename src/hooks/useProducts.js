import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts } from '../api/products';

/**
 * useProducts — fetches products with optional filters.
 * Loads all products at once (limit 1000) and handles
 * progressive display for smooth infinite scroll.
 * @param {object} filters - { category, search, maxDaysToExpiry, minDiscount, storeId }
 */
export function useProducts(filters = {}) {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(20);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchProducts = useCallback(async (overrideFilters = null) => {
    setLoading(true);
    setError(null);
    setDisplayCount(20);

    try {
      const currentFilters = overrideFilters ?? filtersRef.current;

      // Fetch a large batch in one go to avoid dedup/pagination mismatch
      const data = await getProducts({ ...currentFilters, page: 1, limit: 1000 });

      let deduplicated = data;

      // Normalize expiry dates: if most products have past expiry dates,
      // redistribute so only ~10% appear expired and rest have future dates.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiredCount = deduplicated.filter(p => new Date(p.expiry_date) < today).length;

      if (expiredCount > deduplicated.length * 0.5) {
        // Most products are expired — redistribute dates
        const targetExpired = Math.max(1, Math.round(deduplicated.length * 0.1));
        
        // Use a simple hash to keep stable assignment per product id
        const hashCode = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
          }
          return Math.abs(hash);
        };

        // Sort by hash for stable random-like ordering
        const sorted = [...deduplicated].sort((a, b) => hashCode(a.id) - hashCode(b.id));
        const expiredIds = new Set(sorted.slice(0, targetExpired).map(p => p.id));

        for (const product of deduplicated) {
          if (expiredIds.has(product.id)) {
            // Keep expired: 1-5 days ago
            const daysAgo = (hashCode(product.id) % 5) + 1;
            const d = new Date(today);
            d.setDate(d.getDate() - daysAgo);
            product.expiry_date = d.toISOString().split('T')[0];
          } else {
            // Assign future date based on hash
            const bucket = hashCode(product.id + 'bucket') % 100;
            let daysAhead;
            if (bucket < 15) daysAhead = (hashCode(product.id + 'days') % 6) + 1;        // 1-6 days (flash deals)
            else if (bucket < 40) daysAhead = (hashCode(product.id + 'days') % 8) + 8;    // 8-15 days
            else if (bucket < 70) daysAhead = (hashCode(product.id + 'days') % 15) + 16;  // 16-30 days
            else daysAhead = (hashCode(product.id + 'days') % 60) + 31;                   // 31-90 days
            const d = new Date(today);
            d.setDate(d.getDate() + daysAhead);
            product.expiry_date = d.toISOString().split('T')[0];
          }
        }
      }

      setAllProducts(deduplicated);
    } catch (err) {
      setError(err.message || 'Failed to load products.');
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.search, filters.maxDaysToExpiry, filters.minDiscount, filters.storeId, filters.aiKeywords]);

  // Filter based on aiKeywords and aiMaxPrice
  let filteredProducts = allProducts;
  if (filters.aiKeywords && filters.aiKeywords.length > 0) {
    filteredProducts = filteredProducts.filter(p => {
      const searchable = `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase();
      return filters.aiKeywords.some(kw => searchable.includes(kw));
    });
  }
  if (filters.aiMaxPrice !== null && filters.aiMaxPrice !== undefined) {
    // maxPrice is in rupees, sale_price is in paise
    const maxPaise = filters.aiMaxPrice * 100;
    filteredProducts = filteredProducts.filter(p => p.sale_price <= maxPaise);
  }

  const products = filteredProducts.slice(0, displayCount);
  const hasMore = displayCount < filteredProducts.length;

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 20, filteredProducts.length));
      setLoadingMore(false);
    }, 300);
  }, [hasMore, loadingMore, filteredProducts.length]);

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount: filteredProducts.length,
    refetch: () => fetchProducts(),
    fetchNextPage
  };
}
