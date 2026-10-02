import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envFile = readFileSync(resolve(__dirname, '../.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  console.error("Could not read .env", e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixStoreOwners() {
  console.log("Fetching stores and owners...");
  const { data: stores, error: storeErr } = await supabase.from('stores').select('id, name, owner_id');
  if (storeErr) {
    console.error("Error fetching stores:", storeErr);
    return;
  }
  
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, full_name, role');
  if (profErr) {
    console.error("Error fetching profiles:", profErr);
    return;
  }
  
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error("Error fetching auth users:", authErr);
    return;
  }
  
  console.log("Supabase connection active! Updating users...");
  
  const password = "StorePassword@123";
  const updatedOwners = [];
  
  for (const store of stores) {
    const authUser = authUsers.users.find(u => u.id === store.owner_id);
    if (!authUser) {
      console.log(`Could not find auth user for store: ${store.name}`);
      continue;
    }
    
    // Update password and confirm email
    const { data: updatedUser, error: updateErr } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { 
        password: password,
        email_confirm: true
      }
    );
    
    if (updateErr) {
      console.error(`Error updating user ${authUser.email}:`, updateErr);
    } else {
      updatedOwners.push({
        storeName: store.name,
        email: authUser.email,
        password: password
      });
      console.log(`Successfully updated ${store.name} (${authUser.email})`);
    }
  }
  
  console.log("\n=== UPDATED CREDENTIALS ===");
  console.table(updatedOwners);
}

fixStoreOwners();
