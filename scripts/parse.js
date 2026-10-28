const fs = require('fs');

async function seed() {
  const content = fs.readFileSync('c:/Users/ansht/OneDrive/Desktop/NearX/database/seed_100_products.sql', 'utf8');
  const lines = content.split('\n').filter(l => l.includes("('ssssssss-ssss-ssss-ssss-ssssssssssss'"));
  
  const products = lines.map(line => {
    // We match: ('store_id', 'name', 'brand', 'category', 'desc', 'image', mrp, discount, sale, stock, CURRENT_DATE + INTERVAL 'X days'
    const parts = line.match(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(?:CURRENT_DATE \+ INTERVAL '(\d+) days'|CURRENT_DATE \+ (\d+))/);
    
    if (!parts) return null;
    const days = parseInt(parts[11] || parts[12]);
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    return {
      store_id: parts[1],
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

  console.log(products.length + ' products parsed');
  fs.writeFileSync('c:/Users/ansht/OneDrive/Desktop/NearX/database/products_data.json', JSON.stringify(products, null, 2));
}
seed();
