import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'];
  if (!token || token !== config.internalToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
