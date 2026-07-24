import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanupStores() {
  console.log("Fetching all stores...");
  const { data: stores, error } = await supabase.from('stores').select('id, name, owner_id');
  if (error) { console.error(error); return; }

  // Target Stores by their known characteristics or by ID
  let storeA, storeB, storeC;

  // We know Store B and C are owned by rahul and priya.
  // We can get their owner IDs from auth if needed, but it's easier to just find the names we gave them
  storeB = stores.find(s => s.name === 'Rahul Supermarket' || s.name === 'PURAN store');
  storeC = stores.find(s => s.name === 'Priya Fresh Mart' || s.name === 'Rajmandir');
  // Store A is the dummy/Fresh Mart
  storeA = stores.find(s => s.name.includes('Fresh Mart') && s.name !== 'Priya Fresh Mart' || s.name === 'Reliance Store');

  if (!storeA || !storeB || !storeC) {
    console.error("Could not find all 3 required stores to rename!");
    console.log("Found:", stores.map(s => s.name));
    return;
  }

  // Update names
  console.log("Renaming stores...");
  await supabase.from('stores').update({ name: 'Reliance Store' }).eq('id', storeA.id);
  await supabase.from('stores').update({ name: 'PURAN store' }).eq('id', storeB.id);
  await supabase.from('stores').update({ name: 'Rajmandir' }).eq('id', storeC.id);

  // Delete all other stores
  const keepIds = [storeA.id, storeB.id, storeC.id];
  console.log("Deleting other stores...");
  for (const s of stores) {
    if (!keepIds.includes(s.id)) {
      console.log("Deleting store:", s.name);
      await supabase.from('stores').delete().eq('id', s.id);
    }
  }

  console.log("Done!");
}

cleanupStores();
