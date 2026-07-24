import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (error) {
    console.error('Failed to fetch products:', error);
    process.exit(1);
  }

  let updated = 0;
  let failed = 0;
  const report = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const sourceUrl = imageMap[product.name];
    
    if (!sourceUrl) continue;
    
    // Skip if we already uploaded it to Supabase (e.g. if script was interrupted)
    if (product.image_url.includes('supabase.co/storage')) {
      // It might already be a supabase URL from our *previous* attempts
      // Let's force update it just to be safe, because the user wants the BigBasket ones.
    }

    try {
      console.log(`[${i+1}/${products.length}] Fetching ${product.name}...`);
      const res = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = sourceUrl.split('.').pop().split(/[#?]/)[0] || 'jpg';
      const fileName = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: res.headers.get('content-type') || 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        throw updateError;
      }

      updated++;
      report.push({ name: product.name, status: 'success', oldUrl: sourceUrl, newUrl: publicUrl });
      console.log(`  -> Uploaded and updated to ${publicUrl}`);

      await sleep(300); // rate limiting
    } catch (err) {
      failed++;
      report.push({ name: product.name, status: 'error', error: err.message });
      console.error(`  -> ERROR for ${product.name}: ${err.message}`);
    }
  }

  writeFileSync(resolve(__dirname, '..', 'final-image-upload-report.json'), JSON.stringify(report, null, 2));
  console.log(`\nFinished! Updated ${updated} products. Failed ${failed}.`);
}

main();
