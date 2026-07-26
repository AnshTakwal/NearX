import { supabaseAnonClient } from '../config/supabase.config.js';
import { GEMINI_API_URL, GEMINI_API_KEY } from '../config/gemini.config.js';
import { GEMINI_CONFIG } from '../utils/constants.js';
import { buildSearchPrompt, parseGeminiResponse } from '../utils/gemini.util.js';
import { logger } from '../utils/logger.util.js';

export const searchProducts = async (query) => {
  // STEP 1: Fetch ALL product names from database
  const { data: allProducts, error: productsError } = await supabaseAnonClient
    .from('products')
    .select('id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, store_id, is_active, status')
    .eq('is_active', true);

  if (productsError) {
    logger.error('Error fetching products from Supabase:', productsError);
    throw new Error('Failed to fetch products from the database');
  }

  const productNames = allProducts.map((p) => p.name);

  // STEP 2: Ask Gemini to identify which products match the query
  const systemPrompt = buildSearchPrompt(productNames);

  const geminiResponse = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: query }],
        },
      ],
      generationConfig: GEMINI_CONFIG,
    }),
  });

  if (!geminiResponse.ok) {
    const errText = await geminiResponse.text();
    logger.error('Gemini API Error:', errText);
    throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
  }

  const geminiData = await geminiResponse.json();
  const matchedNames = parseGeminiResponse(geminiData);

  // STEP 3: Filter actual products by the names Gemini returned
  const matchedProducts = allProducts.filter((product) =>
    matchedNames.some((name) => product.name.toLowerCase() === name.toLowerCase())
  );

  return matchedProducts;
};
