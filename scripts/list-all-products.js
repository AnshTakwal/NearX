import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Get ALL active products, sorted by name, to see what images they have
const { data, error } = await supabase
  .from('products')
  .select('id, name, brand, image_url, category, is_active')
  .eq('is_active', true)
  .order('name');

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Found ${data.length} active products:`);
  data.forEach(p => {
    const imgFile = p.image_url.split('/').pop();
    console.log(`${p.name} | ${p.brand} | ${p.category} | ${imgFile}`);
  });
}

