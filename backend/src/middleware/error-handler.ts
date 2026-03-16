import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error('Unhandled error', {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error', message: err.message });
};
