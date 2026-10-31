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

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
  let geminiData = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: KEYWORD_PROMPT }] },
          contents: [{ parts: [{ text: query }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      });

      if (response.ok) {
        geminiData = await response.json();
        break;
      }
      logger.warn(`Gemini (${model}) returned status ${response.status}`);
    } catch (err) {
      logger.warn(`Fetch to Gemini (${model}) failed:`, err);
    }
  }

  // Graceful fallback if models are busy or overloaded (503)
  if (!geminiData) {
    logger.warn('All Gemini models unavailable. Using local fallback keyword extraction.');
    const stopWords = new Set(['for', 'the', 'and', 'with', 'in', 'of', 'items', 'item', 'food', 'good', 'some', 'any', 'under', 'rupees', 'rs']);
    const extractedWords = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    return {
      keywords: extractedWords.length > 0 ? extractedWords : [query.toLowerCase()],
      maxPrice: null
    };
  }
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
