/**
 * POST /api/search  (DEPRECATED)
 *
 * This handler sends the ENTIRE product-name list to Gemini on every request,
 * which does not scale as the catalog grows.
 *
 * Use /api/search-keywords instead — it extracts keywords from the query and
 * lets the client filter products via Supabase.
 *
 * This file is kept temporarily so any old clients still hitting /api/search
 * get a working (but slow) response. Remove once all clients are migrated.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Search service is temporarily unavailable.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { query } = body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.warn('[DEPRECATED] /api/search was called — migrate to /api/search-keywords');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, store_id, is_active, status')
      .eq('is_active', true);

    if (productsError) throw productsError;

    const productNames = allProducts.map(p => p.name);

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: query.trim().slice(0, 200) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      }),
    });

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      if (status === 429) return res.status(429).json({ error: 'AI service is busy.' });
      if (status === 403) return res.status(503).json({ error: 'AI service configuration error.' });
      return res.status(503).json({ error: 'AI service temporarily unavailable.' });
    }

    const geminiData = await geminiResponse.json();
    let jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';

    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    let matchedNames;
    try {
      matchedNames = JSON.parse(jsonText);
      if (!Array.isArray(matchedNames)) matchedNames = [];
    } catch {
      matchedNames = [];
    }

    const matchedProducts = allProducts.filter(product =>
      matchedNames.some(name => product.name.toLowerCase() === name.toLowerCase())
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
