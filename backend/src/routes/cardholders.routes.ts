import { Router, Request, Response } from 'express';
import { GallagherClient } from '../clients/gallagher.client';

const router = Router();
const gallagherClient = new GallagherClient();

// GET /api/cardholders — listar cardholders con filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, limit, offset } = req.query;
    const result = await gallagherClient.getCardHolders({
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as cardholdersRouter };
