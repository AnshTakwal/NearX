import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Logging in as store owner...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'demostore@nearx.com',
    password: 'DemoStore@123'
  });

  if (authError) {
    console.error("Failed to login as store owner:", authError.message);
    process.exit(1);
  }

  console.log("Logged in. Parsing products...");
  const content = fs.readFileSync('./database/seed_100_products.sql', 'utf8');
  const lines = content.split('\n').filter(l => l.includes("('ssssssss-ssss-ssss-ssss-ssssssssssss'"));
  
  const products = lines.map(line => {
    const parts = line.match(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(?:CURRENT_DATE \+ INTERVAL '(\d+) days'|CURRENT_DATE \+ (\d+))/);
    
    if (!parts) return null;
    const days = parseInt(parts[11] || parts[12]);
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    return {
      store_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // use the actual complete_setup.sql store_id
      name: parts[2],
      brand: parts[3],
      category: parts[4],
      description: parts[5],
      image_url: parts[6],
      mrp: parseInt(parts[7]),
      discount_percent: parseInt(parts[8]),
      sale_price: parseInt(parts[9]),
      stock: parseInt(parts[10]),
      expiry_date: date.toISOString().split('T')[0],
      is_active: true,
      status: 'published'
    };
  }).filter(Boolean);

  console.log(`Parsed ${products.length} products. Deleting old products...`);

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('store_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

  if (deleteError) {
    console.error("Failed to delete old products:", deleteError);
  } else {
    console.log("Old products deleted.");
  }

  console.log("Inserting new products in batches...");
  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from('products').insert(batch);
    if (insertError) {
      console.error(`Failed to insert batch ${i}:`, insertError);
    } else {
      console.log(`Inserted ${batch.length} products...`);
    }
  }

  console.log("Done! You should now see actual images instead of emojis.");
}

seed();
