import { supabase } from '../lib/supabase';

/**
 * Get the store belonging to a specific owner (userId).
 */
export async function getStoreByOwner(userId) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  } catch (err) {
    console.error('getStoreByOwner error:', err);
    throw err;
  }
}

/**
 * Update store details.
 */
export async function updateStore(storeId, updates) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateStore error:', err);
    throw err;
  }
}

/**
 * Get analytics for a store:
 * - Total revenue (all time)
 * - Total orders
 * - Food waste prevented (count of sold near-expiry items)
 * - Last 7 days revenue array
 * - Top 5 products by order count
 */
export async function getStoreAnalytics(storeId, days = 7) {
  try {
    // Fetch all orders for this store
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select('id, total, subtotal, savings, created_at, status')
      .eq('store_id', storeId)
      .neq('status', 'cancelled');

    if (ordErr) throw ordErr;

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalSavings = orders.reduce((sum, o) => sum + (o.savings || 0), 0);

    // Trend revenue
    const revenueTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = orders.filter(
        (o) => o.created_at && o.created_at.startsWith(dateStr)
      );
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      revenueTrend.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
      });
    }

    // Top 5 products
    const { data: topItems, error: topErr } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity')
      .in(
        'order_id',
        orders.map((o) => o.id)
      );

    let topProducts = [];
    if (!topErr && topItems) {
      const productMap = {};
      topItems.forEach((item) => {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = {
            id: item.product_id,
            name: item.product_name,
            count: 0,
          };
        }
        productMap[item.product_id].count += item.quantity;
      });
      topProducts = Object.values(productMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    // Expiring soon count
    const today = new Date();
    const in5days = new Date();
    in5days.setDate(today.getDate() + 5);

    const { count: expiringSoon } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .eq('is_active', true)
      .lte('expiry_date', in5days.toISOString().split('T')[0]);

    return {
      totalRevenue,
      totalOrders,
      totalSavings,
      expiringSoon: expiringSoon ?? 0,
      revenueTrend,
      topProducts,
    };
  } catch (err) {
    console.error('getStoreAnalytics error:', err);
    throw err;
  }
}

/**
 * Create a new store profile.
 */
export async function createStore(storeData) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .insert([storeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createStore error:', err);
    throw err;
  }
}

/**
 * Get all active stores (for filtering on customer product page).
 */
export async function getAllStores() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getAllStores error:', err);
    throw err;
  }
}

