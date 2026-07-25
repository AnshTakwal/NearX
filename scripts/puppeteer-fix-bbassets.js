import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function main() {
  const { data: products } = await supabase.from('products').select('id, name, image_url').like('image_url', '%bbassets.com%');
  const uniqueProducts = [...new Set(products.map(e => e.name))];
  
  console.log(`Starting browser to find images for ${uniqueProducts.length} unique products...`);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  let updated = 0;
  for (const productName of uniqueProducts) {
    console.log(`Searching for: ${productName}`);
    try {
      const query = `${productName} product white background`;
      await page.goto(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`);
      
      await page.waitForSelector('img');
      
      const imageUrl = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        for (let img of images) {
          const src = img.src || img.dataset?.src;
          // gstatic and google often host tiny thumbnails or tracking pixels
          // But google images search returns data:image base64 for first results
          if (src && src.startsWith('http') && !src.includes('google.com') && !src.includes('gstatic.com') && !src.includes('images.unsplash')) {
            return src;
          }
        }
        return null;
      });

      if (!imageUrl) {
        console.log(`  -> Not found`);
        continue;
      }
      
      console.log(`  -> Found image: ${imageUrl.substring(0, 80)}`);
      
      const res = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error(res.statusText);

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = imageUrl.split('.').pop().split(/[#?]/)[0] || 'jpg';
      const fileName = `products/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

      await supabase.storage.from('product-images').upload(fileName, buffer, { contentType: res.headers.get('content-type') || 'image/jpeg' });
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      
      const targetProducts = products.filter(p => p.name === productName);
      for (const p of targetProducts) {
        await supabase.from('products').update({ image_url: publicUrl }).eq('id', p.id);
      }
      
      console.log(`  -> Uploaded!`);
      updated++;
    } catch (e) {
      console.log(`  -> Failed: ${e.message}`);
    }
  }
  
  await browser.close();
  console.log(`Finished. Updated ${updated} items.`);
}

main();
