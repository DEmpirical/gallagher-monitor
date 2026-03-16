import fs from 'fs';
import path from 'path';
import * as https from 'https';
import { logger } from '../utils/logger';

export interface AppConfig {
  gallagher: {
    host: string;
    port: number;
    apiKey: string;
    strictSsl: boolean;
    ignoreSsl?: boolean;
    clientCertThumbprint?: string;
    timeout: number;
    pollInterval: number;
    defaultFields: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  gallagher: {
    host: '',
    port: 8443,
    apiKey: '',
    strictSsl: true,
    timeout: 30000,
    pollInterval: 15000,
    defaultFields: 'defaults,source,eventType,division,cardholder,priority,occurrences',
  },
};

function parseBool(val?: string, fallback: boolean = false): boolean {
  if (!val) return fallback;
  return val === 'true' || val === '1' || val === 'yes';
}

class ConfigService {
  private config: AppConfig;
  private configPath: string;

  constructor() {
    this.configPath = process.env.CONFIG_PATH || path.resolve(process.cwd(), 'config.json');
    this.config = this.load();
  }

  getHttpsAgent(): https.Agent | undefined {
    const cfg = this.config.gallagher;
    if (!cfg.host.startsWith('https://')) {
      return undefined;
    }

    const agentOptions: https.RequestOptions = {};

    // Certificado cliente desde store de Windows (solo win32)
    if (cfg.clientCertThumbprint && process.platform === 'win32') {
      try {
        const { Store } = require('win-ca');
        const store = new Store();
        const certs = store.findSync({ thumbprint: cfg.clientCertThumbprint });
        if (certs.length === 0) {
          throw new Error(`Certificado no encontrado en store: ${cfg.clientCertThumbprint}`);
        }
        const cert = certs[0];
        agentOptions.cert = cert.toPEM();
        if (cert.privateKey) {
          agentOptions.key = cert.privateKey.toPEM();
        } else {
          logger.warn('Certificado encontrado pero sin clave privada');
        }
      } catch (error: any) {
        logger.error('Error cargando certificado desde Windows store', { error: error.message });
      }
    }

    // Validación de certificado del servidor
    const ignore = cfg.ignoreSsl || !cfg.strictSsl;
    agentOptions.rejectUnauthorized = !ignore;

    return new https.Agent(agentOptions);
  }

  private load(): AppConfig {
    try {
      // Fusionar defaults, .env, y config.json
      const merged: any = { ...DEFAULT_CONFIG };

      // 1) Cargar config.json si existe
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        merged.gallagher = { ...DEFAULT_CONFIG.gallagher, ...parsed.gallagher };
      }

      // 2) Aplicar variables de entorno como overrides (para desarrollo)
      if (process.env.GALLAGHER_HOST) merged.gallagher.host = process.env.GALLAGHER_HOST;
      if (process.env.GALLAGHER_PORT) merged.gallagher.port = parseInt(process.env.GALLAGHER_PORT, 10);
      if (process.env.GALLAGHER_API_KEY) merged.gallagher.apiKey = process.env.GALLAGHER_API_KEY;
      if (process.env.GALLAGHER_CLIENT_CERT_THUMBPRINT) merged.gallagher.clientCertThumbprint = process.env.GALLAGHER_CLIENT_CERT_THUMBPRINT;
      if (process.env.GALLAGHER_IGNORE_SERVER_CERT !== undefined) merged.gallagher.ignoreSsl = parseBool(process.env.GALLAGHER_IGNORE_SERVER_CERT);
      if (process.env.GALLAGHER_STRICT_SSL !== undefined) merged.gallagher.strictSsl = parseBool(process.env.GALLAGHER_STRICT_SSL);
      if (process.env.GALLAGHER_TIMEOUT) merged.gallagher.timeout = parseInt(process.env.GALLAGHER_TIMEOUT, 10);
      if (process.env.GALLAGHER_POLL_INTERVAL) merged.gallagher.pollInterval = parseInt(process.env.GALLAGHER_POLL_INTERVAL, 10);
      if (process.env.GALLAGHER_DEFAULT_FIELDS) merged.gallagher.defaultFields = process.env.GALLAGHER_DEFAULT_FIELDS;

      return merged as AppConfig;
    } catch (error: any) {
      logger.error('Failed to load config', { error: error.message });
    }
    return { ...DEFAULT_CONFIG };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      logger.info('Configuration saved', { path: this.configPath });
    } catch (error: any) {
      logger.error('Failed to save config', { error: error.message });
      throw new Error('Unable to save configuration');
    }
  }

  getConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  updateConfig(partial: Partial<AppConfig>): AppConfig {
    if (partial.gallagher?.apiKey) {
      this.validateApiKey(partial.gallagher.apiKey);
    }
    if (partial.gallagher?.host) {
      this.validateHost(partial.gallagher.host);
    }
    if (partial.gallagher?.port !== undefined) {
      if (partial.gallagher.port < 1 || partial.gallagher.port > 65535) {
        throw new Error('Port must be between 1 and 65535');
      }
    }
    if (partial.gallagher) {
      this.config.gallagher = { ...this.config.gallagher, ...partial.gallagher };
    }
    this.save();
    logger.info('Configuration updated');
    return this.getConfig();
  }

  private validateApiKey(apiKey: string) {
    if (!apiKey.startsWith('GGL-API-KEY')) {
      throw new Error('API Key must start with "GGL-API-KEY"');
    }
  }

  private validateHost(host: string) {
    try {
      new URL(host);
    } catch {
      throw new Error('Host must be a valid URL (include https://)');
    }
  }

  getMaskedConfig(): Omit<AppConfig, 'gallagher'> & { gallagher: Omit<AppConfig['gallagher'], 'apiKey'> & { apiKeyMasked: string } & Pick<AppConfig['gallagher'], 'host' | 'port' | 'strictSsl' | 'ignoreSsl' | 'timeout' | 'pollInterval' | 'defaultFields'> } {
    const cfg = this.getConfig();
    const mask = (s: string) => s.length > 8 ? `${'*'.repeat(s.length - 4)}${s.slice(-4)}` : '****';
    return {
      gallagher: {
        host: cfg.gallagher.host,
        port: cfg.gallagher.port,
        strictSsl: cfg.gallagher.strictSsl,
        ignoreSsl: cfg.gallagher.ignoreSsl,
        timeout: cfg.gallagher.timeout,
        pollInterval: cfg.gallagher.pollInterval,
        defaultFields: cfg.gallagher.defaultFields,
        apiKeyMasked: mask(cfg.gallagher.apiKey),
      },
    };
  }

  isConfigured(): boolean {
    return !!(this.config.gallagher.host && this.config.gallagher.apiKey && this.config.gallagher.port);
  }

  clear(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
  }
}

export const configService = new ConfigService();
