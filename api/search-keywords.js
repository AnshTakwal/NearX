/**
 * POST /api/search-keywords
 *
 * Scalable AI search endpoint: extracts keywords from a natural-language query
 * using Gemini, then returns them so the client can filter products locally or
 * via Supabase. This replaces the old approach of sending every product name
 * to the model.
 *
 * Request:  { query: string }
 * Response: { keywords: string[], maxPrice: number|null }
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_QUERY_LENGTH = 200;

// Simple in-memory rate limiter (per-IP, Vercel cold-starts reset this)
// NOTE: On Vercel serverless each invocation may be a fresh container, so this
// only limits bursts within a single warm container. For production, use
// Vercel's built-in rate limiting or an external store (Redis / Upstash).
const rateMap = new Map();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX_REQUESTS = 20;  // max requests per IP per window

function isRateLimited(ip) {
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    entry = { windowStart: now, count: 1 };
    rateMap.set(ip, entry);
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX_REQUESTS;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // CORS preflight
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

  // --- Rate limiting ---
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // --- Validate API key ---
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Search service is temporarily unavailable.' });
  }

  // --- Parse body ---
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const rawQuery = body.query;
  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

  // --- Call Gemini for keyword extraction ---
  const systemPrompt = `You are a keyword extractor for a grocery and household items search engine.
Given a user's natural-language search query, return a JSON object with exactly two keys:
  "keywords": an array of 3 to 10 single-word search keywords (lowercase, no phrases),
  "maxPrice": a number (in Indian Rupees) if the user mentions a budget/price limit, or null otherwise.

Rules:
- Only return valid JSON. No markdown, no explanation, no code fences.
- keywords must be single English words relevant to grocery/household products.
- Be generous: include synonyms, category words, and brand-adjacent terms.

Example input:  "healthy snacks under 100 rupees"
Example output: {"keywords":["healthy","snacks","granola","nuts","muesli","protein","oats","bar"],"maxPrice":100}`;

  try {
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: query }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    });

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      if (status === 429) {
        return res.status(429).json({ error: 'AI service is busy. Please try again shortly.' });
      }
      if (status === 403) {
        return res.status(503).json({ error: 'AI service configuration error.' });
      }
      return res.status(503).json({ error: 'AI service is temporarily unavailable.' });
    }

    const geminiData = await geminiResponse.json();
    let jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

    // Strip markdown code fences if present
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch {
      // Fallback on parse failure
      result = { keywords: [], maxPrice: null };
    }

    // Validate and sanitize
    const keywords = Array.isArray(result.keywords)
      ? result.keywords
        .filter(k => typeof k === 'string' && k.trim().length > 0)
        .map(k => k.trim().toLowerCase().slice(0, 30))
        .slice(0, 10)
      : [];

    const maxPrice = typeof result.maxPrice === 'number' && result.maxPrice > 0
      ? result.maxPrice
      : null;

    return res.status(200).json({ keywords, maxPrice });
  } catch (error) {
    console.error('search-keywords error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
