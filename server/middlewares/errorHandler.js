import { logger } from '../utils/logger.util.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message || 'An error occurred', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
};
