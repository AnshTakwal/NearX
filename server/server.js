import app from './app.js';
import { config } from './config/env.config.js';
import { logger } from './utils/logger.util.js';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`NearX Server running on http://localhost:${PORT}`);
});
