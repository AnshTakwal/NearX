import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envFile = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getDiscountPercent(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return 60;   // Expired
  if (daysLeft < 7) return 60;   // Last Chance
  if (daysLeft <= 15) return 40;  // Buy Soon
  if (daysLeft <= 30) return 25;  // Safe
  return 10;                      // 30+ days
}

async function main() {
  const { data: products, error } = await supabase.from('products').select('id, mrp, expiry_date, discount_percent, sale_price');
  if (error) { console.error(error); return; }

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const correctDiscount = getDiscountPercent(p.expiry_date);
    const correctSalePrice = Math.round(p.mrp * (1 - correctDiscount / 100));

    if (p.discount_percent !== correctDiscount || p.sale_price !== correctSalePrice) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ discount_percent: correctDiscount, sale_price: correctSalePrice })
        .eq('id', p.id);

      if (updateError) {
        console.error(`Failed to update ${p.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`Done. Updated: ${updated}, Already correct: ${skipped}`);
}

main();
