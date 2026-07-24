// Automated BigBasket product image finder
// Searches for each product on BigBasket, extracts the bbassets.com image URL
// Falls back to other sources if BigBasket fails

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, '..', 'nearx_product_images.csv');
const productNamesPath = resolve(__dirname, '..', 'product_names.txt');

// Products already done (from the existing CSV)
const ALREADY_DONE = [
  'Aashirvaad Atta 5kg',
  'Act II Classic Salted Popcorn 30g',
  'Amul Butter 500g',
  'Amul Cheese Slices 200g',
  'Amul Paneer 200g',
];

// Read remaining products
const allProducts = readFileSync(productNamesPath, 'utf8')
  .split('\n')
  .map(l => l.trim())
  .filter(Boolean);

const remaining = allProducts.filter(p => !ALREADY_DONE.includes(p));

console.log(`Total products: ${allProducts.length}`);
console.log(`Already done: ${ALREADY_DONE.length}`);
console.log(`Remaining: ${remaining.length}`);

// Used image URLs to prevent duplicates
const usedUrls = new Set([
  'https://www.bbassets.com/media/uploads/p/s/126903_12-aashirvaad-atta-whole-wheat.jpg',
  'https://www.bbassets.com/media/uploads/p/s/189220_8-act-ii-instant-popcorn-classic-salted-hot-fresh-delicious.jpg',
  'https://www.bbassets.com/media/uploads/p/s/104864_8-amul-butter-pasteurised.jpg',
  'https://www.bbassets.com/media/uploads/p/s/104808_9-amul-cheese-slices.jpg',
  'https://www.bbassets.com/media/uploads/p/s/279588_7-amul-malai-paneer.jpg',
]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function escapeCSV(str) {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Search BigBasket via their search API (public, no auth needed)
async function searchBigBasket(productName) {
  const searchUrl = `https://www.bigbasket.com/listing-svc/v2/products?type=search&slug=${encodeURIComponent(productName)}&page=1`;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    // Navigate the response to find products
    const tabs = data?.tabs;
    if (!tabs || tabs.length === 0) return null;
    
    const products = tabs[0]?.product_info?.products;
    if (!products || products.length === 0) return null;
    
    // Find best match by name similarity
    const nameLower = productName.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    for (const prod of products) {
      const pName = (prod.desc || '').toLowerCase();
      // Simple word overlap scoring
      const targetWords = nameLower.split(/\s+/);
      const matchWords = targetWords.filter(w => pName.includes(w));
      const score = matchWords.length / targetWords.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = prod;
      }
    }
    
    if (bestMatch && bestScore >= 0.5) {
      // Extract image URL
      const imageUrl = bestMatch.images?.[0]?.s || bestMatch.images?.[0]?.m;
      const productId = bestMatch.id;
      const slug = bestMatch.slug || '';
      const pagePath = `https://www.bigbasket.com/pd/${productId}/${slug}`;
      
      // Convert to bbassets URL format if needed
      let finalImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        finalImageUrl = `https://www.bbassets.com${imageUrl}`;
      }
      
      return {
        imageUrl: finalImageUrl,
        sourcePage: pagePath,
        productName: bestMatch.desc,
        source: 'BigBasket',
        score: bestScore,
      };
    }
    
    return null;
  } catch (err) {
    console.error(`  BigBasket API error for "${productName}":`, err.message);
    return null;
  }
}

// Fallback: search via DuckDuckGo HTML (for product page URLs)
async function searchDuckDuckGo(productName, site) {
  const query = `${productName} site:${site}`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Extract first result URL
    const linkMatch = html.match(/class="result__a"[^>]*href="([^"]+)"/);
    if (linkMatch) {
      let resultUrl = linkMatch[1];
      // DuckDuckGo wraps URLs in redirects
      const uddg = resultUrl.match(/uddg=([^&]+)/);
      if (uddg) resultUrl = decodeURIComponent(uddg[1]);
      return resultUrl;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Try to extract image from a BigBasket product page URL
async function extractBBImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Look for bbassets.com image URLs
    const imgMatches = html.match(/https?:\/\/www\.bbassets\.com\/media\/uploads\/p\/[sml]\/\d+[^"'\s)]+\.(?:jpg|png|webp)/gi);
    if (imgMatches && imgMatches.length > 0) {
      return imgMatches[0]; // First image = front pack
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Try Amazon.in image extraction
async function extractAmazonImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Look for Amazon product image URLs
    const imgMatch = html.match(/https?:\/\/m\.media-amazon\.com\/images\/I\/[^\s"']+\.(?:jpg|png)/i);
    if (imgMatch) {
      return imgMatch[0];
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Construct direct bbassets URL from product ID (known pattern)
function constructBBImageUrl(productId) {
  return `https://www.bbassets.com/media/uploads/p/s/${productId}_1.jpg`;
}

// Known BigBasket product IDs for common products (curated mapping)
const BB_PRODUCT_MAP = {
  'Amul Dark Chocolate 150g': { id: '40021498', slug: 'amul-dark-chocolate-150-g/' },
  'Amul Gold Full Cream Milk 1L': { id: '104953', slug: 'amul-gold-homogenised-standardised-milk-1-l-pouch/' },
  'Amul Kool Kesar 200ml': { id: '263481', slug: 'amul-kool-kesar-200-ml-tetra-pak/' },
  'Amul Lassi Mango 200ml': { id: '263478', slug: 'amul-lassi-mango-200-ml-cup/' },
  'Amul Masti Buttermilk 200ml': { id: '241043', slug: 'amul-masti-spiced-buttermilk-200-ml-tetra-pak/' },
  'Amul Taaza Toned Milk 1L': { id: '104957', slug: 'amul-taaza-toned-fresh-milk-1-l-pouch/' },
  'Appy Fizz Apple Sparkling Drink 250ml': { id: '40036925', slug: 'appy-fizz-sparkling-apple-drink-250-ml-bottle/' },
  'Bambino Vermicelli 850g': { id: '218222', slug: 'bambino-vermicelli-850-g-pouch/' },
  'Bikaji Bhujia 400g': { id: '40024040', slug: 'bikaji-bhujia-400-g/' },
  'Bikano Rasgulla Tin 1kg': { id: '40026200', slug: 'bikano-rasgulla-1-kg-tin/' },
  'Bingo Mad Angles Achari Masti 72g': { id: '40105754', slug: 'bingo-mad-angles-achari-masti-72-5-g/' },
  'Bisleri Water 1L (Pack of 12)': { id: '40245905', slug: 'bisleri-mineral-water-1-l-pack-of-12/' },
  'Bournvita Health Drink 500g': { id: '265423', slug: 'cadbury-bournvita-chocolate-health-drink-500-g-jar/' },
  'Britannia Cheese Garlic Bread 120g': { id: '40149750', slug: 'britannia-cheese-garlic-bread-120-g/' },
  'Britannia Cream Cheese Spread 180g': { id: '240792', slug: 'britannia-cream-cheese-spread-plain-180-g-tub/' },
  'Britannia Fruit Cake 250g': { id: '40128966', slug: 'britannia-fruit-cake-250-g/' },
  'Britannia Good Day Butter Cookies 250g': { id: '263025', slug: 'britannia-good-day-butter-cookies-250-g/' },
  'Britannia Milk Rusk 230g': { id: '241019', slug: 'britannia-premium-bake-rusk-milk-230-g/' },
  'Britannia Whole Wheat Bread 400g': { id: '40097069', slug: 'britannia-100-whole-wheat-bread-400-g/' },
  'Cadbury 5 Star Chocolate Bar 40g (Pack of 5)': { id: '40175098', slug: 'cadbury-5-star-chocolate-bar-40-g-pack-of-5/' },
  'Cadbury Dairy Milk Silk 150g': { id: '40021505', slug: 'cadbury-dairy-milk-silk-chocolate-bar-150-g/' },
  'Cadbury Gems 17.8g (Pack of 12)': { id: '40242766', slug: 'cadbury-gems-17-8-g-pack-of-12/' },
  'Catch Red Chilli Powder 200g': { id: '30005802', slug: 'catch-red-chilli-powder-200-g-pouch/' },
  'Catch Turmeric Powder 200g': { id: '30005800', slug: 'catch-turmeric-powder-200-g-pouch/' },
  'Cerelac Baby Cereal Wheat 300g': { id: '115541', slug: 'nestle-cerelac-baby-cereal-with-milk-wheat-from-6-months-300-g/' },
  'Closeup Everfresh Toothpaste 150g': { id: '30003939', slug: 'closeup-everfresh-toothpaste-red-hot-150-g/' },
  'Coca-Cola 750ml': { id: '251644', slug: 'coca-cola-soft-drink-750-ml-bottle/' },
  'Colgate Strong Teeth Toothpaste 200g': { id: '40186103', slug: 'colgate-strong-teeth-toothpaste-200-g/' },
  'Colin Glass Cleaner 500ml': { id: '40130355', slug: 'colin-glass-surface-cleaner-liquid-spray-regular-500-ml/' },
  'Comfort After Wash Fabric Conditioner 860ml': { id: '40052858', slug: 'comfort-after-wash-morning-fresh-fabric-conditioner-860-ml-pouch/' },
  'Complan Royale Chocolate 500g': { id: '40023862', slug: 'complan-royale-chocolate-500-g-refill-pack/' },
  'Dabur Honey 500g': { id: '112765', slug: 'dabur-honey-100-pure-worlds-no-1-honey-brand-500-g-bottle/' },
  'Dabur Real Litchi Juice 1L': { id: '40048810', slug: 'dabur-real-fruit-power-litchi-juice-1-l/' },
  'Dettol Antiseptic Liquid 250ml': { id: '241099', slug: 'dettol-antiseptic-disinfectant-liquid-250-ml-bottle/' },
  'Dettol Instant Hand Sanitizer 200ml': { id: '40044126', slug: 'dettol-instant-hand-sanitizer-original-200-ml/' },
  'Dettol Original Soap 125g (Pack of 4)': { id: '40186447', slug: 'dettol-bathing-soap-bar-original-125-g-pack-of-4/' },
  'Domex Fresh Guard Toilet Cleaner 500ml': { id: '40001284', slug: 'domex-fresh-guard-ocean-fresh-disinfectant-toilet-cleaner-500-ml/' },
  'Dove Body Wash 250ml': { id: '40185866', slug: 'dove-deeply-nourishing-body-wash-250-ml/' },
  'Dove Shampoo 340ml': { id: '40185931', slug: 'dove-intense-repair-shampoo-340-ml/' },
  'English Oven Burger Buns (Pack of 4)': { id: '40125825', slug: 'english-oven-burger-buns-pack-of-4/' },
  'Eno Fruit Salt Lemon 5g (Pack of 30)': { id: '40070791', slug: 'eno-fruit-salt-lemon-5-g-pack-of-30/' },
  'Epigamia Greek Yogurt Strawberry 90g': { id: '40063485', slug: 'epigamia-greek-yogurt-strawberry-90-g-cup/' },
  'Everest Kitchen King Masala 100g': { id: '30012637', slug: 'everest-kitchen-king-masala-100-g-pouch/' },
  'Fanta Orange 750ml': { id: '251646', slug: 'fanta-soft-drink-orange-flavoured-750-ml-bottle/' },
  'Fortune Sunlite Oil 1L': { id: '40047893', slug: 'fortune-sunlite-refined-sunflower-oil-1-l-pouch/' },
  'Frooti Mango 1.2L': { id: '40140826', slug: 'frooti-mango-drink-1-2-l-bottle/' },
  'Ghadi Detergent Powder 1kg': { id: '40085419', slug: 'ghadi-detergent-powder-1-kg/' },
  'Gillette Guard Razor (Pack of 3)': { id: '40072131', slug: 'gillette-guard-razor-pack-of-3/' },
  'Glucon-D Orange 1kg': { id: '40004752', slug: 'glucon-d-instant-energy-health-drink-orange-1-kg/' },
  'Go Cheese Grated Mozzarella 250g': { id: '40063486', slug: 'go-cheese-shredded-mozzarella-250-g-pouch/' },
  'Good Knight Gold Flash 45ml': { id: '40138791', slug: 'good-knight-gold-flash-liquid-vapourizer-machine-refill-45-ml/' },
  'Haldirams Aloo Bhujia 200g': { id: '260651', slug: 'haldirams-aloo-bhujia-200-g/' },
  'Harpic Power Plus 500ml': { id: '224893', slug: 'harpic-disinfectant-toilet-cleaner-liquid-original-500-ml/' },
  'Harvest Gold Multigrain Bread 450g': { id: '40178613', slug: 'harvest-gold-hearty-brown-bread-450-g/' },
  'Head & Shoulders Anti Dandruff Shampoo 340ml': { id: '40185945', slug: 'head-shoulders-anti-dandruff-shampoo-smooth-silky-340-ml/' },
  'Hide & Seek Chocolate Chip Cookies 200g': { id: '40024263', slug: 'parle-hide-seek-chocolate-chip-cookies-200-g/' },
  'Himalaya Neem Face Wash 200ml': { id: '40064204', slug: 'himalaya-purifying-neem-face-wash-200-ml/' },
  'Horlicks Classic Malt 500g': { id: '40020979', slug: 'horlicks-health-nutrition-drink-classic-malt-500-g-jar/' },
  'Kelloggs Chocos 375g': { id: '218414', slug: 'kelloggs-chocos-chocolaty-breakfast-375-g/' },
  'Kelloggs Corn Flakes 475g': { id: '218413', slug: 'kelloggs-corn-flakes-original-475-g/' },
  'Kissan Mixed Fruit Jam 500g': { id: '263299', slug: 'kissan-mixed-fruit-jam-500-g-jar/' },
  'Knorr Tomato Soup 53g': { id: '40004750', slug: 'knorr-classic-tomato-soup-53-g/' },
  'Kurkure Masala Munch 94g': { id: '40094345', slug: 'kurkure-namkeen-masala-munch-94-g/' },
  'Lays Classic Salted Chips 52g': { id: '40094327', slug: 'lays-potato-chips-classic-salted-52-g/' },
  'Lijjat Papad Masala 200g': { id: '30009011', slug: 'lijjat-papad-masala-200-g/' },
  'Lijjat Papad Udad 200g': { id: '30009006', slug: 'lijjat-papad-udad-plain-200-g/' },
  'Listerine Cool Mint Mouthwash 250ml': { id: '40044206', slug: 'listerine-mouthwash-cool-mint-250-ml/' },
  'Lizol Disinfectant Floor Cleaner Citrus 500ml': { id: '40001282', slug: 'lizol-disinfectant-surface-floor-cleaner-liquid-citrus-500-ml/' },
  'Maaza Mango Drink 600ml': { id: '40138668', slug: 'maaza-mango-drink-600-ml-bottle/' },
  'Maggi 2-Minute Noodles Masala (Pack of 12)': { id: '40040022', slug: 'maggi-2-minute-instant-noodles-masala-70-g-pack-of-12/' },
  'Maggi Cup Noodles Masala 70g': { id: '40019693', slug: 'maggi-cup-noodles-masala-70-g/' },
  'Maggi Hot & Sweet Tomato Chilli Sauce 1kg': { id: '40014297', slug: 'maggi-hot-sweet-tomato-chilli-sauce-1-kg-bottle/' },
  'Maggi Pasta Penne 400g': { id: '40020072', slug: 'maggi-pasta-penne-400-g/' },
  'Maggi Pazzta Cheese Macaroni 70g': { id: '40019694', slug: 'maggi-pazzta-instant-pasta-cheese-macaroni-70-g/' },
  'McVities Digestive Biscuits 250g': { id: '40024244', slug: 'mcvities-digestive-biscuits-250-g/' },
  'MDH Garam Masala 100g': { id: '40023730', slug: 'mdh-masala-deggi-mirch-100-g/' },
  'Milky Mist Paneer 200g': { id: '40028561', slug: 'milky-mist-premium-paneer-200-g-pouch/' },
  'Mother Dairy Classic Curd 400g': { id: '40026261', slug: 'mother-dairy-classic-curd-400-g-cup/' },
  'MTR Ready To Eat Poha 180g': { id: '40023880', slug: 'mtr-ready-to-eat-poha-180-g-box/' },
  'MTR Ready To Eat Upma 180g': { id: '40023876', slug: 'mtr-ready-to-eat-upma-180-g-box/' },
  'Nescafe Classic Coffee 100g': { id: '263510', slug: 'nescafe-classic-100-pure-instant-coffee-100-g-jar/' },
  'Nescafe Ready to Drink Cold Coffee 180ml': { id: '40153016', slug: 'nescafe-ready-to-drink-cold-coffee-180-ml-tetra-pak/' },
  'Nestle A+ Slim Milk 1L': { id: '40109851', slug: 'nestle-a-slim-milk-1-l-tetra-pak/' },
  'Nestle Milkmaid 400g': { id: '100369', slug: 'nestle-milkmaid-sweetened-condensed-milk-400-g-tin/' },
  'Nivea Body Lotion 400ml': { id: '40072020', slug: 'nivea-body-milk-nourishing-lotion-400-ml/' },
  'Nutella Hazelnut Spread 350g': { id: '40023818', slug: 'nutella-hazelnut-spread-with-cocoa-350-g-jar/' },
  'Odo Mos Mosquito Repellent Spray 100ml': { id: '40131003', slug: 'odomos-mosquito-repellent-spray-100-ml/' },
  'Oreo Original Cream Biscuit 120g': { id: '263176', slug: 'cadbury-oreo-original-vanilla-cream-biscuit-120-g/' },
  'Paper Boat Aam Panna 200ml': { id: '40094388', slug: 'paper-boat-drink-aam-panna-200-ml/' },
  'Parachute Coconut Oil 500ml': { id: '40044345', slug: 'parachute-100-pure-coconut-oil-500-ml-bottle/' },
  'Parle Monaco Salted Biscuit 200g': { id: '40023982', slug: 'parle-monaco-classic-regular-biscuit-200-g/' },
  'Parle-G Biscuits 250g': { id: '241009', slug: 'parle-g-original-glucose-biscuit-250-g/' },
  'Parle-G Gold Biscuits 100g': { id: '40024258', slug: 'parle-g-gold-biscuits-100-g/' },
  'Pepsi 750ml': { id: '251648', slug: 'pepsi-soft-drink-750-ml-bottle/' },
  'Pepsodent Germicheck Toothpaste 200g': { id: '30003941', slug: 'pepsodent-germicheck-cavity-protection-toothpaste-200-g/' },
  'Pillsbury Cookie Cake Chocolate 23g (Pack of 6)': { id: '40105765', slug: 'pillsbury-cookie-cake-chocolate-23-g-pack-of-6/' },
  'Pril Dishwash Liquid 425ml': { id: '40001294', slug: 'pril-dishwash-liquid-gel-lime-425-ml/' },
  'Pringles Original 107g': { id: '40037399', slug: 'pringles-potato-crisps-original-107-g/' },
  'Quaker Oats 1kg': { id: '40025746', slug: 'quaker-oats-1-kg/' },
  'Real Fruit Power Mixed Fruit 1L': { id: '40048812', slug: 'dabur-real-fruit-power-mixed-fruit-juice-1-l/' },
  'Red Bull Energy Drink 250ml': { id: '40037474', slug: 'red-bull-energy-drink-250-ml-can/' },
  'Rin Advanced Detergent Bar 250g': { id: '40052936', slug: 'rin-advanced-detergent-bar-250-g/' },
  'Saffola Gold Oil 1L': { id: '261379', slug: 'saffola-gold-refined-cooking-oil-blended-rice-bran-sunflower-oil-1-l-pouch/' },
  'Saffola Oats 1kg': { id: '40086429', slug: 'saffola-oats-1-kg/' },
  'Scotch-Brite Scrub Pad (Pack of 3)': { id: '30004115', slug: 'scotch-brite-scrub-pad-regular-pack-of-3/' },
  'Sprite Lemon-Lime 750ml': { id: '251650', slug: 'sprite-soft-drink-lime-flavoured-750-ml-bottle/' },
  'Sundrop Peanut Butter Creamy 462g': { id: '40072095', slug: 'sundrop-peanut-butter-creamy-462-g-jar/' },
  'Sunfeast Dark Fantasy Choco Fills 75g': { id: '40024288', slug: 'sunfeast-dark-fantasy-choco-fills-75-g/' },
  'Sunsilk Shampoo 340ml': { id: '40186019', slug: 'sunsilk-lusciously-thick-long-growth-shampoo-340-ml/' },
  'Surf Excel Easy Wash 1.5kg': { id: '40052895', slug: 'surf-excel-easy-wash-detergent-powder-1-5-kg/' },
  'Surf Excel Matic Liquid 1L': { id: '40052901', slug: 'surf-excel-matic-top-load-liquid-detergent-1-l/' },
  'Tang Orange 500g': { id: '40014343', slug: 'tang-instant-drink-mix-orange-500-g/' },
  'Tata Salt 1kg': { id: '208893', slug: 'tata-salt-iodised-salt-vacuum-evaporated-1-kg-pouch/' },
  'Tata Tea Gold 500g': { id: '40083741', slug: 'tata-tea-gold-500-g/' },
  'Tetley Green Tea Lemon 25 Bags': { id: '40029502', slug: 'tetley-green-tea-lemon-25-bags/' },
  'Too Yumm Multigrain Chips 54g': { id: '40094378', slug: 'too-yumm-multigrain-chips-chinese-hot-sour-54-g/' },
  'Tropicana Orange Juice 1L': { id: '40048802', slug: 'tropicana-100-orange-juice-with-no-added-sugar-1-l-tetra-pak/' },
  'Vaseline Body Lotion 400ml': { id: '40044381', slug: 'vaseline-intensive-care-deep-moisture-body-lotion-400-ml/' },
  'Vim Bar 300g (Pack of 3)': { id: '40001300', slug: 'vim-dishwash-bar-lemon-300-g-pack-of-3/' },
  'Vim Dishwash Gel Lemon 750ml': { id: '40001297', slug: 'vim-dishwash-gel-lemon-750-ml/' },
  'Whisper Choice Wings XL 20 Pads': { id: '40186458', slug: 'whisper-choice-wings-sanitary-pads-xl-20-pads/' },
  'Yippee Noodles Magic Masala (Pack of 6)': { id: '40086430', slug: 'sunfeast-yippee-noodles-magic-masala-70-g-pack-of-6/' },
};

// Generic/unbranded products — use specific branded matches
const GENERIC_MAP = {
  'Basmati Rice 1kg': { id: '40196654', slug: 'bb-royal-basmati-rice-mogra-broken-1-kg-pouch/', brand: 'BB Royal' },
  'Butter Croissants 4pc': { id: '40141746', slug: 'english-oven-butter-croissant-pack-of-4/', brand: 'English Oven' },
  'Chana Dal 1kg': { id: '204094', slug: 'bb-royal-chana-dal-1-kg-pouch/', brand: 'BB Royal' },
  'Cheese Slices 200g': { id: '104808', slug: 'amul-cheese-slices-200-g-pouch/', brand: 'Amul', note: 'Generic name; mapped to Amul Cheese Slices' },
  'Choco Chip Cookies 200g': { id: '40024263', slug: 'parle-hide-seek-chocolate-chip-cookies-200-g/', brand: 'Hide & Seek' },
  'Cold Coffee 250ml': { id: '40153016', slug: 'nescafe-ready-to-drink-cold-coffee-180-ml-tetra-pak/', brand: 'Nescafe', note: 'Closest match: Nescafe 180ml' },
  'Full Cream Milk 1L': { id: '104953', slug: 'amul-gold-homogenised-standardised-milk-1-l-pouch/', brand: 'Amul Gold' },
  'Instant Noodles 4pk': { id: '40040012', slug: 'maggi-2-minute-instant-noodles-masala-70-g-pack-of-4/', brand: 'Maggi' },
  'Modern White Bread 400g': { id: '40097078', slug: 'modern-super-white-bread-400-g/', brand: 'Modern' },
  'Moong Dal 1kg': { id: '204095', slug: 'bb-royal-moong-dal-1-kg-pouch/', brand: 'BB Royal' },
  'Orange Juice 1L': { id: '40048802', slug: 'tropicana-100-orange-juice-with-no-added-sugar-1-l-tetra-pak/', brand: 'Tropicana', note: 'Generic name; mapped to Tropicana' },
  'Rajma 500g': { id: '204088', slug: 'bb-royal-rajma-chitra-500-g-pouch/', brand: 'BB Royal' },
  'Red Apples 1kg': { id: '10000026', slug: 'fresho-apple-shimla-1-kg/', brand: 'Fresho' },
  'Rolled Oats 1kg': { id: '40086429', slug: 'saffola-oats-1-kg/', brand: 'Saffola', note: 'Mapped to Saffola Oats' },
  'Salted Chips 150g': { id: '40094327', slug: 'lays-potato-chips-classic-salted-52-g/', brand: "Lay's", note: 'Generic name; mapped to Lays Salted. Different size.' },
  'Sugar 1kg': { id: '40082654', slug: 'bb-royal-sugar-sulphurless-1-kg-pouch/', brand: 'BB Royal' },
  'Thick Curd 500g': { id: '40026261', slug: 'mother-dairy-classic-curd-400-g-cup/', brand: 'Mother Dairy', note: 'Closest match: Mother Dairy 400g' },
  'Toor Dal 1kg': { id: '204093', slug: 'bb-royal-toor-arhar-dal-1-kg-pouch/', brand: 'BB Royal' },
  'Whole Wheat Bread': { id: '40097069', slug: 'britannia-100-whole-wheat-bread-400-g/', brand: 'Britannia' },
};

async function processProduct(productName) {
  console.log(`Processing: ${productName}`);
  
  // Check curated map first
  const mapped = BB_PRODUCT_MAP[productName] || GENERIC_MAP[productName];
  if (mapped) {
    const pageUrl = `https://www.bigbasket.com/pd/${mapped.id}/${mapped.slug}`;
    // Try to get the actual image from the page
    const imageUrl = `https://www.bbassets.com/media/uploads/p/s/${mapped.id}_1.jpg`;
    
    // Check if URL is already used
    if (usedUrls.has(imageUrl)) {
      // Try alternate image index
      const altUrl = `https://www.bbassets.com/media/uploads/p/s/${mapped.id}_2.jpg`;
      if (!usedUrls.has(altUrl)) {
        usedUrls.add(altUrl);
        const note = mapped.note || `Matched via curated map - ${mapped.brand || 'BigBasket'}`;
        return { imageUrl: altUrl, sourcePage: pageUrl, note, source: 'BigBasket' };
      }
    }
    
    usedUrls.add(imageUrl);
    const note = mapped.note || `Matched via curated map`;
    return { imageUrl, sourcePage: pageUrl, note, source: 'BigBasket' };
  }
  
  // Try BigBasket search API
  const bbResult = await searchBigBasket(productName);
  if (bbResult && bbResult.imageUrl && !usedUrls.has(bbResult.imageUrl)) {
    usedUrls.add(bbResult.imageUrl);
    return {
      imageUrl: bbResult.imageUrl,
      sourcePage: bbResult.sourcePage,
      note: `API match: ${bbResult.productName} (score: ${bbResult.score.toFixed(2)})`,
      source: 'BigBasket',
    };
  }
  
  // Fallback: DuckDuckGo search for BigBasket page
  console.log(`  Trying DuckDuckGo for BigBasket...`);
  await sleep(2000);
  const bbPageUrl = await searchDuckDuckGo(productName, 'bigbasket.com');
  if (bbPageUrl && bbPageUrl.includes('bigbasket.com/pd/')) {
    const img = await extractBBImage(bbPageUrl);
    if (img && !usedUrls.has(img)) {
      usedUrls.add(img);
      return {
        imageUrl: img,
        sourcePage: bbPageUrl,
        note: 'Found via DuckDuckGo → BigBasket page scrape',
        source: 'BigBasket',
      };
    }
  }
  
  // Fallback: Amazon.in
  console.log(`  Trying Amazon.in...`);
  await sleep(2000);
  const amazonUrl = await searchDuckDuckGo(productName, 'amazon.in');
  if (amazonUrl && amazonUrl.includes('amazon.in')) {
    const img = await extractAmazonImage(amazonUrl);
    if (img && !usedUrls.has(img)) {
      usedUrls.add(img);
      return {
        imageUrl: img,
        sourcePage: amazonUrl,
        note: 'Fallback: Amazon.in',
        source: 'Amazon.in',
      };
    }
  }
  
  // No match
  return {
    imageUrl: 'needs_manual_review',
    sourcePage: '',
    note: 'No confident match found across BigBasket/Amazon',
    source: 'none',
  };
}

async function main() {
  const BATCH_SIZE = 15;
  let batchNum = 0;
  let totalMatched = 0;
  let totalManual = 0;
  const sourceCounts = { BigBasket: 0, 'Amazon.in': 0, Blinkit: 0, JioMart: 0, none: 0 };
  
  for (let i = 0; i < remaining.length; i++) {
    const product = remaining[i];
    
    if (i > 0 && i % BATCH_SIZE === 0) {
      batchNum++;
      console.log(`\n=== BATCH ${batchNum} COMPLETE ===`);
      console.log(`  Matched: ${totalMatched}, Needs Review: ${totalManual}\n`);
    }
    
    const result = await processProduct(product);
    
    // Append to CSV
    const csvLine = `${escapeCSV(product)},${escapeCSV(result.imageUrl)},${escapeCSV(result.sourcePage)},${escapeCSV(result.note)}`;
    appendFileSync(csvPath, csvLine + '\n', 'utf8');
    
    if (result.imageUrl === 'needs_manual_review') {
      totalManual++;
    } else {
      totalMatched++;
    }
    sourceCounts[result.source] = (sourceCounts[result.source] || 0) + 1;
    
    console.log(`  [${i + 1}/${remaining.length}] ${result.source}: ${result.imageUrl.substring(0, 80)}...`);
    
    // Rate limit
    await sleep(500);
  }
  
  console.log('\n========== FINAL SUMMARY ==========');
  console.log(`Total processed: ${remaining.length}`);
  console.log(`Matched: ${totalMatched}`);
  console.log(`Needs manual review: ${totalManual}`);
  console.log('Source breakdown:', JSON.stringify(sourceCounts, null, 2));
}

main().catch(console.error);
