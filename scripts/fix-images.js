import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as google from 'googlethis';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manual .env parser
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

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function searchImage(query) {
  const options = { page: 0, safe: false, parse_ads: false };
  const results = await google.image(query + ' product white background', options);
  
  if (results && results.length > 0) {
    // Filter out known bad domains
    const valid = results.find(r => 
      !r.url.includes('alamy') && 
      !r.url.includes('shutterstock') && 
      !r.url.includes('indiamart') &&
      !r.url.includes('.svg') &&
      !r.url.includes('depositphotos') &&
      (r.url.endsWith('.jpg') || r.url.endsWith('.png') || r.url.endsWith('.webp') || r.url.includes('.jpg?') || r.url.includes('.png?'))
    );
    return valid ? valid.url : results[0].url;
  }
  return null;
}

const MANUAL_OVERRIDES = {
  'Maggi 2-Minute Noodles Masala (Pack of 12)': 'https://www.bigbasket.com/media/uploads/p/l/1212774_1-maggi-2-minute-instant-noodles-masala.jpg',
  'Nescafe Ready to Drink Cold Coffee 180ml': 'https://www.bigbasket.com/media/uploads/p/l/40182759_3-nescafe-cold-coffee-intense.jpg',
  'Mother Dairy Classic Curd 400g': 'https://www.bigbasket.com/media/uploads/p/l/241014_9-mother-dairy-classic-curd.jpg',
  'Amul Cheese Slices 200g': 'https://www.bigbasket.com/media/uploads/p/l/265061_8-amul-cheese-slices.jpg',
  'Tata Salt 1kg': 'https://www.bigbasket.com/media/uploads/p/l/274020_3-tata-salt.jpg',
};

async function fixImages() {
  console.log("🔍 Fetching unique products from DB...");
  const { data: products, error } = await supabase.from('products').select('name, image_url');
  
  if (error) {
    console.error("❌ Error fetching products:", error.message);
    return;
  }

  // Get unique names to avoid searching same product multiple times
  const uniqueProducts = Array.from(new Set(products.map(p => p.name)));
  console.log(`Found ${uniqueProducts.length} unique products.`);
  
  let successCount = 0;
  
  for (let i = 0; i < uniqueProducts.length; i++) {
    const name = uniqueProducts[i];
    
    // Check if we already updated it with BigBasket URL (from previous run)
    const existing = products.find(p => p.name === name);
    if (existing && existing.image_url.includes('bigbasket.com')) {
      console.log(`[${i+1}/${uniqueProducts.length}] ⏭️ Skipping (already fixed): ${name}`);
      continue;
    }

    let newImageUrl = MANUAL_OVERRIDES[name];
    
    if (newImageUrl) {
      console.log(`[${i+1}/${uniqueProducts.length}] ✅ Using manual override for: ${name}`);
    } else {
      console.log(`[${i+1}/${uniqueProducts.length}] 🌐 Searching Google Images for: ${name}`);
      try {
        newImageUrl = await searchImage(name);
        // Add a small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`  ❌ Search failed for ${name}`, err.message);
        continue;
      }
    }
    
    if (newImageUrl) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ image_url: newImageUrl })
        .eq('name', name);
        
      if (updateErr) {
        console.error(`  ❌ Failed to update ${name}:`, updateErr.message);
      } else {
        console.log(`  ✅ Updated ${name} -> ${newImageUrl}`);
        successCount++;
      }
    }
  }
  
  console.log(`\n🎉 Image fix complete! Updated ${successCount}/${uniqueProducts.length} unique products.`);
}

fixImages();
