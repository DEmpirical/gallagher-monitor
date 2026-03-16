import { Router, Request, Response } from 'express';
import { alarmService } from '../services/alarm.service';
import { internalAuth } from '../middleware/auth';

const router = Router();

// GET /api/alarms - initial load
router.get('/', internalAuth, async (req: Request, res: Response) => {
  try {
    const alarms = await alarmService.fetchInitialAlarms();
    const cursor = alarmService.getCursor();
    res.json({ alarms, cursor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alarms/updates - long-poll updates
router.get('/updates', internalAuth, async (req: Request, res: Response) => {
  try {
    const updates = await alarmService.pollAlarmUpdates();
    const cursor = alarmService.getCursor();
    res.json({ alarms: updates, cursor });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/alarms/:id/acknowledge
router.post('/:id/acknowledge', internalAuth, async (req: Request, res: Response) => {
  try {
    await alarmService.acknowledge(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/alarms/:id/clear
router.post('/:id/clear', internalAuth, async (req: Request, res: Response) => {
  try {
    await alarmService.clear(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as alarmsRouter };
