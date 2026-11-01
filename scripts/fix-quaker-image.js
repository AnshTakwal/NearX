import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import https from 'https';
import http from 'http';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Download image from BigBasket
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`Redirecting to: ${res.headers.location}`);
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

try {
  // Try BigBasket image first
  const imageUrl = 'https://www.bbassets.com/media/uploads/p/l/208345_25-quaker-oats-breakfast-cereal-rich-in-protein-dietary-fibre-nutritious-easy-to-cook.jpg';
  console.log('Downloading Quaker Oats image...');
  const imageBuffer = await downloadImage(imageUrl);
  console.log(`Downloaded ${imageBuffer.length} bytes`);

  // Upload to Supabase storage
  const fileName = `${Date.now()}-quaker-oats.jpg`;
  const filePath = `products/${fileName}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    process.exit(1);
  }

  console.log('Uploaded:', uploadData);
  
  // Get public URL
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
  const newImageUrl = urlData.publicUrl;
  console.log('New image URL:', newImageUrl);

  // Update both Quaker Oats products
  const { data: updateData, error: updateError } = await supabase
    .from('products')
    .update({ image_url: newImageUrl })
    .ilike('name', '%quaker oats%')
    .select('id, name, image_url');

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log(`Updated ${updateData.length} products:`);
    updateData.forEach(p => console.log(`  ${p.name} -> ${p.image_url}`));
  }
} catch (err) {
  console.error('Error:', err.message);
}

