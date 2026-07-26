import { Router } from 'express';
import { handleDeliveryStatus } from '../controllers/delivery.controller.js';
import { requireFields } from '../middlewares/validator.js';

const router = Router();

// POST /api/delivery-status
// Updates the delivery assignment and syncs back to the orders table bypassing RLS
router.post('/', requireFields(['assignmentId', 'status']), handleDeliveryStatus);

export default router;
