import { createClient } from '@supabase/supabase-js';
import { readFileSync, appendFileSync } from 'fs';
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

async function fetchOffImage(brand, name) {
  let query = `${brand} ${name}`.trim().toLowerCase();
  
  // Clean up terms that confuse the search
  query = query.replace(/\s*\(pack of \d+\)\s*/g, ' ');
  query = query.replace(/\s*\d+(g|ml|kg|l)\s*/g, ' ');

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`;
  
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
  if (!res.ok) {
    if (res.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`OFF HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.products && data.products.length > 0) {
    // Look for the first product with a valid image_front_url
    for (const p of data.products) {
      if (p.image_front_url) {
        return p.image_front_url;
      }
    }
  }
  return null;
}

async function processProduct(p, logFile) {
  try {
    const offUrl = await fetchOffImage(p.brand || '', p.name);
    if (!offUrl) {
      console.log(`[NOT FOUND] ${p.name}`);
      appendFileSync(logFile, JSON.stringify({ id: p.id, name: p.name, status: 'needs_manual_review' }) + '\n');
      return 'needs_manual_review';
    }

    // Download image
    const imgRes = await fetch(offUrl);
    if (!imgRes.ok) throw new Error('Failed to download image from OFF');
    const buffer = await imgRes.arrayBuffer();

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = offUrl.split('.').pop().split('?')[0] || 'jpg';
    const filePath = `products/${timestamp}-${random}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: imgRes.headers.get('content-type') || 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
      
    const finalUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: finalUrl })
      .eq('name', p.name);

    if (updateError) throw updateError;

    console.log(`[SUCCESS] ${p.name} -> ${finalUrl}`);
    appendFileSync(logFile, JSON.stringify({ id: p.id, name: p.name, status: 'success', url: finalUrl }) + '\n');
    return 'success';

  } catch (err) {
    if (err.message === 'RATE_LIMITED') {
      console.error(`[RATE LIMITED] Stopping batch.`);
      return 'RATE_LIMITED';
    }
    console.error(`[ERROR] ${p.name}: ${err.message}`);
    appendFileSync(logFile, JSON.stringify({ id: p.id, name: p.name, status: 'error', error: err.message }) + '\n');
    return 'error';
  }
}

async function main() {
  const { data: products } = await supabase.from('products').select('id, brand, name, image_url');
  
  // Deduplicate
  const unique = [];
  const seen = new Set();
  for (const p of products) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      unique.push(p);
    }
  }

  // Find products that still need images
  const needsImage = unique.filter(p => !p.image_url || !p.image_url.includes('product-images/products/'));
  const logFile = resolve(__dirname, '..', 'image-sourcing-log.jsonl');

  const batch = needsImage; // process all
  console.log(`Starting batch of ${batch.length} using Open Food Facts...`);

  let successCount = 0;
  let manualCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    const status = await processProduct(p, logFile);
    if (status === 'RATE_LIMITED') {
      console.log('Got rate limited! Try increasing delay.');
      break;
    }
    if (status === 'success') successCount++;
    if (status === 'needs_manual_review') manualCount++;
    
    // HEAVY THROTTLING: Wait 5 seconds between products
    console.log(`Waiting 5 seconds before next request...`);
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`Batch finished. Success: ${successCount}, Not Found/Review: ${manualCount}`);
}

main();
