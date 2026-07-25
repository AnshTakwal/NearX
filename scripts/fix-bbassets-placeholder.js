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

async function main() {
  const placeholderPath = 'C:\\Users\\ansht\\.gemini\\antigravity-ide\\brain\\f4f538af-7092-46f6-b42f-382f003db72b\\generic_grocery_1784974827388.png';
  let buffer;
  try {
    buffer = readFileSync(placeholderPath);
  } catch(e) {
    console.error("Placeholder not found at", placeholderPath, e);
    process.exit(1);
  }

  // Upload placeholder to Supabase
  const fileName = `products/placeholder-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, buffer, { contentType: 'image/png' });
    
  if (uploadError) {
    console.error("Upload error:", uploadError);
    process.exit(1);
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);
    
  console.log("Uploaded placeholder to:", publicUrl);

  // Update all bbassets.com links
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name')
    .like('image_url', '%bbassets.com%');

  if (error) {
    console.error("Select error:", error);
    process.exit(1);
  }

  console.log(`Updating ${products.length} products...`);
  
  // Batch update
  const { error: updateError } = await supabase
    .from('products')
    .update({ image_url: publicUrl })
    .like('image_url', '%bbassets.com%');

  if (updateError) {
    console.error("Update error:", updateError);
  } else {
    console.log("Done! All broken images replaced with placeholder.");
  }
}

main();
