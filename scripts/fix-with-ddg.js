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

const failedData = JSON.parse(readFileSync(resolve(__dirname, '..', 'final-image-upload-report.json'), 'utf8'));
const failedProducts = [...new Set(failedData.filter(d => d.status === 'error').map(e => e.name))];

async function searchDuckDuckGoImage(productName) {
  try {
    const query = `${productName} front pack packaging white background`;
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const html = await res.text();
    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];
    
    const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!imgRes.ok) return null;
    
    const data = await imgRes.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].image;
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, name');
  
  let updated = 0;
  for (const productName of failedProducts) {
    console.log(`Fixing ${productName}...`);
    const imageUrl = await searchDuckDuckGoImage(productName);
    
    if (!imageUrl) {
      console.log(`  -> Failed to find image online`);
      continue;
    }
    
    console.log(`  -> Found image: ${imageUrl.substring(0, 50)}...`);
    
    try {
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
      
      console.log(`  -> Uploaded and updated ${targetProducts.length} rows`);
      updated++;
    } catch (e) {
      console.log(`  -> Download/Upload failed: ${e.message}`);
    }
  }
  
  console.log(`Done! Fixed ${updated} out of ${failedProducts.length} unique products.`);
}

main();
