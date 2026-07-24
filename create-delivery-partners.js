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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const deliveryPartners = [
  { email: 'chirag@nearx.store', password: 'Password123!', name: 'Chirag', phone: '9000000001' },
  { email: 'nikhil@nearx.store', password: 'Password123!', name: 'Nikhil', phone: '9000000002' }
];

async function createPartners() {
  for (const partner of deliveryPartners) {
    console.log(`Checking ${partner.email}...`);
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === partner.email);

    if (existingUser) {
      console.log(`User ${partner.email} already exists (ID: ${existingUser.id}).`);
      
      // Update password just in case
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: partner.password,
        user_metadata: { full_name: partner.name, phone: partner.phone, role: 'delivery_partner' }
      });
      console.log(`Updated user data and password for ${partner.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: partner.email,
        password: partner.password,
        email_confirm: true,
        user_metadata: {
          full_name: partner.name,
          phone: partner.phone,
          role: 'delivery_partner'
        }
      });
      
      if (error) {
        console.error(`Error creating ${partner.email}:`, error.message);
      } else {
        console.log(`Created delivery partner ${partner.email} (ID: ${data.user.id})`);
      }
    }
  }
  
  console.log("\nCredentials to share with user:");
  console.log("--------------------------------");
  for (const p of deliveryPartners) {
    console.log(`Name: ${p.name}`);
    console.log(`Email ID: ${p.email}`);
    console.log(`Password: ${p.password}`);
    console.log("--------------------------------");
  }
}

createPartners();
