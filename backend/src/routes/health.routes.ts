import { Router, Request, Response } from 'express';
import { gallagherClient } from '../clients/gallagher.client';

const router = Router();

// GET /health - backend health
router.get('/health', async (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /health/gallagher - test Gallagher connectivity
router.get('/health/gallagher', async (_req: Request, res: Response) => {
  try {
    const apiRoot = await gallagherClient.getApiRoot();
    res.json({ status: 'connected', links: apiRoot._links });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

export { router as healthRouter };
