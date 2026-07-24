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

// Parse CSV to get source_page
const csvPath = resolve(__dirname, '..', 'product_images_full.csv');
const csvContent = readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());
const dataLines = lines.slice(1);
const pageMap = {};
for (const line of dataLines) {
  const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  if (!match || match.length < 3) continue;
  const productName = match[0].replace(/^,/, '').replace(/^"|"$/g, '');
  const sourcePage = match[2].replace(/^,/, '').replace(/^"|"$/g, '');
  if (sourcePage && sourcePage.startsWith('http')) {
    pageMap[productName] = sourcePage;
  }
}

async function extractBBImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const imgMatches = html.match(/https?:\/\/www\.bbassets\.com\/media\/uploads\/p\/[sml]\/\d+[^"'\s)]+\.(?:jpg|png|webp)/gi);
    if (imgMatches && imgMatches.length > 0) {
      return imgMatches[0];
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, image_url');

  let updated = 0;
  for (const product of products) {
    // Only retry ones that don't have supabase URL
    if (product.image_url.includes('supabase.co/storage')) {
      continue;
    }

    const sourcePage = pageMap[product.name];
    if (!sourcePage) continue;

    console.log(`Fixing ${product.name}...`);
    try {
      const realImageUrl = await extractBBImage(sourcePage);
      if (!realImageUrl) throw new Error("Could not extract image from page HTML");
      
      console.log(`  -> Found real image: ${realImageUrl}`);

      const res = await fetch(realImageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.bigbasket.com/'
        }
      });

      if (!res.ok) throw new Error(res.statusText);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = realImageUrl.split('.').pop().split(/[#?]/)[0] || 'jpg';
      const fileName = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      await supabase.storage.from('product-images').upload(fileName, buffer, { contentType: res.headers.get('content-type') || 'image/jpeg' });
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      await supabase.from('products').update({ image_url: publicUrl }).eq('id', product.id);

      console.log(`  -> Uploaded OK: ${publicUrl}`);
      updated++;
    } catch (e) {
      console.log(`  -> FAIL: ${e.message}`);
    }
  }
  console.log(`Fixed and updated: ${updated}`);
}
main();
