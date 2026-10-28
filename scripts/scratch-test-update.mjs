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

  // Get active assignment
  const { data: activeOrder, error: activeErr } = await supabase
      .from('delivery_assignments')
      .select('id, status, order_id')
      .eq('partner_id', authData.user.id)
      .in('status', ['assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

  if (activeErr) { console.error('Active Error:', activeErr); return; }
  console.log('Active Order:', activeOrder);

  if (!activeOrder) return;

  const { data, error } = await supabase.rpc('update_delivery_order_status', {
      p_assignment_id: activeOrder.id,
      p_new_status: 'picked_up',
  });

  console.log('Update Result:', data, error);
}

test();
