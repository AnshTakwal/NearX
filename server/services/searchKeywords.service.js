/**
 * Scalable search service — extracts keywords from a natural-language query
 * using Gemini, without sending the product catalog to the model.
 *
 * This is the CANONICAL implementation. The old approach in search.service.js
 * (sending all product names to Gemini) is deprecated.
 */

import { GEMINI_API_URL, GEMINI_API_KEY } from '../config/gemini.config.js';
import { logger } from '../utils/logger.util.js';

const KEYWORD_PROMPT = `You are a keyword extractor for a grocery and household items search engine.
Given a user's natural-language search query, return a JSON object with exactly two keys:
  "keywords": an array of 3 to 10 single-word search keywords (lowercase, no phrases),
  "maxPrice": a number (in Indian Rupees) if the user mentions a budget/price limit, or null otherwise.

Rules:
- Only return valid JSON. No markdown, no explanation, no code fences.
- keywords must be single English words relevant to grocery/household products.
- Be generous: include synonyms, category words, and brand-adjacent terms.

Example input:  "healthy snacks under 100 rupees"
Example output: {"keywords":["healthy","snacks","granola","nuts","muesli","protein","oats","bar"],"maxPrice":100}`;

export const extractKeywords = async (query) => {
  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini API key not configured');
    err.status = 503;
    throw err;
  }

  const geminiResponse = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: KEYWORD_PROMPT }] },
      contents: [{ parts: [{ text: query }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    }),
  });

  if (!geminiResponse.ok) {
    const err = new Error(`Gemini API error: ${geminiResponse.statusText}`);
    err.status = geminiResponse.status;
    logger.error('Gemini API error:', geminiResponse.status, geminiResponse.statusText);
    throw err;
  }

  const geminiData = await geminiResponse.json();
  let jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

  // Strip markdown code fences if present
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let result;
  try {
    result = JSON.parse(jsonText);
  } catch {
    logger.warn('Failed to parse Gemini keyword output, falling back.', jsonText);
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

  return { keywords, maxPrice };
};
