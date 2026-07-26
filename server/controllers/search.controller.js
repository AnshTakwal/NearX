import { searchProducts } from '../services/search.service.js';
import { logger } from '../utils/logger.util.js';

export const handleSearch = async (req, res) => {
  const { query } = req.body;

  try {
    const matchedProducts = await searchProducts(query);

    res.json({
      query,
      matchedCount: matchedProducts.length,
      products: matchedProducts,
    });
  } catch (error) {
    logger.error('Server Error:', error);
    res.status(500).json({ error: 'An error occurred during search' });
  }
};
