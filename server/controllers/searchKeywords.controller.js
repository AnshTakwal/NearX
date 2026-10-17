import { extractKeywords } from '../services/searchKeywords.service.js';
import { logger } from '../utils/logger.util.js';

const MAX_QUERY_LENGTH = 200;

export const handleSearchKeywords = async (req, res) => {
  const rawQuery = req.body.query;

  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

  try {
    const result = await extractKeywords(query);
    res.json(result);
  } catch (error) {
    logger.error('Search keywords error:', error);

    if (error.status === 429) {
      return res.status(429).json({ error: 'AI service is busy. Please try again shortly.' });
    }
    if (error.status === 403 || error.status === 503) {
      return res.status(503).json({ error: 'AI service is temporarily unavailable.' });
    }

    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
};
