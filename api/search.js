import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key is not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { query } = body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const systemPrompt = `
      You are an AI assistant for a grocery app. Convert the user's search query into a JSON object.
      The JSON must match this exact structure:
      {
        "category": "string or null",
        "max_price": "number or null",
        "days_left_max": "number or null",
        "keywords": ["array", "of", "strings"]
      }
      Rules:
      - If category, max_price, or days_left_max are not mentioned, set them to null.
      - If no keywords, return an empty array [].
      - Return ONLY valid JSON, without any markdown formatting like \`\`\`json.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    let jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    let filters;
    try {
      filters = JSON.parse(jsonText);
    } catch (error) {
      console.warn('Failed to parse Gemini output, falling back to empty filters.', jsonText);
      filters = { category: null, max_price: null, days_left_max: null, keywords: [] };
    }

    let dbQuery = supabase.from('products').select('*');

    if (filters.category) {
      dbQuery = dbQuery.ilike('category', `%${filters.category}%`);
    }

    if (filters.max_price !== null) {
      dbQuery = dbQuery.lte('sale_price', filters.max_price * 100);
    }

    if (filters.days_left_max !== null) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + filters.days_left_max);
      dbQuery = dbQuery.lte('expiry_date', targetDate.toISOString());
    }

    if (filters.keywords && filters.keywords.length > 0) {
      dbQuery = dbQuery.ilike('name', `%${filters.keywords[0]}%`);
    }

    const { data: products, error } = await dbQuery;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      filtersApplied: filters,
      products,
    });
  } catch (error) {
    console.error('Search API Error:', error);
    return res.status(500).json({ error: 'An error occurred during search' });
  }
}
