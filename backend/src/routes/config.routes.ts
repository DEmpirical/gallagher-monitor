import { Router, Request, Response } from 'express';
import { configService } from '../services/config.service';
import { internalAuth } from '../middleware/auth';
import { GallagherClient } from '../clients/gallagher.client';

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
  const { host, port, apiKey, ignoreSsl } = req.body as any;
  if (!host || !apiKey) {
    return res.status(400).json({ success: false, error: 'Host, puerto y API Key son requeridos' });
  }
  try {
    // Validar formato de API key
    if (!apiKey.startsWith('GGL-API-KEY')) {
      return res.status(400).json({ success: false, error: 'API Key debe comenzar con "GGL-API-KEY"' });
    }
    // Validar host como URL
    try {
      new URL(host);
    } catch {
      return res.status(400).json({ success: false, error: 'Host debe ser una URL válida (ej: https://servidor:8443)' });
    }
    // Validar puerto numérico
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return res.status(400).json({ success: false, error: 'Puerto debe ser un número entre 1 y 65535' });
    }

    // Crear cliente temporal con la configuración de prueba
    const testConfig = {
      host,
      port: portNum,
      apiKey,
      strictSsl: !ignoreSsl,
      ignoreSsl: !!ignoreSsl,
      timeout: 30000,
    };
    const client = new GallagherClient(testConfig);

    // Test connection: GET /api
    const apiRoot = await client.getApiRoot();
    res.json({ success: true, message: 'Conexión exitosa', links: apiRoot._links });
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
