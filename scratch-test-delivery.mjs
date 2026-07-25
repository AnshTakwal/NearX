import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'chirag@nearx.store',
    password: 'Password123!'
  });
  if (authError) { console.error('Auth Error:', authError); return; }
  console.log('Logged in as', authData.user.id);

  const { data: assignments, error: assignError } = await supabase
    .from('delivery_assignments')
    .select('order_id');
  if (assignError) { console.error('Assign Error:', assignError); return; }
  console.log('Assignments:', assignments);

  const assignedIds = assignments.map(a => a.order_id);
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
  if (error) { console.error('Query Error:', error); return; }
  console.log('Available Orders length:', data.length);
  console.log('Available Orders statuses:', data.map(o => o.status));
}

test();
