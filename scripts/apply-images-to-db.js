import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
const dataLines = lines.slice(1); // skip header

// Build name → image_url map
const imageMap = {};
for (const line of dataLines) {
  // Parse CSV row (handle quoted fields)
  const match = line.match(/^([^,]+),([^,]+),/);
  if (!match) continue;
  const productName = match[1].replace(/^"|"$/g, '');
  const imageUrl = match[2].replace(/^"|"$/g, '');
  if (imageUrl === 'needs_manual_review') continue;
  imageMap[productName] = imageUrl;
}

console.log(`Loaded ${Object.keys(imageMap).length} image mappings from CSV`);

async function main() {
  // Fetch all products from DB
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (error) {
    console.error('Failed to fetch products:', error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products in database`);

  let updated = 0;
  let skipped = 0;
  let noMatch = 0;

  for (const product of products) {
    const newImageUrl = imageMap[product.name];
    if (!newImageUrl) {
      noMatch++;
      continue;
    }

    if (product.image_url === newImageUrl) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: newImageUrl })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Failed to update "${product.name}":`, updateError.message);
    } else {
      updated++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Already correct: ${skipped}`);
  console.log(`  No CSV match: ${noMatch}`);
}

main();
