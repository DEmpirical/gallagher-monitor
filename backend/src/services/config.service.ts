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

class ConfigService {
  private config: AppConfig;
  private configPath: string;

  constructor() {
    this.configPath = process.env.CONFIG_PATH || path.resolve(process.cwd(), 'config.json');
    this.config = this.load();
  }

  getHttpsAgent(): https.Agent | undefined {
    const cfg = this.config.gallagher;
    // Solo usamos agent para HTTPS
    // Si no es HTTPS, devolvemos undefined (fetch usará default)
    if (!cfg.host.startsWith('https://')) {
      return undefined;
    }

    const agentOptions: https.RequestOptions = {};

    // 1) Certificado cliente desde store de Windows (solo Windows)
    if (cfg.clientCertThumbprint && process.platform === 'win32') {
      try {
        // Instalar win-ca: npm install win-ca
        const { Store } = require('win-ca');
        const store = new Store();
        const certs = store.findSync({ thumbprint: cfg.clientCertThumbprint });
        if (certs.length === 0) {
          throw new Error(`Certificado no encontrado en store: ${cfg.clientCertThumbprint}`);
        }
        const cert = certs[0];
        // Convertir a PEM
        agentOptions.cert = cert.toPEM();
        if (cert.privateKey) {
          agentOptions.key = cert.privateKey.toPEM();
        } else {
          logger.warn('Certificado encontrado pero sin clave privada');
        }
      } catch (error: any) {
        logger.error('Error cargando certificado desde Windows store', { error: error.message });
        // No lanzamos error aquí, podríamos continuar sin cert si Gallagher no lo requiere
      }
    }

    // 2) Configurar validación de certificado del servidor
    const ignore = cfg.ignoreSsl || !cfg.strictSsl;
    agentOptions.rejectUnauthorized = !ignore;

    return new https.Agent(agentOptions);
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        // Merge con defaults
        return { ...DEFAULT_CONFIG, ...parsed, gallagher: { ...DEFAULT_CONFIG.gallagher, ...parsed.gallagher } };
      }
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
