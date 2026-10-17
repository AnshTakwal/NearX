import { Router } from 'express';
import searchRoutes from './search.routes.js';
import searchKeywordsRoutes from './searchKeywords.routes.js';
import deliveryRoutes from './delivery.routes.js';

const router = Router();

router.use('/search', searchRoutes);            // DEPRECATED — kept for backwards compat
router.use('/search-keywords', searchKeywordsRoutes); // Canonical keyword-extraction endpoint
router.use('/delivery-status', deliveryRoutes);

export default router;
