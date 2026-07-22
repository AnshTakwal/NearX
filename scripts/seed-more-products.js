/**
 * seed-more-products.js — Adds more products to each store to reach 60-70 per store.
 * Run AFTER seed-stores.js.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
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
} catch (e) {}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Store IDs from the previous seed run
const STORE_A = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';  // Fresh Mart
const STORE_B = '24ff09a5-a788-4ff2-b53d-a2b2de379f6e';  // Rahul Supermarket
const STORE_C = '41da4325-d385-4d41-9ffc-64ca660b2ce0';  // Priya Fresh Mart

const today = new Date();
function expiry(days) {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Additional products to bring each store to 65-70
const EXTRA_PRODUCTS = [
  // ═══ MORE SHARED (all 3 stores) ═══
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Amul Paneer 200g', brand: 'Amul', category: 'Dairy', description: 'Fresh cottage cheese block', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/397456a.jpg', mrp: 8500, discount_percent: 30, sale_price: 5950, stock: 10, expiry_days: 5 },
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Parle-G Biscuits 250g', brand: 'Parle', category: 'Snacks', description: 'India\'s favourite glucose biscuit', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/126683a.jpg', mrp: 2200, discount_percent: 25, sale_price: 1650, stock: 60, expiry_days: 45 },
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Tata Tea Gold 500g', brand: 'Tata', category: 'Beverages', description: 'Premium leaf tea', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/22936a.jpg', mrp: 26000, discount_percent: 15, sale_price: 22100, stock: 14, expiry_days: 60 },
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Fortune Sunlite Oil 1L', brand: 'Fortune', category: 'Pantry', description: 'Refined sunflower oil', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/259268a.jpg', mrp: 15500, discount_percent: 10, sale_price: 13950, stock: 18, expiry_days: 90 },
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Toor Dal 1kg', brand: 'Tata Sampann', category: 'Pantry', description: 'Unpolished toor dal', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/308273a.jpg', mrp: 16500, discount_percent: 15, sale_price: 14025, stock: 20, expiry_days: 90 },
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Catch Turmeric Powder 200g', brand: 'Catch', category: 'Pantry', description: 'Pure haldi powder', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23469a.jpg', mrp: 6500, discount_percent: 20, sale_price: 5200, stock: 22, expiry_days: 90 },
  { stores: [STORE_A, STORE_B, STORE_C], name: 'Catch Red Chilli Powder 200g', brand: 'Catch', category: 'Pantry', description: 'Pure lal mirch powder', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23471a.jpg', mrp: 7000, discount_percent: 20, sale_price: 5600, stock: 20, expiry_days: 90 },

  // ═══ STORE A EXCLUSIVE ═══
  { stores: [STORE_A], name: 'Amul Lassi Mango 200ml', brand: 'Amul', category: 'Dairy', description: 'Mango flavoured lassi', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/107631a.jpg', mrp: 2500, discount_percent: 35, sale_price: 1625, stock: 20, expiry_days: 5 },
  { stores: [STORE_A], name: 'Cadbury Gems 17.8g (Pack of 12)', brand: 'Cadbury', category: 'Snacks', description: 'Colorful chocolate buttons', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/282667a.jpg', mrp: 12000, discount_percent: 20, sale_price: 9600, stock: 14, expiry_days: 45 },
  { stores: [STORE_A], name: 'Maggi Pazzta Cheese Macaroni 70g', brand: 'Maggi', category: 'Pantry', description: 'Instant cheese macaroni', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23738a.jpg', mrp: 4500, discount_percent: 30, sale_price: 3150, stock: 18, expiry_days: 60 },
  { stores: [STORE_A], name: 'Glucon-D Orange 1kg', brand: 'Glucon-D', category: 'Beverages', description: 'Instant energy drink powder', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/22929a.jpg', mrp: 19500, discount_percent: 25, sale_price: 14625, stock: 10, expiry_days: 60 },
  { stores: [STORE_A], name: 'Himalaya Neem Face Wash 200ml', brand: 'Himalaya', category: 'Pantry', description: 'Purifying neem face wash', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50024a.jpg', mrp: 20000, discount_percent: 15, sale_price: 17000, stock: 8, expiry_days: 90 },
  { stores: [STORE_A], name: 'Vim Bar 300g (Pack of 3)', brand: 'Vim', category: 'Cleaning', description: 'Dishwash bar with lemon power', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46491a.jpg', mrp: 5500, discount_percent: 20, sale_price: 4400, stock: 20, expiry_days: 90 },
  { stores: [STORE_A], name: 'Basmati Rice 1kg', brand: 'India Gate', category: 'Pantry', description: 'Classic basmati rice', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/22015a.jpg', mrp: 17000, discount_percent: 10, sale_price: 15300, stock: 15, expiry_days: 90 },
  { stores: [STORE_A], name: 'Lijjat Papad Udad 200g', brand: 'Lijjat', category: 'Pantry', description: 'Traditional udad dal papad', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23563a.jpg', mrp: 7000, discount_percent: 15, sale_price: 5950, stock: 18, expiry_days: 60 },
  { stores: [STORE_A], name: 'Whisper Choice Wings XL 20 Pads', brand: 'Whisper', category: 'Pantry', description: 'Sanitary pads with wings', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50060a.jpg', mrp: 18000, discount_percent: 15, sale_price: 15300, stock: 12, expiry_days: 90 },
  { stores: [STORE_A], name: 'Closeup Everfresh Toothpaste 150g', brand: 'Closeup', category: 'Pantry', description: 'Gel toothpaste with mouthwash', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50050a.jpg', mrp: 9500, discount_percent: 25, sale_price: 7125, stock: 16, expiry_days: 90 },

  // ═══ STORE B EXCLUSIVE ═══
  { stores: [STORE_B], name: 'Amul Dark Chocolate 150g', brand: 'Amul', category: 'Snacks', description: 'Rich dark chocolate bar', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/282652a.jpg', mrp: 15000, discount_percent: 20, sale_price: 12000, stock: 10, expiry_days: 45 },
  { stores: [STORE_B], name: 'Maggi Cup Noodles Masala 70g', brand: 'Maggi', category: 'Pantry', description: 'Instant cup noodles masala', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23740a.jpg', mrp: 4500, discount_percent: 25, sale_price: 3375, stock: 25, expiry_days: 60 },
  { stores: [STORE_B], name: 'Pepsi 750ml', brand: 'Pepsi', category: 'Beverages', description: 'Cola flavoured carbonated drink', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/31627a.jpg', mrp: 3800, discount_percent: 25, sale_price: 2850, stock: 30, expiry_days: 30 },
  { stores: [STORE_B], name: 'Fanta Orange 750ml', brand: 'Fanta', category: 'Beverages', description: 'Orange flavoured carbonated drink', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/31629a.jpg', mrp: 3800, discount_percent: 25, sale_price: 2850, stock: 28, expiry_days: 30 },
  { stores: [STORE_B], name: 'Ghadi Detergent Powder 1kg', brand: 'Ghadi', category: 'Cleaning', description: 'Washing powder for all machines', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46505a.jpg', mrp: 6500, discount_percent: 15, sale_price: 5525, stock: 20, expiry_days: 90 },
  { stores: [STORE_B], name: 'Rin Advanced Detergent Bar 250g', brand: 'Rin', category: 'Cleaning', description: 'Detergent bar for bright whites', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46508a.jpg', mrp: 3000, discount_percent: 20, sale_price: 2400, stock: 30, expiry_days: 90 },
  { stores: [STORE_B], name: 'Dove Shampoo 340ml', brand: 'Dove', category: 'Pantry', description: 'Intense repair shampoo', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50030a.jpg', mrp: 32000, discount_percent: 15, sale_price: 27200, stock: 7, expiry_days: 90 },
  { stores: [STORE_B], name: 'Chana Dal 1kg', brand: 'Tata Sampann', category: 'Pantry', description: 'Unpolished chana dal', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/308274a.jpg', mrp: 13500, discount_percent: 10, sale_price: 12150, stock: 18, expiry_days: 90 },
  { stores: [STORE_B], name: 'Rajma 500g', brand: 'Tata Sampann', category: 'Pantry', description: 'Premium rajma beans', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/308276a.jpg', mrp: 10500, discount_percent: 15, sale_price: 8925, stock: 15, expiry_days: 90 },
  { stores: [STORE_B], name: 'Gillette Guard Razor (Pack of 3)', brand: 'Gillette', category: 'Pantry', description: 'Ultra thin blade cartridges', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50053a.jpg', mrp: 12500, discount_percent: 15, sale_price: 10625, stock: 10, expiry_days: 90 },
  { stores: [STORE_B], name: 'Moong Dal 1kg', brand: 'Tata Sampann', category: 'Pantry', description: 'Yellow split moong dal', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/308275a.jpg', mrp: 15000, discount_percent: 10, sale_price: 13500, stock: 16, expiry_days: 90 },

  // ═══ STORE C EXCLUSIVE ═══
  { stores: [STORE_C], name: 'Amul Kool Kesar 200ml', brand: 'Amul', category: 'Beverages', description: 'Kesar flavoured milk drink', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/107633a.jpg', mrp: 2500, discount_percent: 30, sale_price: 1750, stock: 20, expiry_days: 7 },
  { stores: [STORE_C], name: 'Bikaji Bhujia 400g', brand: 'Bikaji', category: 'Snacks', description: 'Crispy bikaneri bhujia', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/174715a.jpg', mrp: 11000, discount_percent: 25, sale_price: 8250, stock: 14, expiry_days: 30 },
  { stores: [STORE_C], name: 'Lijjat Papad Masala 200g', brand: 'Lijjat', category: 'Pantry', description: 'Masala papad', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23565a.jpg', mrp: 7500, discount_percent: 15, sale_price: 6375, stock: 16, expiry_days: 60 },
  { stores: [STORE_C], name: 'Vaseline Body Lotion 400ml', brand: 'Vaseline', category: 'Pantry', description: 'Intensive care cocoa glow body lotion', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50037a.jpg', mrp: 34500, discount_percent: 20, sale_price: 27600, stock: 9, expiry_days: 90 },
  { stores: [STORE_C], name: 'Sunsilk Shampoo 340ml', brand: 'Sunsilk', category: 'Pantry', description: 'Thick & long growth shampoo', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50032a.jpg', mrp: 27000, discount_percent: 15, sale_price: 22950, stock: 8, expiry_days: 90 },
  { stores: [STORE_C], name: 'Odo Mos Mosquito Repellent Spray 100ml', brand: 'Odo Mos', category: 'Cleaning', description: 'Personal mosquito repellent spray', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46560a.jpg', mrp: 7000, discount_percent: 25, sale_price: 5250, stock: 20, expiry_days: 90 },
  { stores: [STORE_C], name: 'Surf Excel Matic Liquid 1L', brand: 'Surf Excel', category: 'Cleaning', description: 'Liquid detergent for top load', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46506a.jpg', mrp: 24000, discount_percent: 15, sale_price: 20400, stock: 10, expiry_days: 90 },
  { stores: [STORE_C], name: 'Eno Fruit Salt Lemon 5g (Pack of 30)', brand: 'Eno', category: 'Pantry', description: 'Antacid for acidity relief', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50064a.jpg', mrp: 15000, discount_percent: 15, sale_price: 12750, stock: 16, expiry_days: 90 },
  { stores: [STORE_C], name: 'Everest Kitchen King Masala 100g', brand: 'Everest', category: 'Pantry', description: 'All-purpose cooking masala', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23486a.jpg', mrp: 8500, discount_percent: 20, sale_price: 6800, stock: 18, expiry_days: 90 },
  { stores: [STORE_C], name: 'Sugar 1kg', brand: 'Uttam', category: 'Pantry', description: 'White crystal sugar', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/22028a.jpg', mrp: 4700, discount_percent: 10, sale_price: 4230, stock: 30, expiry_days: 90 },
  { stores: [STORE_C], name: 'Britannia Cheese Garlic Bread 120g', brand: 'Britannia', category: 'Bakery', description: 'Garlic bread with cheese filling', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/126672a.jpg', mrp: 5000, discount_percent: 45, sale_price: 2750, stock: 7, expiry_days: 2 },
];

async function seedMore() {
  console.log("🛒 Adding more products to each store...\n");

  let counts = { [STORE_A]: 0, [STORE_B]: 0, [STORE_C]: 0 };

  for (const prod of EXTRA_PRODUCTS) {
    for (const storeId of prod.stores) {
      const stockVariation = Math.floor(Math.random() * 6) - 2;
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        name: prod.name,
        brand: prod.brand,
        category: prod.category,
        description: prod.description,
        image_url: prod.image_url,
        mrp: prod.mrp,
        discount_percent: prod.discount_percent,
        sale_price: prod.sale_price,
        stock: Math.max(1, prod.stock + stockVariation),
        expiry_date: expiry(prod.expiry_days),
        status: 'active',
        is_active: true,
      });
      if (error) console.error(`   ❌ ${prod.name} → ${storeId}:`, error.message);
      else counts[storeId]++;
    }
  }

  console.log(`   ✅ Added: Fresh Mart +${counts[STORE_A]}, Rahul +${counts[STORE_B]}, Priya +${counts[STORE_C]}`);

  // Final counts
  const { data: finalProducts } = await supabase.from('products').select('store_id').eq('is_active', true);
  const finalCounts = {};
  finalProducts?.forEach(p => { finalCounts[p.store_id] = (finalCounts[p.store_id] || 0) + 1; });
  console.log("\n📊 Final product counts per store:");
  for (const [id, count] of Object.entries(finalCounts)) {
    const label = id === STORE_A ? 'Fresh Mart' : id === STORE_B ? 'Rahul Supermarket' : 'Priya Fresh Mart';
    console.log(`   ${label}: ${count} products`);
  }
  console.log(`   Total active: ${finalProducts?.length} rows`);
  console.log("\n🎉 Done!");
}

seedMore();
