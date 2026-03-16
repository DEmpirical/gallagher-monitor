import { Router, Request, Response } from 'express';
import { configService } from '../services/config.service';
import { internalAuth } from '../middleware/auth';

const router = Router();

// GET /api/config — obtener configuración (mascada)
router.get('/', internalAuth, (req: Request, res: Response) => {
  const masked = configService.getMaskedConfig();
  const isConfigured = configService.isConfigured();
  res.json({ ...masked, isConfigured });
});

// POST /api/config — guardar configuración completa
router.post('/', internalAuth, (req: Request, res: Response) => {
  try {
    const partial = req.body as any;
    const updated = configService.updateConfig(partial);
    res.json({ success: true, config: configService.getMaskedConfig() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/config/test — probar conexión a Gallagher
router.post('/test', internalAuth, async (req: Request, res: Response) => {
  const { host, apiKey, strictSsl } = req.body as any;
  if (!host || !apiKey) {
    return res.status(400).json({ success: false, error: 'Host y API key requeridos' });
  }

  // Usar un cliente temporal con estas credenciales
  const testClient = {
    host: host.replace(/\/$/, ''),
    apiKey,
    strictSsl,
  };

  try {
    // Test connection: GET /api (lightweight)
    const response = await fetch(`${testClient.host}/api`, {
      headers: {
        'Authorization': `Bearer ${testClient.apiKey}`,
        'Accept': 'application/json',
      },
      // Could add rejectUnauthorized: strictSsl if using https.Agent with custom cert handling
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(400).json({ success: false, error: `HTTP ${response.status}: ${response.statusText} - ${text}` });
    }

    const data = await response.json();
    res.json({ success: true, message: 'Conexión exitosa', links: data._links });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/config — limpiar configuración
router.delete('/', internalAuth, (req: Request, res: Response) => {
  configService.clear();
  res.json({ success: true });
});

export { router as configRouter };
