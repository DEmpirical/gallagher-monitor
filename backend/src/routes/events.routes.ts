import { Router, Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { internalAuth } from '../middleware/auth';

const router = Router();

// GET /api/events - initial load with filters
router.get('/', internalAuth, async (req: Request, res: Response) => {
  try {
    // Apply query filters from request
    eventService.setFilters(req.query as any);
    const events = await eventService.fetchInitialEvents();
    const cursor = eventService.getCurrentFilters(); // we could also expose nextHref if needed
    res.json({ events, filters: cursor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/updates - long-poll updates
router.get('/updates', internalAuth, async (req: Request, res: Response) => {
  try {
    const updates = await eventService.pollEventUpdates();
    res.json({ events: updates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as eventsRouter };
