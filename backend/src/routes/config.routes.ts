import { Router, Request, Response } from 'express';
import { configService } from '../services/config.service';
import { internalAuth } from '../middleware/auth';
import { GallagherClient } from '../clients/gallagher.client';
import { logger } from '../utils/logger';

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

// POST /api/config/test — probar conexión sin guardar
router.post('/test', internalAuth, async (req: Request, res: Response) => {
  const { host, port, apiKey } = req.body as any;
  if (!host || !apiKey) {
    return res.status(400).json({ success: false, error: 'Host, puerto y API Key son requeridos' });
  }
  try {
    // Validar que API key no esté vacío
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ success: false, error: 'API Key es requerida' });
    }
    // Validar host (acepta hostname sin protocolo)
    try {
      const url = host.includes('://') ? host : `https://${host}`;
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Host debe ser una URL válida (ej: https://servidor:8443) o un hostname (ej: servidor)' });
    }
    // Validar puerto numérico
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({ success: false, error: 'Puerto debe ser un número entre 1 y 65535' });
    }

    // Obtener configuración actual (incluye strictSsl, ignoreSsl, clientCertThumbprint, timeout)
    const currentConfig = configService.getConfig();

    // Crear cliente temporal con la configuración de prueba
    // Usa la misma configuración TLS que el backend (currentConfig.gallagher) pero con host/port/apiKey nuevos
    const testConfig = {
      gallagher: {
        ...currentConfig.gallagher,
        host,
        port: portNum,
        apiKey,
        timeout: 10000, // timeout corto para test
      }
    };
    const client = new GallagherClient(testConfig);

    // Test connection: GET /api/events?limit=1 (ligero)
    const testResponse = await client.getEvents({ limit: 1 });
    res.json({ 
      success: true, 
      message: 'Conexión exitosa', 
      eventsFetched: testResponse.events.length,
      nextAvailable: !!testResponse.nextHref
    });
  } catch (error: any) {
    logger.error('Config test failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/config — limpiar configuración
router.delete('/', internalAuth, (req: Request, res: Response) => {
  configService.clear();
  res.json({ success: true });
});

export { router as configRouter };
