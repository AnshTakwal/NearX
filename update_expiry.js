import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in process.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateExpiryDates() {
  console.log("Fetching all products...");
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, expiry_date');

  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }

  console.log(`Found ${products.length} products. Updating expiry dates by 10 days...`);

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    if (!product.expiry_date) continue;
    
    const expiry = new Date(product.expiry_date);
    expiry.setDate(expiry.getDate() + 10);
    const newExpiryDate = expiry.toISOString().split('T')[0];
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ expiry_date: newExpiryDate })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Error updating product ${product.id}:`, updateError);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`Done! Successfully updated ${successCount} products. Errors: ${errorCount}`);
}

updateExpiryDates();
