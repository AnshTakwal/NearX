import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getCustomerOrders, getStoreOrders, getActiveDeliveryOrder } from '../api/orders';
import { getStoreByOwner } from '../api/stores';

/**
 * useOrders — fetches orders based on the authenticated user's role.
 * - customer → getCustomerOrders()
 * - store_owner → getStoreOrders()
 * - delivery_partner → getActiveDeliveryOrder()
 */
export function useOrders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    setError(null);
    try {
      if (profile.role === 'customer') {
        const data = await getCustomerOrders(user.id);
        setOrders(data);
      } else if (profile.role === 'store_owner') {
        const store = await getStoreByOwner(user.id);
        if (store) {
          const data = await getStoreOrders(store.id);
          setOrders(data);
        }
      } else if (profile.role === 'delivery_partner') {
        const data = await getActiveDeliveryOrder(user.id);
        setActiveOrder(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, activeOrder, loading, error, refetch: fetchOrders };
}
