import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env
const envFile = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function distributeExpiryDates() {
  console.log('Fetching all products from Supabase...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, mrp, category, store_id')
    .order('category', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products.`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // NearX Discount Tiers:
  // 1. Last Chance (<7 days)  -> 60% discount, status: 'last_chance' (matches 50%+, 40%+, 30%+, 20%+, 10%+, Flash Deals)
  // 2. Buy Soon (7 to 15 days) -> 40% discount, status: 'buy_soon'   (matches 40%+, 30%+, 20%+, 10%+)
  // 3. Safe (16 to 30 days)    -> 25% discount, status: 'active'     (matches 20%+, 10%+)
  // 4. Safe (30+ days)         -> 10% discount, status: 'active'     (matches 10%+)
  const tiers = [
    { discount: 60, daysOffsets: [2, 3, 4, 5, 6], status: 'last_chance' },
    { discount: 40, daysOffsets: [8, 10, 12, 14], status: 'buy_soon' },
    { discount: 25, daysOffsets: [18, 21, 25, 28], status: 'active' },
    { discount: 10, daysOffsets: [35, 45, 60, 75], status: 'active' },
  ];

  // Group by category and store to ensure every category & store has items in every discount tier
  const groups = {};
  for (const p of products) {
    const key = `${p.store_id || 'default'}_${p.category || 'general'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  const updates = [];
  for (const [key, items] of Object.entries(groups)) {
    items.forEach((item, idx) => {
      const tierIndex = idx % tiers.length;
      const tier = tiers[tierIndex];
      const offset = tier.daysOffsets[idx % tier.daysOffsets.length];

      const expiry = new Date(today);
      expiry.setDate(expiry.getDate() + offset);
      const expiryStr = expiry.toISOString().split('T')[0];

      const salePrice = Math.round(item.mrp * (1 - tier.discount / 100));

      updates.push({
        id: item.id,
        name: item.name,
        category: item.category,
        expiry_date: expiryStr,
        discount_percent: tier.discount,
        sale_price: salePrice,
        status: tier.status,
        is_active: true,
      });
    });
  }

  console.log(`Prepared ${updates.length} updates. Executing...`);

  let success = 0;
  let failed = 0;

  // Execute in concurrent batches of 10 for speed
  const BATCH_SIZE = 10;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (u) => {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            expiry_date: u.expiry_date,
            discount_percent: u.discount_percent,
            sale_price: u.sale_price,
            status: u.status,
            is_active: u.is_active,
          })
          .eq('id', u.id);

        if (updateError) {
          console.error(`Failed ${u.id}:`, updateError.message);
          failed++;
        } else {
          success++;
        }
      })
    );
  }

  console.log(`\nUpdate Complete!`);
  console.log(`Successfully updated: ${success}`);
  console.log(`Failed: ${failed}`);

  // Summary of distribution
  const summary = {};
  updates.forEach((u) => {
    const key = `${u.discount_percent}% (${u.status})`;
    summary[key] = (summary[key] || 0) + 1;
  });
  console.log('\nNew discount tier distribution:', summary);
}

distributeExpiryDates();

