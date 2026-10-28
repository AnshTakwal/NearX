const fs = require('fs');
const sql = fs.readFileSync('database/seed_100_products.sql', 'utf8');
const js = fs.readFileSync('scripts/seed-stores.js', 'utf8');

const nameToUrl = {};
const regex = /\('ssssssss-ssss-ssss-ssss-ssssssssssss', '([^']+)', '[^']+', '[^']+', '[^']+', '([^']+)'/g;
let match;
while ((match = regex.exec(sql)) !== null) {
  nameToUrl[match[1]] = match[2];
}

let newJs = js;
let replaced = 0;
for (const [name, url] of Object.entries(nameToUrl)) {
  const nameRegex = new RegExp("name: '" + name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + "',.*?image_url: '([^']+)'");
  const jsMatch = newJs.match(nameRegex);
  if (jsMatch && jsMatch[1] !== url) {
    newJs = newJs.replace(jsMatch[1], url);
    replaced++;
  }
}
fs.writeFileSync('scripts/seed-stores.js', newJs);
console.log('Replaced ' + replaced + ' image URLs.');
