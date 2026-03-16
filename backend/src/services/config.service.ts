import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface AppConfig {
  gallagher: {
    host: string;
    apiKey: string;
    strictSsl: boolean;
    timeout: number; // ms
    pollInterval: number; // ms
    defaultFields: string;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  gallagher: {
    host: '',
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
    // Usar un archivo de configuración en el workspace del backend
    this.configPath = process.env.CONFIG_PATH || path.resolve(process.cwd(), 'config.json');
    this.config = this.load();
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        // Merge with defaults to ensure completeness
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
    // Return a copy to avoid mutation outside
    return JSON.parse(JSON.stringify(this.config));
  }

  updateConfig(partial: Partial<AppConfig>): AppConfig {
    if (partial.gallagher) {
      this.config.gallagher = { ...this.config.gallagher, ...partial.gallagher };
    }
    this.save();
    logger.info('Configuration updated');
    return this.getConfig();
  }

  // Returns masked config (apiKey partially hidden)
  getMaskedConfig(): Omit<AppConfig, 'gallagher'> & { gallagher: Omit<AppConfig['gallagher'], 'apiKey'> & { apiKeyMasked: string } } {
    const cfg = this.getConfig();
    const mask = (s: string) => s.length > 8 ? `${'*'.repeat(s.length - 4)}${s.slice(-4)}` : '****';
    return {
      gallagher: {
        ...cfg.gallagher,
        apiKeyMasked: mask(cfg.gallagher.apiKey),
      },
    };
  }

  isConfigured(): boolean {
    return !!(this.config.gallagher.host && this.config.gallagher.apiKey);
  }

  clear(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
  }
}

export const configService = new ConfigService();
