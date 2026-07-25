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

    // Group items by store
    const storeGroups = {};
    for (const item of cartItems) {
      if (!storeGroups[item.store_id]) {
        storeGroups[item.store_id] = [];
      }
      storeGroups[item.store_id].push(item);
    }

    const storeIds = Object.keys(storeGroups);
    const numStores = storeIds.length;
    const totalDeliveryFee = 4000; // base delivery
    const multiStoreFee = numStores > 1 ? 2000 : 0; // multi-store service charge
    
    // Distribute fees evenly (in paise, integer division)
    const baseDeliveryPerStore = Math.floor((totalDeliveryFee + multiStoreFee) / numStores);
    let remainderFee = (totalDeliveryFee + multiStoreFee) % numStores;

    const createdOrders = [];

    for (const storeId of storeIds) {
      const items = storeGroups[storeId];
      const subtotal = items.reduce(
        (sum, item) => sum + item.sale_price * (item.quantity || item.cartQty || 1),
        0
      );
      const savings = items.reduce(
        (sum, item) => sum + ((item.mrp || item.sale_price) - item.sale_price) * (item.quantity || item.cartQty || 1),
        0
      );

      const deliveryFee = baseDeliveryPerStore + (remainderFee > 0 ? 1 : 0);
      if (remainderFee > 0) remainderFee--;

      const total = subtotal + deliveryFee;

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
      createdOrders.push(order);

      // Insert order items
      const orderItems = items.map((item) => ({
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

      // Decrement stock for each item
      for (const item of items) {
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
    }

    return createdOrders;
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
        ),
        delivery_assignments (
          id,
          status,
          partner_id,
          profiles:partner_id (full_name, phone)
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
        order_items (id, product_name, quantity, unit_price, total_price),
        delivery_assignments (
          id,
          status,
          partner_id,
          profiles:partner_id (full_name, phone)
        )
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
          stores (name),
          addresses (label, address_line, city, pincode),
          profiles!orders_customer_id_fkey (full_name, phone)
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
 * Update delivery assignment status (picked_up / in_transit / delivered).
 * Uses SECURITY DEFINER RPC so the partner can also update orders.status
 * when marking as delivered (bypasses RLS on orders table).
 */
export async function updateDeliveryStatus(assignmentId, status) {
  try {
    const res = await fetch('/api/delivery-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assignmentId, status })
    });
    
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update delivery status');
      }
      return data;
    } else {
      const text = await res.text();
      console.error('Non-JSON response from server:', text);
      throw new Error(`Server returned ${res.status}: ${res.statusText}. Is the Node backend running?`);
    }
  } catch (err) {
    console.error('updateDeliveryStatus catch:', err);
    throw err;
  }
}

/**
 * Get available orders that do not have a delivery assignment.
 */
export async function getAvailableDeliveryOrders() {
  try {
    // 1. Fetch all delivery assignments to exclude them
    const { data: assignments, error: assignError } = await supabase
      .from('delivery_assignments')
      .select('order_id');
      
    if (assignError) throw assignError;
    const assignedIds = assignments.map(a => a.order_id);

    // 2. Fetch orders with status 'placed', 'accepted', 'packed', or 'out_for_delivery' that are not in the assignedIds list
    let query = supabase
      .from('orders')
      .select(`
        *,
        stores (id, name, address, city, phone),
        addresses (label, address_line, city, pincode),
        profiles!orders_customer_id_fkey (full_name, phone)
      `)
      .in('status', ['placed', 'accepted', 'packed', 'out_for_delivery']);

    if (assignedIds.length > 0) {
      query = query.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error('getAvailableDeliveryOrders error:', err);
    throw err;
  }
}

/**
 * Accept a delivery request.
 * Uses SECURITY DEFINER RPC so accepting also flips orders.status
 * to 'out_for_delivery' (store owner can then see partner is assigned).
 */
export async function acceptDeliveryRequest(orderId, partnerId) {
  try {
    const { data, error } = await supabase.rpc('accept_delivery_order', {
      p_order_id: orderId,
      p_partner_id: partnerId,
      p_earnings: 4000,
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('acceptDeliveryRequest error:', err);
    throw err;
  }
}
