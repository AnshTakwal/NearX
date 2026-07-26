import { Router } from 'express';
import searchRoutes from './search.routes.js';
import deliveryRoutes from './delivery.routes.js';

const router = Router();

router.use('/search', searchRoutes);
router.use('/delivery-status', deliveryRoutes);

export default router;
