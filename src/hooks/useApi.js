import { useState, useCallback } from 'react';
import { toast } from '../components/shared/Toast';

/**
 * useApi — generic hook for wrapping async API calls.
 * Returns { data, loading, error, execute, refetch }
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(getProducts);
 *   // Call: await execute({ category: 'Dairy' })
 */
export function useApi(apiFn, options = {}) {
  const { onSuccess, onError, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastArgs, setLastArgs] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      setLastArgs(args);
      try {
        const result = await apiFn(...args);
        setData(result);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        const message = err?.message || 'Something went wrong.';

        // Session expiry detection
        if (
          err?.status === 401 ||
          message.toLowerCase().includes('jwt expired') ||
          message.toLowerCase().includes('not authenticated')
        ) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(message);
        }

        setError(message);
        if (onError) onError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn, onSuccess, onError]
  );

  const refetch = useCallback(() => {
    if (lastArgs !== null) return execute(...lastArgs);
  }, [execute, lastArgs]);

  return { data, loading, error, execute, refetch };
}
