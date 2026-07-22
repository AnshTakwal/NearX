import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from the .env file in the root folder
dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// The Gemini API key from your .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /api/search
// Takes a natural language query, asks Gemini for relevant product names/keywords,
// then matches those against actual products in Supabase.
app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // ---------------------------------------------------------
    // STEP 1: Fetch ALL product names from database
    // ---------------------------------------------------------
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, store_id, is_active, status')
      .eq('is_active', true);

    if (productsError) throw productsError;

    const productNames = allProducts.map(p => p.name);

    // ---------------------------------------------------------
    // STEP 2: Ask Gemini to identify which products match the query
    // ---------------------------------------------------------
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: query }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API Error:', errText);
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
    } catch (err) {
      console.warn("Failed to parse Gemini output, falling back to empty results.", jsonText);
      matchedNames = [];
    }

    // ---------------------------------------------------------
    // STEP 3: Filter actual products by the names Gemini returned
    // ---------------------------------------------------------
    const matchedProducts = allProducts.filter(product =>
      matchedNames.some(name => 
        product.name.toLowerCase() === name.toLowerCase()
      )
    );

    // ---------------------------------------------------------
    // STEP 4: Return the matched products
    // ---------------------------------------------------------
    res.json({
      query,
      matchedCount: matchedProducts.length,
      products: matchedProducts
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'An error occurred during search' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`NearX Search Server running on http://localhost:${PORT}`);
});
