import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV to get image_urls
const csvPath = resolve(__dirname, '..', 'product_images_full.csv');
const csvContent = readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());
const dataLines = lines.slice(1);
const imageMap = {};
for (const line of dataLines) {
  const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  if (!match || match.length < 2) continue;
  const productName = match[0].replace(/^,/, '').replace(/^"|"$/g, '');
  const imageUrl = match[1].replace(/^,/, '').replace(/^"|"$/g, '');
  if (imageUrl !== 'needs_manual_review') {
    imageMap[productName] = imageUrl;
  }
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, image_url');

  let updated = 0;
  for (const product of products) {
    // Only retry ones that still have the old direct bbassets URL or didn't get updated
    if (product.image_url.includes('supabase.co/storage')) {
      continue; // Skip ones that succeeded
    }

    const sourceUrl = imageMap[product.name];
    if (!sourceUrl) continue;

    console.log(`Retrying ${product.name}...`);
    try {
      const res = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.bigbasket.com/'
        }
      });

      if (!res.ok) throw new Error(res.statusText);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = sourceUrl.split('.').pop().split(/[#?]/)[0] || 'jpg';
      const fileName = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      await supabase.storage.from('product-images').upload(fileName, buffer, { contentType: res.headers.get('content-type') || 'image/jpeg' });
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      await supabase.from('products').update({ image_url: publicUrl }).eq('id', product.id);

      console.log(`  -> OK: ${publicUrl}`);
      updated++;
    } catch (e) {
      console.log(`  -> FAIL: ${e.message}`);
    }
  }
  console.log(`Retried and updated: ${updated}`);
}
main();
