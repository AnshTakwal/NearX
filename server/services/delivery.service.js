import { getSupabaseServiceClient } from '../config/supabase.config.js';
import { DELIVERY_STATUS, ORDER_STATUS } from '../utils/constants.js';
import { logger } from '../utils/logger.util.js';

export const updateDeliveryStatus = async (assignmentId, status) => {
  const serviceClient = getSupabaseServiceClient();

  const { data: updateData, error: updateErr } = await serviceClient
    .from('delivery_assignments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select('order_id')
    .single();

  if (updateErr) {
    logger.error('Error updating delivery assignment:', updateErr);
    throw updateErr;
  }
  
  if (!updateData) {
    throw new Error('Assignment not found');
  }

  // Map delivery_status to order_status enum
  let mappedOrderStatus = status;
  if (status === DELIVERY_STATUS.PICKED_UP || status === DELIVERY_STATUS.IN_TRANSIT) {
    mappedOrderStatus = ORDER_STATUS.OUT_FOR_DELIVERY;
  } else if (status === DELIVERY_STATUS.FAILED) {
    // Don't update order status if delivery failed (could be reassigned)
    // or set it to a specific status if needed. For now, we skip updating order status.
    mappedOrderStatus = null;
  }

  if (mappedOrderStatus) {
    const { error: orderErr } = await serviceClient
      .from('orders')
      .update({ status: mappedOrderStatus, updated_at: new Date().toISOString() })
      .eq('id', updateData.order_id);

    if (orderErr) {
      logger.error('Error syncing order status:', orderErr);
      throw orderErr;
    }
  }

  return true;
};
