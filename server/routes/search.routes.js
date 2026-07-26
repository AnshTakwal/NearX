import { Router } from 'express';
import { handleSearch } from '../controllers/search.controller.js';
import { requireFields } from '../middlewares/validator.js';

const router = Router();

// POST /api/search
// Takes a natural language query, asks Gemini for relevant product names/keywords,
// then matches those against actual products in Supabase.
router.post('/', requireFields(['query']), handleSearch);

export default router;
