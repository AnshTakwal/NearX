import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: products } = await supabase.from('products').select('id, brand, name, image_url, store_id');
  
  const unique = [];
  const seen = new Set();
  for (const p of products) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      unique.push(p);
    }
  }

  const needsImage = unique.filter(p => !p.image_url || !p.image_url.includes('product-images/products/'));
  console.log(`Found ${needsImage.length} products needing images.`);
  
  const out = needsImage.map(p => ({
    id: p.id,
    brand: p.brand || '',
    name: p.name,
    search_query: `${p.brand || ''} ${p.name} packaging`.trim(),
    new_image_url: ''
  }));
  
  writeFileSync(resolve(__dirname, 'manual-images.json'), JSON.stringify(out, null, 2));
}
main();
