import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts } from '../api/products';

/**
 * useProducts — fetches products with optional filters and provides refetch.
 * @param {object} filters - { category, search, maxDaysToExpiry, minDiscount, storeId }
 */
export function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetch = useCallback(async (overrideFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(overrideFilters ?? filtersRef.current);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.search, filters.maxDaysToExpiry, filters.minDiscount, filters.storeId]);

  return { products, loading, error, refetch: fetch };
}
