import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, '..', 'nearx_product_images.csv');
const finalPath = resolve(__dirname, '..', 'product_images_full.csv');

const content = readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim());
const header = lines[0];
const dataLines = lines.slice(1);

console.log(`Total rows (excluding header): ${dataLines.length}`);

// Check for duplicate image URLs
const urls = {};
const dupes = [];
for (const line of dataLines) {
  // Simple CSV parsing - get image_url (2nd field)
  const parts = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  if (!parts || parts.length < 2) continue;
  const url = parts[1].replace(/^,/, '').replace(/^"|"$/g, '');
  if (url === 'needs_manual_review') continue;
  if (urls[url]) {
    dupes.push({ url, first: urls[url], second: line.split(',')[0] });
  } else {
    urls[url] = line.split(',')[0];
  }
}

console.log(`Unique image URLs: ${Object.keys(urls).length}`);
console.log(`Duplicate URLs found: ${dupes.length}`);
if (dupes.length > 0) {
  for (const d of dupes) {
    console.log(`  DUPE: ${d.url}`);
    console.log(`    Used by: ${d.first} AND ${d.second}`);
  }
}

// Count needs_manual_review
const manualCount = dataLines.filter(l => l.includes('needs_manual_review')).length;
console.log(`Needs manual review: ${manualCount}`);

// Check every product has a source_page
const noSource = dataLines.filter(l => {
  const parts = l.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
  if (!parts || parts.length < 3) return true;
  const src = parts[2].replace(/^,/, '').replace(/^"|"$/g, '');
  return !src.trim();
});
console.log(`Missing source_page: ${noSource.length}`);

// Copy to final file
copyFileSync(csvPath, finalPath);
console.log(`\nCopied to: ${finalPath}`);
console.log('Done!');
