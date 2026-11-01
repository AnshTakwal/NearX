import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// List images in the 178483xxxx range (scraper batch from July 23) 
// that are NOT used by any current product - these might be the originals
const { data: products } = await supabase
  .from('products')
  .select('image_url')
  .order('name');

const usedImages = new Set(products.map(p => p.image_url.split('/').pop()));

const { data: files } = await supabase.storage.from('product-images').list('products', {
  limit: 500,
  sortBy: { column: 'name', order: 'asc' }
});

// Find unused images from the July 23 scraper batch
const unusedScraper = files.filter(f => {
  const ts = parseInt(f.name.split('-')[0]);
  return !usedImages.has(f.name) && ts >= 1784833000000 && ts <= 1784835000000;
});

console.log(`\n=== Unused scraper images (July 23 batch) ===`);
unusedScraper.forEach(f => {
  const url = `https://ebhjyczbjldqufvxoeqm.supabase.co/storage/v1/object/public/product-images/products/${f.name}`;
  console.log(`  ${f.name} (${f.metadata?.size || '?'} bytes) - ${url}`);
});

// Also find unused images from the user's manual upload batch (July 25)
const unusedManual = files.filter(f => {
  const ts = parseInt(f.name.split('-')[0]);
  return !usedImages.has(f.name) && ts >= 1784975000000 && ts <= 1784980000000;
});

console.log(`\n=== Unused manual upload images (July 25 batch) ===`);
unusedManual.forEach(f => {
  const url = `https://ebhjyczbjldqufvxoeqm.supabase.co/storage/v1/object/public/product-images/products/${f.name}`;
  console.log(`  ${f.name} (${f.metadata?.size || '?'} bytes) - ${url}`);
});
