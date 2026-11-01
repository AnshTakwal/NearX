import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// List all images in the product-images bucket
const { data, error } = await supabase.storage.from('product-images').list('products', {
  limit: 500,
  sortBy: { column: 'name', order: 'asc' }
});

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} images in storage:`);
  // Find images that might be Quaker-related
  data.forEach(f => {
    console.log(`  ${f.name}  (${f.metadata?.size || 'unknown'} bytes, created: ${f.created_at})`);
  });
}

