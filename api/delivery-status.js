import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase Service Role Key is not configured.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { assignmentId, status } = body;

  if (!assignmentId || !status) {
    return res.status(400).json({ error: 'assignmentId and status are required' });
  }

  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Update delivery assignment
    const { data: updateData, error: updateErr } = await serviceClient
      .from('delivery_assignments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', assignmentId)
      .select('order_id')
      .single();

    if (updateErr) throw updateErr;
    if (!updateData) throw new Error('Assignment not found');

    // Map delivery_status to order_status enum
    let mappedOrderStatus = status;
    if (status === 'picked_up' || status === 'in_transit') {
      mappedOrderStatus = 'out_for_delivery';
    } else if (status === 'failed') {
      mappedOrderStatus = null; 
    }

    if (mappedOrderStatus) {
      const { error: orderErr } = await serviceClient
        .from('orders')
        .update({ status: mappedOrderStatus, updated_at: new Date().toISOString() })
        .eq('id', updateData.order_id);

      if (orderErr) throw orderErr;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update Delivery Status Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred' });
  }
}
