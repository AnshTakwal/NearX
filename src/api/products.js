import { supabase } from '../lib/supabase';

/**
 * Fetch products with optional filters.
 * All prices stored in paise in DB; returned as-is (convert to ₹ in UI).
 */
export async function getProducts(filters = {}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        stores (
          id,
          name,
          address,
          city,
          lat,
          lng,
          avg_rating
        )
      `)
      .eq('is_active', true)
      .order('discount_percent', { ascending: false });

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
      );
    }

    if (filters.maxDaysToExpiry) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + Number(filters.maxDaysToExpiry));
      query = query.lte('expiry_date', maxDate.toISOString().split('T')[0]);
    }

    if (filters.minDiscount) {
      query = query.gte('discount_percent', Number(filters.minDiscount));
    }

    if (filters.storeId) {
      query = query.eq('store_id', filters.storeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getProducts error:', err);
    throw err;
  }
}

/**
 * Get a single product with full store details.
 */
export async function getProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores (
          id,
          name,
          address,
          city,
          pincode,
          lat,
          lng,
          phone,
          avg_rating,
          total_reviews,
          logo_url
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getProductById error:', err);
    throw err;
  }
}

/**
 * Get all products for a specific store (for store owner).
 */
export async function getProductsByStore(storeId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getProductsByStore error:', err);
    throw err;
  }
}

/**
 * Add a new product to the database.
 */
export async function addProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('addProduct error:', err);
    throw err;
  }
}

/**
 * Update an existing product.
 */
export async function updateProduct(id, updates) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateProduct error:', err);
    throw err;
  }
}

/**
 * Soft-delete a product (set is_active = false).
 */
export async function deleteProduct(id) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteProduct error:', err);
    throw err;
  }
}

/**
 * Get products from stores within a given radius (km) using lat/lng math.
 * Falls back to all products if no location given.
 */
export async function getNearbyProducts(lat, lng, radiusKm = 5) {
  try {
    // Approximate degree per km: 1 degree ≈ 111 km
    const delta = radiusKm / 111;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores!inner (
          id,
          name,
          address,
          city,
          lat,
          lng,
          avg_rating
        )
      `)
      .eq('is_active', true)
      .gte('stores.lat', lat - delta)
      .lte('stores.lat', lat + delta)
      .gte('stores.lng', lng - delta)
      .lte('stores.lng', lng + delta)
      .order('discount_percent', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getNearbyProducts error:', err);
    throw err;
  }
}

/**
 * Calculate discount percent from expiry date (client-side preview).
 */
export function calcDiscountFromExpiry(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry - today;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 60;
  if (daysLeft < 7) return 60;
  if (daysLeft <= 15) return 40;
  if (daysLeft <= 30) return 25;
  return 10;
}
