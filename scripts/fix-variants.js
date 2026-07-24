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

// Read CSV to map
const csvPath = resolve(__dirname, '..', 'product_images_full.csv');
const csvContent = readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());
const dataLines = lines.slice(1);
const csvMap = {};
for (const line of dataLines) {
  const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  if (!match || match.length < 2) continue;
  const productName = match[0].replace(/^,/, '').replace(/^"|"$/g, '');
  const imageUrl = match[1].replace(/^,/, '').replace(/^"|"$/g, '');
  if (imageUrl !== 'needs_manual_review') {
    csvMap[productName] = imageUrl;
  }
}

const failedData = JSON.parse(readFileSync(resolve(__dirname, '..', 'final-image-upload-report.json'), 'utf8'));
const failedProducts = [...new Set(failedData.filter(d => d.status === 'error').map(e => e.name))];

async function tryFetchBBImage(baseUrl) {
  if (!baseUrl) return null;
  const match = baseUrl.match(/\/p\/[sml]\/(\d+)/);
  if (!match) return null;
  const id = match[1];

  const variants = [
    `s/${id}_1.jpg`, `s/${id}_2.jpg`, `s/${id}_3.jpg`, `s/${id}_12.jpg`,
    `l/${id}_1.jpg`, `l/${id}_2.jpg`, `l/${id}_3.jpg`, `l/${id}_12.jpg`,
    `s/${id}_1.webp`, `s/${id}_2.webp`, `l/${id}_1.webp`
  ];

  for (const v of variants) {
    const url = `https://www.bbassets.com/media/uploads/p/${v}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.bigbasket.com/'
        },
        method: 'HEAD'
      });
      if (res.ok) {
        return url;
      }
    } catch (e) {}
  }
  return null;
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name');
  let updated = 0;
  
  for (const productName of failedProducts) {
    console.log(`Searching for: ${productName}`);
    const originalUrl = csvMap[productName];
    if (!originalUrl) {
       console.log(`  -> No URL in CSV`);
       continue;
    }
    
    const correctUrl = await tryFetchBBImage(originalUrl);
    
    if (!correctUrl) {
      console.log(`  -> Still not found on BB with variants`);
      continue;
    }
    
    console.log(`  -> Found valid BB URL: ${correctUrl}`);
    
    try {
      const res = await fetch(correctUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.bigbasket.com/'
        },
      });
      if (!res.ok) throw new Error(res.statusText);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = correctUrl.split('.').pop().split(/[#?]/)[0] || 'jpg';
      const fileName = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      await supabase.storage.from('product-images').upload(fileName, buffer, { contentType: res.headers.get('content-type') || 'image/jpeg' });
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      
      const targetProducts = products.filter(p => p.name === productName);
      for (const p of targetProducts) {
        await supabase.from('products').update({ image_url: publicUrl }).eq('id', p.id);
      }
      
      console.log(`  -> Uploaded successfully!`);
      updated++;
    } catch (e) {
      console.log(`  -> Upload failed: ${e.message}`);
    }
  }
  
  console.log(`Finished. Updated ${updated} items.`);
}

main();
