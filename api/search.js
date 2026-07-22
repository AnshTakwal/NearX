import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// CORS headers for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Set CORS headers on all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase is not configured. Check environment variables.' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured. Check environment variables.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { query } = body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Fetch all product names from DB
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, store_id, is_active, status')
      .eq('is_active', true);

    if (productsError) throw productsError;

    const productNames = allProducts.map(p => p.name);

    // STEP 2: Ask Gemini to match products from the list
    const systemPrompt = `You are an AI shopping assistant for a grocery and household items app called NearX. 
The user will describe what they're looking for in natural language (e.g. "breakfast items for kids", "healthy snacks", "cleaning supplies for bathroom").

Here is the complete list of products currently available in the app:
${JSON.stringify(productNames)}

Your task:
1. Understand the user's intent.
2. From the product list above, identify ALL products that match the user's request.
3. Return ONLY a JSON array of the matching product names, exactly as they appear in the list.
4. If no products match, return an empty array [].
5. Be generous in matching - include anything that could reasonably fit the user's request.
6. Return ONLY valid JSON (a string array), no markdown formatting, no explanation.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [{
          parts: [{ text: query }],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    let jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';

    // Strip markdown code fences if present
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    let matchedNames;
    try {
      matchedNames = JSON.parse(jsonText);
      if (!Array.isArray(matchedNames)) {
        matchedNames = [];
      }
    } catch (error) {
      console.warn('Failed to parse Gemini output, falling back to empty results.', jsonText);
      matchedNames = [];
    }

    // STEP 3: Filter actual products by the names Gemini returned
    const matchedProducts = allProducts.filter(product =>
      matchedNames.some(name =>
        product.name.toLowerCase() === name.toLowerCase()
      )
    );

    return res.status(200).json({
      query,
      matchedCount: matchedProducts.length,
      products: matchedProducts,
    });
  } catch (error) {
    console.error('Search API Error:', error);
    return res.status(500).json({ error: 'An error occurred during search' });
  }
}
