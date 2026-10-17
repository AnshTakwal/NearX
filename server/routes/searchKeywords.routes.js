import { Router } from 'express';
import { handleSearchKeywords } from '../controllers/searchKeywords.controller.js';
import { requireFields } from '../middlewares/validator.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// POST /api/search-keywords
// Scalable: extracts keywords + optional maxPrice from a natural language query.
// Rate-limited to 20 req/min per IP.
router.post(
  '/',
  rateLimiter({ windowMs: 60_000, max: 20 }),
  requireFields(['query']),
  handleSearchKeywords
);

export default router;
