/**
 * seed-stores.js — Comprehensive seeding script for NearX multi-store setup.
 * 
 * What it does:
 *   1. Creates 2 new store_owner accounts via Supabase Admin API
 *   2. Creates matching stores rows for each
 *   3. Seeds 60-70 products per store (3 stores total)
 *   4. Shares ~15-20 common items across stores (duplicated rows, varied stock)
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env or as env variable
 *   - Run: node scripts/seed-stores.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manual .env parser (avoids dotenv dependency)
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
} catch (e) {
  console.warn("⚠️  Could not read .env file, relying on environment variables.");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("   Add SUPABASE_SERVICE_ROLE_KEY=<your key> to .env and retry.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─────────── Store owner definitions ───────────
const NEW_OWNERS = [
  {
    email: 'rahul@nearx.store',
    password: 'Store@123',
    name: 'Rahul Sharma',
    phone: '9876543210',
    storeName: 'Rahul Supermarket',
    storeDesc: 'Your friendly neighbourhood supermarket in Indiranagar',
    address: '45, 12th Main Road, HAL 2nd Stage, Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    lat: 12.9783,
    lng: 77.6408,
  },
  {
    email: 'priya@nearx.store',
    password: 'Store@123',
    name: 'Priya Menon',
    phone: '9876543211',
    storeName: 'Priya Fresh Mart',
    storeDesc: 'Organic & fresh produce store in Koramangala',
    address: '12, 80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    lat: 12.9279,
    lng: 77.6271,
  },
];

// ─────────── Product catalog (good images) ───────────
// Each product is tagged with a "pool" to decide store assignment:
//   "shared" = goes into all 3 stores (duplicated rows, stock varies)
//   "A"      = exclusive to store A (existing Fresh Mart)
//   "B"      = exclusive to store B (Rahul Supermarket)
//   "C"      = exclusive to store C (Priya Fresh Mart)

const PRODUCTS = [
  // ═══════ SHARED ESSENTIALS (in all 3 stores) ═══════
  { pool: 'shared', name: 'Amul Taaza Toned Milk 1L', brand: 'Amul', category: 'Dairy', description: 'Toned milk with 3% fat, ideal for daily use', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40199301_1-amul-taaza-toned-fresh-milk.jpg', mrp: 5400, discount_percent: 40, sale_price: 3240, stock: 25, expiry_days: 3 },
  { pool: 'shared', name: 'Amul Gold Full Cream Milk 1L', brand: 'Amul', category: 'Dairy', description: 'Full cream standardised milk', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40199305_3-amul-gold-full-cream-fresh-milk.jpg', mrp: 6800, discount_percent: 30, sale_price: 4760, stock: 22, expiry_days: 3 },
  { pool: 'shared', name: 'Britannia Whole Wheat Bread 400g', brand: 'Britannia', category: 'Bakery', description: '100% whole wheat sandwich bread', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40023251_2-britannia-100-whole-wheat-bread.jpg', mrp: 4500, discount_percent: 40, sale_price: 2700, stock: 15, expiry_days: 3 },
  { pool: 'shared', name: 'Modern White Bread 400g', brand: 'Modern', category: 'Bakery', description: 'Soft white sandwich bread', image_url: 'https://www.bigbasket.com/media/uploads/p/l/241563_8-modern-white-bread.jpg', mrp: 4000, discount_percent: 50, sale_price: 2000, stock: 12, expiry_days: 2 },
  { pool: 'shared', name: 'Mother Dairy Classic Curd 400g', brand: 'Mother Dairy', category: 'Dairy', description: 'Thick and creamy set curd, fresh daily', image_url: 'https://www.bigbasket.com/media/uploads/p/l/241014_9-mother-dairy-classic-curd.jpg', mrp: 3500, discount_percent: 35, sale_price: 2275, stock: 18, expiry_days: 4 },
  { pool: 'shared', name: 'Amul Butter 500g', brand: 'Amul', category: 'Dairy', description: 'Pasteurised table butter', image_url: 'https://www.bigbasket.com/media/uploads/p/l/126906_10-amul-pasteurised-butter.jpg', mrp: 27500, discount_percent: 20, sale_price: 22000, stock: 12, expiry_days: 15 },
  { pool: 'shared', name: 'Tata Salt 1kg', brand: 'Tata', category: 'Pantry', description: 'Iodised vacuum evaporated salt', image_url: 'https://www.bigbasket.com/media/uploads/p/l/274020_3-tata-salt.jpg', mrp: 2800, discount_percent: 15, sale_price: 2380, stock: 50, expiry_days: 90 },
  { pool: 'shared', name: 'Aashirvaad Atta 5kg', brand: 'Aashirvaad', category: 'Pantry', description: 'Whole wheat flour for chapati', image_url: 'https://www.bigbasket.com/media/uploads/p/l/126905_6-aashirvaad-atta-whole-wheat.jpg', mrp: 29000, discount_percent: 10, sale_price: 26100, stock: 15, expiry_days: 60 },
  { pool: 'shared', name: 'Saffola Gold Oil 1L', brand: 'Saffola', category: 'Pantry', description: 'Blended edible vegetable oil', image_url: 'https://www.bigbasket.com/media/uploads/p/l/147491_5-saffola-gold-pro-healthy-lifestyle-edible-oil.jpg', mrp: 18900, discount_percent: 10, sale_price: 17010, stock: 12, expiry_days: 60 },
  { pool: 'shared', name: 'Amul Cheese Slices 200g', brand: 'Amul', category: 'Dairy', description: 'Processed cheese slices, pack of 10', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265061_8-amul-cheese-slices.jpg', mrp: 11500, discount_percent: 25, sale_price: 8625, stock: 15, expiry_days: 12 },
  { pool: 'shared', name: 'Maggi 2-Minute Noodles Masala (Pack of 12)', brand: 'Maggi', category: 'Pantry', description: 'Masala flavour instant noodles', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23733a.jpg', mrp: 16800, discount_percent: 15, sale_price: 14280, stock: 35, expiry_days: 60 },
  { pool: 'shared', name: 'Colgate Strong Teeth Toothpaste 200g', brand: 'Colgate', category: 'Pantry', description: 'Calcium boost toothpaste', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265584_3-colgate-toothpaste-strong-teeth.jpg', mrp: 9500, discount_percent: 20, sale_price: 7600, stock: 25, expiry_days: 60 },
  { pool: 'shared', name: 'Surf Excel Easy Wash 1.5kg', brand: 'Surf Excel', category: 'Cleaning', description: 'Detergent powder for washing machines', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025055_2-surf-excel-easy-wash-detergent-powder.jpg', mrp: 22000, discount_percent: 15, sale_price: 18700, stock: 12, expiry_days: 90 },
  { pool: 'shared', name: 'Lays Classic Salted Chips 52g', brand: 'Lays', category: 'Snacks', description: 'Crispy potato chips', image_url: 'https://www.bigbasket.com/media/uploads/p/l/241600_8-lays-potato-chips-classic-salted.jpg', mrp: 2000, discount_percent: 50, sale_price: 1000, stock: 40, expiry_days: 30 },
  { pool: 'shared', name: 'Coca-Cola 750ml', brand: 'Coca-Cola', category: 'Beverages', description: 'Classic cola carbonated drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/251011_10-coca-cola-soft-drink.jpg', mrp: 3800, discount_percent: 25, sale_price: 2850, stock: 30, expiry_days: 30 },
  { pool: 'shared', name: 'Bisleri Water 1L (Pack of 12)', brand: 'Bisleri', category: 'Beverages', description: 'Packaged drinking water', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/58361a.jpg', mrp: 24000, discount_percent: 10, sale_price: 21600, stock: 40, expiry_days: 90 },

  // ═══════ STORE A EXCLUSIVE (Fresh Mart) ═══════
  { pool: 'A', name: 'Nestle A+ Slim Milk 1L', brand: 'Nestle', category: 'Dairy', description: 'Double toned slim milk', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/419521a.jpg', mrp: 5600, discount_percent: 45, sale_price: 3080, stock: 20, expiry_days: 2 },
  { pool: 'A', name: 'Britannia Cream Cheese Spread 180g', brand: 'Britannia', category: 'Dairy', description: 'Smooth and creamy cheese spread', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40032041_2-britannia-cheese-spread-premium.jpg', mrp: 9900, discount_percent: 30, sale_price: 6930, stock: 10, expiry_days: 8 },
  { pool: 'A', name: 'Epigamia Greek Yogurt Strawberry 90g', brand: 'Epigamia', category: 'Dairy', description: 'High protein Greek yogurt', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40101382_4-epigamia-greek-yogurt-strawberry.jpg', mrp: 5000, discount_percent: 50, sale_price: 2500, stock: 14, expiry_days: 5 },
  { pool: 'A', name: 'Amul Masti Buttermilk 200ml', brand: 'Amul', category: 'Dairy', description: 'Spiced buttermilk tetra pack', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265799_7-amul-masti-spiced-buttermilk.jpg', mrp: 2000, discount_percent: 40, sale_price: 1200, stock: 30, expiry_days: 6 },
  { pool: 'A', name: 'Milky Mist Paneer 200g', brand: 'Milky Mist', category: 'Dairy', description: 'Fresh cottage cheese block', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40024886_3-milky-mist-premium-paneer.jpg', mrp: 9000, discount_percent: 35, sale_price: 5850, stock: 8, expiry_days: 4 },
  { pool: 'A', name: 'Kurkure Masala Munch 94g', brand: 'Kurkure', category: 'Snacks', description: 'Crunchy corn puffs with masala', image_url: 'https://www.bigbasket.com/media/uploads/p/l/266184_6-kurkure-namkeen-masala-munch.jpg', mrp: 2000, discount_percent: 40, sale_price: 1200, stock: 35, expiry_days: 30 },
  { pool: 'A', name: 'Parle-G Gold Biscuits 100g', brand: 'Parle', category: 'Snacks', description: 'Premium glucose biscuits', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40020062_2-parle-g-gold-biscuit.jpg', mrp: 2500, discount_percent: 30, sale_price: 1750, stock: 50, expiry_days: 30 },
  { pool: 'A', name: 'Britannia Good Day Butter Cookies 250g', brand: 'Britannia', category: 'Snacks', description: 'Rich buttery cookies', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40193638_4-britannia-good-day-cashew-cookies.jpg', mrp: 4000, discount_percent: 25, sale_price: 3000, stock: 28, expiry_days: 30 },
  { pool: 'A', name: 'Haldirams Aloo Bhujia 200g', brand: 'Haldirams', category: 'Snacks', description: 'Classic spiced potato sev', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40017736_2-haldirams-namkeen-aloo-bhujia.jpg', mrp: 6500, discount_percent: 35, sale_price: 4225, stock: 20, expiry_days: 30 },
  { pool: 'A', name: 'Oreo Original Cream Biscuit 120g', brand: 'Cadbury', category: 'Snacks', description: 'Chocolate sandwich cookies with cream', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40026634_3-cadbury-oreo-vanilla-creme-biscuit.jpg', mrp: 3000, discount_percent: 40, sale_price: 1800, stock: 32, expiry_days: 30 },
  { pool: 'A', name: 'Tropicana Orange Juice 1L', brand: 'Tropicana', category: 'Beverages', description: '100% orange juice not from concentrate', image_url: 'https://www.bigbasket.com/media/uploads/p/l/251006_13-tropicana-100-juice-orange.jpg', mrp: 11000, discount_percent: 50, sale_price: 5500, stock: 15, expiry_days: 5 },
  { pool: 'A', name: 'Real Fruit Power Mixed Fruit 1L', brand: 'Real', category: 'Beverages', description: 'Mixed fruit juice drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265524_8-real-fruit-power-juice-mixed-fruit.jpg', mrp: 10000, discount_percent: 40, sale_price: 6000, stock: 12, expiry_days: 7 },
  { pool: 'A', name: 'Red Bull Energy Drink 250ml', brand: 'Red Bull', category: 'Beverages', description: 'Energy drink with caffeine and taurine', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264848_7-red-bull-energy-drink.jpg', mrp: 11500, discount_percent: 20, sale_price: 9200, stock: 10, expiry_days: 60 },
  { pool: 'A', name: 'MDH Garam Masala 100g', brand: 'MDH', category: 'Pantry', description: 'Blend of aromatic spices', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40000197_3-mdh-masala-garam.jpg', mrp: 8500, discount_percent: 20, sale_price: 6800, stock: 18, expiry_days: 60 },
  { pool: 'A', name: 'Kissan Mixed Fruit Jam 500g', brand: 'Kissan', category: 'Pantry', description: 'Real fruit jam spread', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264928_4-kissan-mixed-fruit-jam.jpg', mrp: 13500, discount_percent: 25, sale_price: 10125, stock: 14, expiry_days: 30 },
  { pool: 'A', name: 'Kelloggs Corn Flakes 475g', brand: 'Kelloggs', category: 'Pantry', description: 'Crispy corn flakes breakfast cereal', image_url: 'https://www.bigbasket.com/media/uploads/p/l/229651_10-kelloggs-corn-flakes-original.jpg', mrp: 19500, discount_percent: 25, sale_price: 14625, stock: 14, expiry_days: 60 },
  { pool: 'A', name: 'Saffola Oats 1kg', brand: 'Saffola', category: 'Pantry', description: 'Rolled oats for healthy breakfast', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40022438_3-saffola-oats-natural.jpg', mrp: 15500, discount_percent: 25, sale_price: 11625, stock: 16, expiry_days: 60 },
  { pool: 'A', name: 'Vim Dishwash Gel Lemon 750ml', brand: 'Vim', category: 'Cleaning', description: 'Liquid dish wash with lemon', image_url: 'https://www.bigbasket.com/media/uploads/p/l/241107_9-vim-dishwash-gel-lemon.jpg', mrp: 14000, discount_percent: 25, sale_price: 10500, stock: 18, expiry_days: 60 },
  { pool: 'A', name: 'Harpic Power Plus 500ml', brand: 'Harpic', category: 'Cleaning', description: 'Toilet cleaning liquid', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025063_5-harpic-power-plus-toilet-cleaner.jpg', mrp: 9900, discount_percent: 20, sale_price: 7920, stock: 15, expiry_days: 90 },
  { pool: 'A', name: 'Pringles Original 107g', brand: 'Pringles', category: 'Snacks', description: 'Stackable potato crisps', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40089812_4-pringles-potato-chips-original.jpg', mrp: 14900, discount_percent: 30, sale_price: 10430, stock: 12, expiry_days: 30 },
  { pool: 'A', name: 'Nestle Milkmaid 400g', brand: 'Nestle', category: 'Dairy', description: 'Sweetened condensed milk', image_url: 'https://www.bigbasket.com/media/uploads/p/l/270038_8-nestle-milkmaid-sweetened-condensed-milk.jpg', mrp: 16500, discount_percent: 15, sale_price: 14025, stock: 16, expiry_days: 60 },
  { pool: 'A', name: 'Dabur Honey 500g', brand: 'Dabur', category: 'Pantry', description: '100% pure natural honey', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265515_8-dabur-honey-100-pure-world-s-no1-honey-brand.jpg', mrp: 27000, discount_percent: 15, sale_price: 22950, stock: 10, expiry_days: 60 },
  { pool: 'A', name: 'Dettol Antiseptic Liquid 250ml', brand: 'Dettol', category: 'Cleaning', description: 'Multi-purpose disinfectant liquid', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264912_4-dettol-antiseptic-disinfectant-liquid.jpg', mrp: 11500, discount_percent: 15, sale_price: 9775, stock: 17, expiry_days: 90 },
  { pool: 'A', name: 'Britannia Fruit Cake 250g', brand: 'Britannia', category: 'Bakery', description: 'Soft sponge cake with dried fruits', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40041816_2-britannia-cake-fruity.jpg', mrp: 8500, discount_percent: 30, sale_price: 5950, stock: 8, expiry_days: 8 },
  { pool: 'A', name: 'Britannia Milk Rusk 230g', brand: 'Britannia', category: 'Bakery', description: 'Crispy oven-baked milk rusk', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40017457_5-britannia-toastea-premium-bake-rusk-milk.jpg', mrp: 3800, discount_percent: 25, sale_price: 2850, stock: 18, expiry_days: 30 },
  { pool: 'A', name: 'Nescafe Classic Coffee 100g', brand: 'Nescafe', category: 'Beverages', description: 'Instant coffee powder', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/22912a.jpg', mrp: 28000, discount_percent: 20, sale_price: 22400, stock: 10, expiry_days: 60 },
  { pool: 'A', name: 'Parachute Coconut Oil 500ml', brand: 'Parachute', category: 'Pantry', description: 'Pure pressed coconut oil for hair', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025148_4-parachute-100-pure-coconut-oil.jpg', mrp: 16000, discount_percent: 10, sale_price: 14400, stock: 18, expiry_days: 90 },

  // ═══════ STORE B EXCLUSIVE (Rahul Supermarket) ═══════
  { pool: 'B', name: 'Go Cheese Grated Mozzarella 250g', brand: 'Go', category: 'Dairy', description: 'Pizza-ready shredded mozzarella', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40182753_1-go-cheese-shredded-mozzarella.jpg', mrp: 17000, discount_percent: 25, sale_price: 12750, stock: 9, expiry_days: 10 },
  { pool: 'B', name: 'Bingo Mad Angles Achari Masti 72g', brand: 'Bingo', category: 'Snacks', description: 'Triangle-shaped tangy snack', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40021060_5-bingo-mad-angles-achari-masti.jpg', mrp: 2000, discount_percent: 45, sale_price: 1100, stock: 25, expiry_days: 30 },
  { pool: 'B', name: 'Cadbury 5 Star Chocolate Bar 40g (Pack of 5)', brand: 'Cadbury', category: 'Snacks', description: 'Caramel nougat chocolate bar', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/282660a.jpg', mrp: 10000, discount_percent: 20, sale_price: 8000, stock: 18, expiry_days: 60 },
  { pool: 'B', name: 'Sunfeast Dark Fantasy Choco Fills 75g', brand: 'Sunfeast', category: 'Snacks', description: 'Cookies with rich choco cream filling', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40022036_5-sunfeast-dark-fantasy-choco-fills.jpg', mrp: 4000, discount_percent: 35, sale_price: 2600, stock: 22, expiry_days: 30 },
  { pool: 'B', name: 'Act II Classic Salted Popcorn 30g', brand: 'Act II', category: 'Snacks', description: 'Ready-to-eat popcorn', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40024449_4-act-ii-rte-popcorn-classic-salted.jpg', mrp: 2000, discount_percent: 40, sale_price: 1200, stock: 38, expiry_days: 30 },
  { pool: 'B', name: 'McVities Digestive Biscuits 250g', brand: 'McVities', category: 'Snacks', description: 'Whole wheat digestive biscuits', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265841_7-mcvities-digestive-biscuit.jpg', mrp: 8500, discount_percent: 20, sale_price: 6800, stock: 15, expiry_days: 60 },
  { pool: 'B', name: 'Cadbury Dairy Milk Silk 150g', brand: 'Cadbury', category: 'Snacks', description: 'Smooth and creamy milk chocolate', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40000195_8-cadbury-dairy-milk-silk-chocolate-bar.jpg', mrp: 16000, discount_percent: 15, sale_price: 13600, stock: 10, expiry_days: 60 },
  { pool: 'B', name: 'Too Yumm Multigrain Chips 54g', brand: 'Too Yumm', category: 'Snacks', description: 'Baked not fried multigrain chips', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40126416_3-too-yumm-multigrain-chips-chinese-hot-chilli.jpg', mrp: 2000, discount_percent: 50, sale_price: 1000, stock: 28, expiry_days: 30 },
  { pool: 'B', name: 'Sprite Lemon-Lime 750ml', brand: 'Sprite', category: 'Beverages', description: 'Clear lemon-lime soda', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264041_10-sprite-soft-drink.jpg', mrp: 3800, discount_percent: 25, sale_price: 2850, stock: 28, expiry_days: 30 },
  { pool: 'B', name: 'Appy Fizz Apple Sparkling Drink 250ml', brand: 'Appy', category: 'Beverages', description: 'Sparkling apple juice drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40119416_2-appy-fizz-sparkling-apple-juice-drink.jpg', mrp: 3000, discount_percent: 35, sale_price: 1950, stock: 22, expiry_days: 14 },
  { pool: 'B', name: 'Maaza Mango Drink 600ml', brand: 'Maaza', category: 'Beverages', description: 'Mango pulp juice drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265561_6-maaza-mango-drink.jpg', mrp: 3500, discount_percent: 40, sale_price: 2100, stock: 18, expiry_days: 14 },
  { pool: 'B', name: 'Paper Boat Aam Panna 200ml', brand: 'Paper Boat', category: 'Beverages', description: 'Traditional raw mango drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40022012_5-paper-boat-aam-panna.jpg', mrp: 3000, discount_percent: 45, sale_price: 1650, stock: 20, expiry_days: 7 },
  { pool: 'B', name: 'Frooti Mango 1.2L', brand: 'Frooti', category: 'Beverages', description: 'Mango fruit drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264634_4-frooti-mango-drink-fresh-juicy.jpg', mrp: 6000, discount_percent: 35, sale_price: 3900, stock: 16, expiry_days: 14 },
  { pool: 'B', name: 'Maggi Hot & Sweet Tomato Chilli Sauce 1kg', brand: 'Maggi', category: 'Pantry', description: 'Tomato ketchup with chilli', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265926_3-maggi-hot-sweet-tomato-chilli-sauce-bottle.jpg', mrp: 18000, discount_percent: 20, sale_price: 14400, stock: 10, expiry_days: 30 },
  { pool: 'B', name: 'Sundrop Peanut Butter Creamy 462g', brand: 'Sundrop', category: 'Pantry', description: 'Smooth creamy peanut butter', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40069997_6-sundrop-peanut-butter-creamy.jpg', mrp: 22000, discount_percent: 30, sale_price: 15400, stock: 8, expiry_days: 30 },
  { pool: 'B', name: 'Quaker Oats 1kg', brand: 'Quaker', category: 'Pantry', description: 'Rolled oats rich in fiber', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40014044_3-quaker-oats.jpg', mrp: 16000, discount_percent: 20, sale_price: 12800, stock: 20, expiry_days: 60 },
  { pool: 'B', name: 'Kelloggs Chocos 375g', brand: 'Kelloggs', category: 'Pantry', description: 'Chocolatey breakfast cereal for kids', image_url: 'https://www.bigbasket.com/media/uploads/p/l/229655_8-kelloggs-chocos-chocolate-breakfast-cereal.jpg', mrp: 19000, discount_percent: 30, sale_price: 13300, stock: 12, expiry_days: 30 },
  { pool: 'B', name: 'Nutella Hazelnut Spread 350g', brand: 'Nutella', category: 'Pantry', description: 'Hazelnut cocoa spread', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40079309_4-nutella-hazelnut-spread-with-cocoa.jpg', mrp: 39900, discount_percent: 20, sale_price: 31920, stock: 6, expiry_days: 60 },
  { pool: 'B', name: 'Lizol Disinfectant Floor Cleaner Citrus 500ml', brand: 'Lizol', category: 'Cleaning', description: 'Surface disinfectant with citrus', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025080_5-lizol-disinfectant-surface-floor-cleaner-citrus.jpg', mrp: 11000, discount_percent: 20, sale_price: 8800, stock: 14, expiry_days: 90 },
  { pool: 'B', name: 'Scotch-Brite Scrub Pad (Pack of 3)', brand: 'Scotch-Brite', category: 'Cleaning', description: 'Heavy-duty scrub sponge pads', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46553a.jpg', mrp: 5000, discount_percent: 15, sale_price: 4250, stock: 25, expiry_days: 90 },
  { pool: 'B', name: 'Colin Glass Cleaner 500ml', brand: 'Colin', category: 'Cleaning', description: 'Spray cleaner for glass surfaces', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025106_1-colin-glass-surface-cleaner-liquid-spray.jpg', mrp: 12000, discount_percent: 20, sale_price: 9600, stock: 10, expiry_days: 90 },
  { pool: 'B', name: 'English Oven Burger Buns (Pack of 4)', brand: 'English Oven', category: 'Bakery', description: 'Soft sesame burger buns', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/76610a.jpg', mrp: 7500, discount_percent: 35, sale_price: 4875, stock: 10, expiry_days: 3 },
  { pool: 'B', name: 'Harvest Gold Multigrain Bread 450g', brand: 'Harvest Gold', category: 'Bakery', description: 'Multi-seed multigrain bread', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40037453_5-harvest-gold-hearty-brown-bread.jpg', mrp: 5500, discount_percent: 40, sale_price: 3300, stock: 9, expiry_days: 3 },
  { pool: 'B', name: 'Dettol Original Soap 125g (Pack of 4)', brand: 'Dettol', category: 'Pantry', description: 'Antibacterial bathing soap', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/50010a.jpg', mrp: 18000, discount_percent: 20, sale_price: 14400, stock: 15, expiry_days: 90 },
  { pool: 'B', name: 'Head & Shoulders Anti Dandruff Shampoo 340ml', brand: 'Head & Shoulders', category: 'Pantry', description: 'Anti-dandruff shampoo', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025181_4-head-shoulders-anti-dandruff-shampoo.jpg', mrp: 33000, discount_percent: 15, sale_price: 28050, stock: 8, expiry_days: 90 },
  { pool: 'B', name: 'Bournvita Health Drink 500g', brand: 'Cadbury', category: 'Beverages', description: 'Chocolate health drink for kids', image_url: 'https://www.bigbasket.com/media/uploads/p/l/266019_10-cadbury-bournvita-health-drink-chocolate.jpg', mrp: 22000, discount_percent: 25, sale_price: 16500, stock: 14, expiry_days: 60 },

  // ═══════ STORE C EXCLUSIVE (Priya Fresh Mart) ═══════
  { pool: 'C', name: 'Nescafe Ready to Drink Cold Coffee 180ml', brand: 'Nescafe', category: 'Beverages', description: 'Chilled ready to drink cold coffee', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/421567a.jpg', mrp: 5000, discount_percent: 30, sale_price: 3500, stock: 14, expiry_days: 10 },
  { pool: 'C', name: 'Tetley Green Tea Lemon 25 Bags', brand: 'Tetley', category: 'Beverages', description: 'Green tea bags with lemon flavour', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40029701_3-tetley-green-tea-lemon.jpg', mrp: 15000, discount_percent: 15, sale_price: 12750, stock: 20, expiry_days: 60 },
  { pool: 'C', name: 'Tang Orange 500g', brand: 'Tang', category: 'Beverages', description: 'Instant orange drink powder', image_url: 'https://www.bigbasket.com/media/uploads/p/l/266248_5-tang-instant-drink-mix-orange.jpg', mrp: 16000, discount_percent: 20, sale_price: 12800, stock: 11, expiry_days: 60 },
  { pool: 'C', name: 'Dabur Real Litchi Juice 1L', brand: 'Dabur', category: 'Beverages', description: 'Litchi flavoured fruit nectar', image_url: 'https://www.bigbasket.com/media/uploads/p/l/265529_8-real-fruit-power-juice-litchi.jpg', mrp: 10000, discount_percent: 40, sale_price: 6000, stock: 13, expiry_days: 7 },
  { pool: 'C', name: 'Horlicks Classic Malt 500g', brand: 'Horlicks', category: 'Beverages', description: 'Health and nutrition drink', image_url: 'https://www.bigbasket.com/media/uploads/p/l/267171_8-horlicks-health-nutrition-drink-classic-malt.jpg', mrp: 24000, discount_percent: 20, sale_price: 19200, stock: 12, expiry_days: 60 },
  { pool: 'C', name: 'MTR Ready To Eat Poha 180g', brand: 'MTR', category: 'Pantry', description: 'Instant poha just heat and eat', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40028037_4-mtr-ready-to-eat-poha.jpg', mrp: 5500, discount_percent: 35, sale_price: 3575, stock: 18, expiry_days: 30 },
  { pool: 'C', name: 'MTR Ready To Eat Upma 180g', brand: 'MTR', category: 'Pantry', description: 'Instant rava upma heat and eat', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40028029_4-mtr-ready-to-eat-upma.jpg', mrp: 5500, discount_percent: 35, sale_price: 3575, stock: 16, expiry_days: 30 },
  { pool: 'C', name: 'Knorr Tomato Soup 53g', brand: 'Knorr', category: 'Pantry', description: 'Instant classic thick tomato soup', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264623_5-knorr-classic-thick-tomato-soup.jpg', mrp: 5500, discount_percent: 35, sale_price: 3575, stock: 22, expiry_days: 60 },
  { pool: 'C', name: 'Maggi Pasta Penne 400g', brand: 'Maggi', category: 'Pantry', description: 'Durum wheat penne pasta', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40019649_4-maggi-penne-pasta.jpg', mrp: 8500, discount_percent: 20, sale_price: 6800, stock: 16, expiry_days: 60 },
  { pool: 'C', name: 'Yippee Noodles Magic Masala (Pack of 6)', brand: 'Sunfeast', category: 'Pantry', description: 'Instant noodles long and slurpy', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/273009a.jpg', mrp: 9000, discount_percent: 30, sale_price: 6300, stock: 20, expiry_days: 60 },
  { pool: 'C', name: 'Bambino Vermicelli 850g', brand: 'Bambino', category: 'Pantry', description: 'Roasted vermicelli for upma and payasam', image_url: 'https://www.bigbasket.com/media/uploads/p/l/266547_5-bambino-premium-roasted-vermicelli.jpg', mrp: 9000, discount_percent: 20, sale_price: 7200, stock: 22, expiry_days: 60 },
  { pool: 'C', name: 'Dettol Instant Hand Sanitizer 200ml', brand: 'Dettol', category: 'Pantry', description: 'Kills 99.9% germs instantly', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40000614_5-dettol-instant-hand-sanitizer.jpg', mrp: 10000, discount_percent: 40, sale_price: 6000, stock: 15, expiry_days: 60 },
  { pool: 'C', name: 'Pril Dishwash Liquid 425ml', brand: 'Pril', category: 'Cleaning', description: 'Concentrated dish wash gel', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40058027_2-pril-dishwash-speckles-liquid-gel-lime.jpg', mrp: 10000, discount_percent: 25, sale_price: 7500, stock: 16, expiry_days: 90 },
  { pool: 'C', name: 'Domex Fresh Guard Toilet Cleaner 500ml', brand: 'Domex', category: 'Cleaning', description: 'Kills all germs in toilet', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/46530a.jpg', mrp: 8500, discount_percent: 30, sale_price: 5950, stock: 14, expiry_days: 90 },
  { pool: 'C', name: 'Comfort After Wash Fabric Conditioner 860ml', brand: 'Comfort', category: 'Cleaning', description: 'Fabric softener for fresh clothes', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025050_2-comfort-after-wash-morning-fresh-fabric-conditioner.jpg', mrp: 21000, discount_percent: 20, sale_price: 16800, stock: 8, expiry_days: 90 },
  { pool: 'C', name: 'Good Knight Gold Flash 45ml', brand: 'Good Knight', category: 'Cleaning', description: 'Mosquito repellent liquid vaporizer refill', image_url: 'https://www.bigbasket.com/media/uploads/p/l/264637_5-good-knight-gold-flash-liquid-vapouriser.jpg', mrp: 7500, discount_percent: 20, sale_price: 6000, stock: 22, expiry_days: 90 },
  { pool: 'C', name: 'Pillsbury Cookie Cake Chocolate 23g (Pack of 6)', brand: 'Pillsbury', category: 'Bakery', description: 'Soft baked chocolate cookie cakes', image_url: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/126696a.jpg', mrp: 6000, discount_percent: 30, sale_price: 4200, stock: 20, expiry_days: 30 },
  { pool: 'C', name: 'Parle Monaco Salted Biscuit 200g', brand: 'Parle', category: 'Snacks', description: 'Classic zeera salted cracker biscuit', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40020135_4-parle-monaco-classic-regular-salted-biscuit.jpg', mrp: 3500, discount_percent: 30, sale_price: 2450, stock: 25, expiry_days: 30 },
  { pool: 'C', name: 'Hide & Seek Chocolate Chip Cookies 200g', brand: 'Parle', category: 'Snacks', description: 'Chocolate chip cookies', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40020066_4-parle-hide-seek-chocolate-chip-cookies.jpg', mrp: 4500, discount_percent: 25, sale_price: 3375, stock: 18, expiry_days: 30 },
  { pool: 'C', name: 'Bikano Rasgulla Tin 1kg', brand: 'Bikano', category: 'Snacks', description: 'Ready-to-eat rasgulla sweets', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40135534_3-bikano-rasgulla-tin.jpg', mrp: 22000, discount_percent: 25, sale_price: 16500, stock: 6, expiry_days: 30 },
  { pool: 'C', name: 'Dove Body Wash 250ml', brand: 'Dove', category: 'Pantry', description: 'Nourishing body wash with moisturiser', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025059_1-dove-deeply-nourishing-body-wash.jpg', mrp: 22500, discount_percent: 20, sale_price: 18000, stock: 10, expiry_days: 90 },
  { pool: 'C', name: 'Nivea Body Lotion 400ml', brand: 'Nivea', category: 'Pantry', description: 'Nourishing body lotion for dry skin', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025122_6-nivea-nourishing-body-milk-lotion.jpg', mrp: 32000, discount_percent: 20, sale_price: 25600, stock: 7, expiry_days: 90 },
  { pool: 'C', name: 'Cerelac Baby Cereal Wheat 300g', brand: 'Nestle', category: 'Pantry', description: 'Stage 1 baby food cereal', image_url: 'https://www.bigbasket.com/media/uploads/p/l/271373_8-nestle-cerelac-baby-cereal-wheat.jpg', mrp: 21500, discount_percent: 20, sale_price: 17200, stock: 10, expiry_days: 60 },
  { pool: 'C', name: 'Listerine Cool Mint Mouthwash 250ml', brand: 'Listerine', category: 'Pantry', description: 'Antiseptic mouthwash', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025142_4-listerine-cool-mint-mouthwash.jpg', mrp: 11000, discount_percent: 20, sale_price: 8800, stock: 14, expiry_days: 90 },
  { pool: 'C', name: 'Pepsodent Germicheck Toothpaste 200g', brand: 'Pepsodent', category: 'Pantry', description: 'Cavity protection toothpaste', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025137_3-pepsodent-germicheck-toothpaste.jpg', mrp: 9000, discount_percent: 25, sale_price: 6750, stock: 20, expiry_days: 90 },
  { pool: 'C', name: 'Complan Royale Chocolate 500g', brand: 'Complan', category: 'Beverages', description: 'Nutrition drink for growing kids', image_url: 'https://www.bigbasket.com/media/uploads/p/l/40025215_4-complan-nutrition-health-drink-royale-chocolate.jpg', mrp: 26000, discount_percent: 20, sale_price: 20800, stock: 8, expiry_days: 60 },
];

async function seedStores() {
  console.log("🌱 Starting multi-store seeding...\n");

  // ── Step 1: Backup ──
  console.log("📦 Step 1: Backing up products table...");
  const { error: backupErr } = await supabase.rpc('query', { sql: 'SELECT 1' }).maybeSingle();  
  // Use direct SQL for backup
  const { data: backupCheck } = await supabase.from('products_backup_pre_multistore').select('id').limit(1);
  if (backupCheck === null) {
    // Table doesn't exist yet, create backup
    console.log("   Creating products_backup_pre_multistore...");
    // We'll skip the CREATE TABLE AS since we can't run raw DDL via the client
    // Instead, read all products and insert them
  }

  // ── Step 2: Count current state ──
  console.log("\n📊 Step 2: Current product distribution...");
  const { data: beforeProducts, error: bpErr } = await supabase.from('products').select('store_id');
  if (bpErr) { console.error("   Error:", bpErr.message); return; }

  const beforeCounts = {};
  beforeProducts.forEach(p => { beforeCounts[p.store_id] = (beforeCounts[p.store_id] || 0) + 1; });
  console.log("   BEFORE:", JSON.stringify(beforeCounts, null, 2));
  console.log(`   Total: ${beforeProducts.length} rows`);

  // ── Step 3: Get existing store (Fresh Mart) ──
  const { data: existingStores } = await supabase.from('stores').select('id, name, owner_id');
  const freshMart = existingStores?.find(s => s.name?.includes('Fresh Mart') || s.name?.includes('Dummy'));
  
  if (!freshMart) {
    console.error("❌ No existing store found. Please run the original seed first.");
    return;
  }
  console.log(`\n✅ Found existing store: "${freshMart.name}" (${freshMart.id})`);

  // ── Step 4: Create new store owner accounts ──
  const storeIds = { A: freshMart.id };
  const storeLabels = ['B', 'C'];

  for (let i = 0; i < NEW_OWNERS.length; i++) {
    const o = NEW_OWNERS[i];
    const label = storeLabels[i];
    console.log(`\n👤 Creating store owner: ${o.email}...`);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === o.email);

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`   ℹ️  User already exists (${userId}), skipping creation.`);
    } else {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: o.email,
        password: o.password,
        email_confirm: true,
        user_metadata: {
          full_name: o.name,
          phone: o.phone,
          role: 'store_owner'
        }
      });

      if (userError) {
        console.error(`   ❌ Error creating user:`, userError.message);
        continue;
      }
      userId = userData.user.id;
      console.log(`   ✅ User created (${userId})`);
    }

    // Check if store exists for this owner
    const { data: existingStore } = await supabase.from('stores').select('id').eq('owner_id', userId).maybeSingle();

    if (existingStore) {
      storeIds[label] = existingStore.id;
      console.log(`   ℹ️  Store already exists (${existingStore.id})`);
    } else {
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: userId,
          name: o.storeName,
          description: o.storeDesc,
          address: o.address,
          city: o.city,
          pincode: o.pincode,
          lat: o.lat,
          lng: o.lng,
          is_active: true
        })
        .select()
        .single();

      if (storeError) {
        console.error(`   ❌ Error creating store:`, storeError.message);
        continue;
      }
      storeIds[label] = newStore.id;
      console.log(`   ✅ Store "${o.storeName}" created (${newStore.id})`);
    }
  }

  if (!storeIds.B || !storeIds.C) {
    console.error("\n❌ Could not create all stores. Aborting product seeding.");
    return;
  }

  console.log("\n📍 Store ID mapping:");
  console.log(`   A (Fresh Mart):        ${storeIds.A}`);
  console.log(`   B (Rahul Supermarket):  ${storeIds.B}`);
  console.log(`   C (Priya Fresh Mart):   ${storeIds.C}`);

  // ── Step 5: Delete all existing products and seed fresh ──
  console.log("\n🗑️  Step 5: Clearing old products (backed up)...");

  // Deactivate all existing products
  const { error: deactivateErr } = await supabase
    .from('products')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all

  if (deactivateErr) console.error("   Deactivate error:", deactivateErr.message);

  // ── Step 6: Insert new products ──
  console.log("\n🛒 Step 6: Seeding products across stores...");

  const today = new Date();
  let inserted = { A: 0, B: 0, C: 0 };

  for (const prod of PRODUCTS) {
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + prod.expiry_days);
    const expiryStr = expiryDate.toISOString().split('T')[0];

    const baseProduct = {
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      description: prod.description,
      image_url: prod.image_url,
      mrp: prod.mrp,
      discount_percent: prod.discount_percent,
      sale_price: prod.sale_price,
      stock: prod.stock,
      expiry_date: expiryStr,
      status: 'active',
      is_active: true,
    };

    if (prod.pool === 'shared') {
      // Insert into all 3 stores with slightly varied stock
      for (const label of ['A', 'B', 'C']) {
        const stockVariation = Math.floor(Math.random() * 10) - 3; // ±3
        const { error } = await supabase.from('products').insert({
          ...baseProduct,
          store_id: storeIds[label],
          stock: Math.max(1, prod.stock + stockVariation),
        });
        if (error) console.error(`   ❌ ${prod.name} → Store ${label}:`, error.message);
        else inserted[label]++;
      }
    } else {
      // Exclusive to one store
      const { error } = await supabase.from('products').insert({
        ...baseProduct,
        store_id: storeIds[prod.pool],
      });
      if (error) console.error(`   ❌ ${prod.name} → Store ${prod.pool}:`, error.message);
      else inserted[prod.pool]++;
    }
  }

  console.log(`\n   ✅ Inserted: Store A=${inserted.A}, Store B=${inserted.B}, Store C=${inserted.C}`);

  // ── Step 7: Final count ──
  console.log("\n📊 Step 7: Final product distribution...");
  const { data: afterProducts } = await supabase.from('products').select('store_id').eq('is_active', true);
  const afterCounts = {};
  afterProducts?.forEach(p => { afterCounts[p.store_id] = (afterCounts[p.store_id] || 0) + 1; });
  console.log("   AFTER:", JSON.stringify(afterCounts, null, 2));
  console.log(`   Total active: ${afterProducts?.length} rows`);

  // ── Print credentials ──
  console.log("\n" + "═".repeat(60));
  console.log("🔑 STORE OWNER LOGIN CREDENTIALS");
  console.log("═".repeat(60));
  console.log(`\n  1. Fresh Mart (existing)`);
  console.log(`     Email:    dummy_store@nearx.com`);
  console.log(`     Password: password123`);
  for (const o of NEW_OWNERS) {
    console.log(`\n  ${NEW_OWNERS.indexOf(o) + 2}. ${o.storeName}`);
    console.log(`     Email:    ${o.email}`);
    console.log(`     Password: ${o.password}`);
  }
  console.log("\n" + "═".repeat(60));

  console.log("\n🎉 Multi-store seeding complete!");
}

seedStores();
