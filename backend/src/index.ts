import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { alarmsRouter } from './routes/alarms.routes';
import { eventsRouter } from './routes/events.routes';
import { configRouter } from './routes/config.routes';
import { healthRouter } from './routes/health.routes';
import { internalAuth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';

validateConfig();

const app = express();

// Middleware
app.use(cors({
  origin: config.server.allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/alarms', internalAuth, alarmsRouter);
app.use('/api/events', internalAuth, eventsRouter);
app.use('/api/config', configRouter);
app.use('/health', healthRouter);

// Error handling
app.use(errorHandler);

// Start
const server = app.listen(config.server.port, () => {
  logger.info(`Gallagher Monitor backend listening on port ${config.server.port}`);
  logger.info(`Gallagher host: ${config.gallagher.host}`);
});

export { app, server };
