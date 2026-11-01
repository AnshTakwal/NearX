import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncUserImages() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url, store_id, is_active');

  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  // Find latest user-corrected image for each product name
  // User manually corrected images have timestamp prefix 178497...
  const bestImageMap = {};
  products.forEach((p) => {
    if (p.image_url && p.image_url.includes('178497') && !p.image_url.includes('placeholder')) {
      const match = p.image_url.match(/(\d{13})/);
      const ts = match ? parseInt(match[1]) : 0;
      if (!bestImageMap[p.name] || ts > bestImageMap[p.name].ts) {
        bestImageMap[p.name] = { url: p.image_url, ts };
      }
    }
  });

  console.log(`Found ${Object.keys(bestImageMap).length} unique products with user-corrected images.`);

  const toUpdate = [];
  products.forEach((p) => {
    if (bestImageMap[p.name] && p.image_url !== bestImageMap[p.name].url) {
      toUpdate.push({
        id: p.id,
        name: p.name,
        oldUrl: p.image_url,
        newUrl: bestImageMap[p.name].url,
      });
    }
  });

  console.log(`Found ${toUpdate.length} duplicate/outdated rows to upgrade.`);

  let success = 0;
  for (const item of toUpdate) {
    const { error: updateErr } = await supabase
      .from('products')
      .update({ image_url: item.newUrl })
      .eq('id', item.id);

    if (updateErr) {
      console.error(`Failed to update ${item.name}:`, updateErr.message);
    } else {
      console.log(`Upgraded: ${item.name}`);
      console.log(`   Old: ${item.oldUrl.split('/').pop()}`);
      console.log(`   New: ${item.newUrl.split('/').pop()}`);
      success++;
    }
  }

  console.log(`\nSuccessfully upgraded ${success}/${toUpdate.length} product rows.`);
}

syncUserImages();
