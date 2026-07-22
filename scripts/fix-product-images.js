/**
 * scripts/fix-product-images.js
 * 
 * Fetches accurate front-of-pack images from Open Food Facts / Open Beauty Facts.
 * Usage: 
 *   node scripts/fix-product-images.js --dry-run
 *   node scripts/fix-product-images.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env
try {
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
} catch (e) {
  console.warn("⚠️  Could not read .env file, relying on environment variables.");
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const isDryRun = process.argv.includes('--dry-run');
const USER_AGENT = 'NearX-ProductFixer/2.0 (contact: admin@nearx.store)';

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      if (res.status === 429 || res.status === 503) {
        throw new Error('Rate limited');
      }
      if (!res.ok) {
        return { products: [] };
      }
      return await res.json();
    } catch (e) {
      if (e.message === 'Rate limited' && i < retries - 1) {
        console.log(`  ⏳ Rate limited, waiting ${3000 * (i + 1)}ms...`);
        await delay(3000 * (i + 1));
      } else {
        throw e;
      }
    }
  }
}

async function downloadImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get('content-type') || 'image/jpeg'
  };
}

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
  console.log(`🚀 Starting Image Fixer ${isDryRun ? '(DRY RUN)' : ''}...`);

  const { data: products, error } = await supabase.from('products').select('*');
  if (error) throw error;

  // Group by unique name/brand to avoid duplicate work
  const uniqueItems = new Map();
  for (const p of products) {
    const key = `${p.brand}-${p.name}`;
    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, {
        name: p.name,
        brand: p.brand || '',
        category: p.category,
        ids: [],
        current_image_url: p.image_url
      });
    }
    uniqueItems.get(key).ids.push(p.id);
  }

  const report = [];
  let count = 0;
  const total = uniqueItems.size;

  for (const [key, item] of uniqueItems.entries()) {
    count++;
    
    // Check if it's already in our bucket
    if (item.current_image_url && item.current_image_url.includes('supabase.co/storage/v1/object/public/product-images')) {
      console.log(`[${count}/${total}] ⏭️  Skipping (Already in bucket): ${item.name}`);
      report.push({ name: item.name, outcome: 'skipped_manual_upload', source_url_used: item.current_image_url });
      continue;
    }

    // Build query without doubling the brand
    let searchStr = item.name;
    if (item.brand && !item.name.toLowerCase().includes(item.brand.toLowerCase())) {
      searchStr = `${item.brand} ${item.name}`;
    }

    console.log(`[${count}/${total}] 🔍 Searching for: ${searchStr}`);
    
    const baseUrl = item.category === 'Cleaning' 
      ? 'https://world.openbeautyfacts.org' 
      : 'https://world.openfoodfacts.org';
      
    const searchTerms = encodeURIComponent(searchStr);
    const searchUrl = `${baseUrl}/cgi/search.pl?search_terms=${searchTerms}&search_simple=1&action=process&json=1&page_size=5`;
    
    let matchedProduct = null;
    let matchUrl = null;

    try {
      const result = await fetchJson(searchUrl);
      await delay(1500); // Wait 1.5s between requests to respect rate limits

      if (result && result.products) {
        for (const fp of result.products) {
          const apiName = normalize(fp.product_name);
          const apiBrand = normalize(fp.brands);
          const dbName = normalize(item.name);
          const dbBrand = normalize(item.brand);

          // Substring match check
          const nameMatches = apiName && (apiName.includes(dbName) || dbName.includes(apiName));
          const brandMatches = apiBrand && dbBrand && (apiBrand.includes(dbBrand) || dbBrand.includes(apiBrand));
          
          // Loose match: at least one word >3 chars overlaps
          const looseMatch = apiName && dbName && (
            item.name.toLowerCase().split(' ').some(word => word.length > 3 && apiName.includes(normalize(word)))
          );

          if ((nameMatches || brandMatches || looseMatch) && fp.image_front_url) {
            matchedProduct = fp;
            matchUrl = fp.image_front_url;
            break;
          }
        }
      }
    } catch (err) {
      console.error(`  ❌ API Error: ${err.message}`);
    }

    if (!matchUrl) {
      console.log(`  ⚠️  No match found for: ${item.name}`);
      report.push({ 
        name: item.name, 
        outcome: item.category === 'Cleaning' ? 'category_unsupported' : 'no_match', 
        source_url_used: null 
      });
      
      if (!isDryRun) {
        // Clear bad external URL to a safe placeholder so we don't leave confidently wrong photos
        const placeholderUrl = 'https://placehold.co/400x400/eeeeee/999999?text=No+Image';
        const { error: dbError } = await supabase
          .from('products')
          .update({ image_url: placeholderUrl })
          .in('id', item.ids);
        if (dbError) console.error(`  ❌ Failed to set placeholder for ${item.name}:`, dbError.message);
        else console.log(`  🧹 Cleared bad image to placeholder for ${item.name}`);
      }
      continue;
    }

    console.log(`  ✅ Match found: ${matchedProduct.product_name} -> ${matchUrl}`);
    report.push({ 
      name: item.name, 
      outcome: 'matched', 
      source_url_used: matchUrl 
    });

    if (!isDryRun) {
      try {
        console.log(`  ⬇️  Downloading image...`);
        const { buffer, contentType } = await downloadImage(matchUrl);
        
        const ext = matchUrl.split('.').pop().split('?')[0] || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `products/${fileName}`;
        
        console.log(`  ⬆️  Uploading to Supabase...`);
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, buffer, { contentType, upsert: false });
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        console.log(`  💾 Updating ${item.ids.length} database rows...`);
        const { error: dbError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .in('id', item.ids);
          
        if (dbError) throw dbError;
      } catch (err) {
        console.error(`  ❌ Failed to process/upload image: ${err.message}`);
      }
    }
  }

  writeFileSync(resolve(__dirname, '..', 'image-fix-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n🎉 Finished! Report saved to image-fix-report.json`);
}

run().catch(console.error);
