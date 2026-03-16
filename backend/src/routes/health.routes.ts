import { Router, Request, Response } from 'express';
import { gallagherClient } from '../clients/gallagher.client';

const router = Router();

// GET /api/health - backend health
router.get('/', async (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/health/gallagher - test Gallagher connectivity
router.get('/gallagher', async (_req: Request, res: Response) => {
  try {
    const apiRoot = await gallagherClient.getApiRoot();
    res.json({ status: 'connected', links: apiRoot._links });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export { router as healthRouter };
