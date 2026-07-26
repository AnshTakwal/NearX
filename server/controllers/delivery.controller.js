import { updateDeliveryStatus } from '../services/delivery.service.js';
import { logger } from '../utils/logger.util.js';

export const handleDeliveryStatus = async (req, res) => {
  const { assignmentId, status } = req.body;

  try {
    await updateDeliveryStatus(assignmentId, status);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delivery Status Update Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
};
