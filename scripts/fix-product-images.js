import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
} catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const isDryRun = process.argv.includes('--dry-run');

const USER_AGENT = 'NearX-ProductSeed/1.0 (contact: test@example.com)';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchOpenFacts(query, isCleaning) {
  const baseUrl = isCleaning ? 'https://world.openbeautyfacts.org' : 'https://world.openfoodfacts.org';
  const url = `${baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      if (res.status === 503 || res.status === 429) {
        console.warn(`Rate limited by ${baseUrl}. Retrying...`);
        await delay(5000);
        return searchOpenFacts(query, isCleaning);
      }
      return null;
    }
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error(`Error fetching from ${baseUrl}:`, err.message);
    return null;
  }
}

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function verifyMatch(productName, productBrand, candidate) {
  const cName = candidate.product_name || '';
  const cBrands = candidate.brands || '';
  const cImage = candidate.image_front_url;

  if (!cImage || typeof cImage !== 'string') return false;

  const searchTarget = (cName + ' ' + cBrands).toLowerCase();
  
  // Basic substring check: either the brand or part of the name should match
  const nName = productName.toLowerCase();
  const nBrand = (productBrand || '').toLowerCase();
  
  const brandMatch = nBrand && searchTarget.includes(nBrand);
  const nameParts = nName.split(' ').filter(p => p.length > 2);
  const nameMatch = nameParts.length > 0 && nameParts.some(p => searchTarget.includes(p));

  return brandMatch || nameMatch;
}

async function uploadToSupabase(imageUrl, productName) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Guess extension
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const path = `products/${timestamp}-${random}.${ext}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(path);
    return publicData.publicUrl;
  } catch (err) {
    console.error('Download/Upload error:', err.message);
    return null;
  }
}

async function main() {
  console.log(`Starting Product Image Fixer ${isDryRun ? '(DRY RUN)' : '(REAL RUN)'}`);
  
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('DB Error:', error);
    process.exit(1);
  }

  // Group by name to avoid fetching same product multiple times
  const uniqueProducts = new Map();
  for (const p of products) {
    if (!uniqueProducts.has(p.name)) {
      uniqueProducts.set(p.name, p);
    }
  }

  const report = [];
  let matchedCount = 0;
  let noMatchCount = 0;
  let categoryUnsupportedCount = 0;

  const usedImageUrls = new Set();
  
  const productList = Array.from(uniqueProducts.values());
  for (let i = 0; i < productList.length; i++) {
    const p = productList[i];
    console.log(`[${i+1}/${productList.length}] Processing: ${p.name}`);
    
    const isCleaning = p.category === 'Cleaning';
    const query = `${p.brand || ''} ${p.name}`.trim();
    
    let candidates = await searchOpenFacts(query, isCleaning);
    await delay(3000); // Higher rate limit protection
    
    let outcome = 'no_match';
    let source_url_used = null;
    let final_public_url = null;

    if (candidates && candidates.length > 0) {
      for (const c of candidates) {
        if (verifyMatch(p.name, p.brand, c)) {
          if (!usedImageUrls.has(c.image_front_url)) {
            outcome = 'matched';
            source_url_used = c.image_front_url;
            usedImageUrls.add(source_url_used);
            break;
          }
        }
      }
    } else {
      if (isCleaning) categoryUnsupportedCount++;
    }

    if (outcome === 'matched' && !isDryRun) {
       final_public_url = await uploadToSupabase(source_url_used, p.name);
       if (final_public_url) {
         // Update all products with this exact name
         await supabase.from('products').update({ image_url: final_public_url }).eq('name', p.name);
       } else {
         outcome = 'no_match'; // upload failed
       }
    }

    report.push({
      product_id: p.id,
      name: p.name,
      outcome,
      source_url_used,
      final_public_url
    });

    if (outcome === 'matched') matchedCount++;
    else noMatchCount++;
  }

  const reportData = {
    summary: {
      total: productList.length,
      matched: matchedCount,
      no_match: noMatchCount,
      category_unsupported: categoryUnsupportedCount
    },
    details: report
  };

  writeFileSync(resolve(__dirname, '..', 'image-fix-report.json'), JSON.stringify(reportData, null, 2));
  console.log(`\nReport generated at image-fix-report.json`);
  console.log(`Matched: ${matchedCount}, No Match: ${noMatchCount}`);
}

main();
