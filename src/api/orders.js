import { supabase } from '../lib/supabase';

/**
 * Place a new order.
 * @param {Array} cartItems - [{id, name, sale_price, mrp, quantity, store_id}]
 * @param {string} addressId - UUID of the delivery address
 * @param {string} customerId - UUID of the customer
 * @returns {object} Created order
 */
export async function placeOrder(cartItems, addressId, customerId) {
  try {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const storeId = cartItems[0].store_id;
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.sale_price * (item.quantity || item.cartQty || 1),
      0
    );
    const deliveryFee = 4000; // 4000 paise = ₹40
    const total = subtotal + deliveryFee;
    const savings = cartItems.reduce(
      (sum, item) => sum + ((item.mrp || item.sale_price) - item.sale_price) * (item.quantity || item.cartQty || 1),
      0
    );

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: customerId,
          store_id: storeId,
          address_id: addressId,
          status: 'placed',
          subtotal,
          delivery_fee: deliveryFee,
          total,
          savings,
          payment_status: 'pending',
          payment_id: null,
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity || item.cartQty || 1,
      unit_price: item.sale_price,
      total_price: item.sale_price * (item.quantity || item.cartQty || 1),
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Decrement stock for each item (use RPC for atomic operation)
    for (const item of cartItems) {
      const { data: success, error: stockError } = await supabase.rpc(
        'decrement_stock',
        { p_product_id: item.id, p_quantity: item.quantity || item.cartQty || 1 }
      );
      if (stockError) {
        console.warn('Stock decrement failed for product:', item.id, stockError);
      }
      if (success === false) {
        console.warn('Insufficient stock for product:', item.id);
      }
    }

    return order;
  } catch (err) {
    console.error('placeOrder error:', err);
    throw err;
  }
}

/**
 * Get a single order with all items and store details.
 */
export async function getOrderById(id) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores (id, name, address, city, phone),
        addresses (label, address_line, city, pincode),
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getOrderById error:', err);
    throw err;
  }
}

/**
 * Get all orders for the logged-in customer.
 */
export async function getCustomerOrders(customerId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores (id, name, city),
        order_items (id, product_name, quantity, unit_price)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getCustomerOrders error:', err);
    throw err;
  }
}

/**
 * Get all orders for a store owner.
 */
export async function getStoreOrders(storeId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_customer_id_fkey (full_name, phone),
        order_items (id, product_name, quantity, unit_price, total_price)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getStoreOrders error:', err);
    throw err;
  }
}

/**
 * Update the status of an order.
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    throw err;
  }
}

/**
 * Get the active delivery order for a delivery partner.
 */
export async function getActiveDeliveryOrder(deliveryPartnerId) {
  try {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(`
        *,
        orders (
          *,
          stores (id, name, address, city, lat, lng, phone),
          addresses (label, address_line, city, pincode),
          profiles!orders_customer_id_fkey (full_name, phone),
          order_items (product_name, quantity, unit_price)
        )
      `)
      .eq('partner_id', deliveryPartnerId)
      .in('status', ['assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getActiveDeliveryOrder error:', err);
    throw err;
  }
}

/**
 * Get all completed deliveries for a delivery partner (earnings history).
 */
export async function getDeliveryHistory(deliveryPartnerId) {
  try {
    const { data, error } = await supabase
      .from('delivery_assignments')
      .select(`
        *,
        orders (
          id,
          total,
          created_at,
          stores (name)
        )
      `)
      .eq('partner_id', deliveryPartnerId)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getDeliveryHistory error:', err);
    throw err;
  }
}

/**
 * Update delivery assignment status (picked_up / delivered).
 */
export async function updateDeliveryStatus(assignmentId, status) {
  try {
    const updates = { status };
    if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('delivery_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateDeliveryStatus error:', err);
    throw err;
  }
}
