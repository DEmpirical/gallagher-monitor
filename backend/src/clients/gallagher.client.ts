import fetch from 'node-fetch';
import https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { configService } from '../services/config.service';
import {
  GallagherAlarmResponse,
  GallagherEventResponse,
  AlarmRecord,
  EventRecord,
} from '../services/types';
import { logger } from '../utils/logger';

export class GallagherClient {
  // Soporte para inyectar config (para tests) o usar configService por defecto
  private getConfigFn: () => { gallagher: any };
  private staticConfig: { gallagher: any } | null = null;

  constructor(configOrGetConfig?: (() => { gallagher: any }) | { gallagher: any }) {
    if (typeof configOrGetConfig === 'function') {
      this.getConfigFn = configOrGetConfig;
    } else if (configOrGetConfig) {
      this.staticConfig = configOrGetConfig;
    } else {
      // Default: usar configService
      this.getConfigFn = () => configService.getConfig();
    }
  }

  private getConfig() {
    if (this.staticConfig) {
      return this.staticConfig.gallagher;
    }
    return this.getConfigFn!().gallagher;
  }

  private getBaseUrl(): string {
    const cfg = this.getConfig();
    // host puede incluir o no protocolo; si no lo incluye, agregar https://
    let host = cfg.host;
    if (!host.includes('://')) {
      host = `https://${host}`;
    }
    // Asegurar que no termine con /
    const cleaned = host.replace(/\/$/, '');
    // Agregar puerto si no está ya en la URL
    const url = new URL(cleaned);
    if (!url.port) {
      url.port = String(cfg.port);
    }
    return url.toString();
  }

<<<<<<< HEAD
  private getHeaders(): Record<string, string> {
    const cfg = this.getConfig();
    return {
      'Authorization': `GGL-API-KEY ${cfg.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async fetchJson<T>(url: string, init: any = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const controller = new AbortController();
    const timeoutMs = this.getConfig().timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const agent = this.buildHttpsAgent();

      const response = await fetch(fullUrl, {
        ...init,
        agent,
        headers: {
          ...this.getHeaders(),
          ...(init.headers || {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gallagher API error ${response.status}: ${response.statusText} - ${text}`);
      }

      if (response.status === 204) return null as unknown as T;
      const data = await response.json();
      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

=======
>>>>>>> origin/main
  private buildHttpsAgent(): https.Agent | undefined {
    // BIZARROCORP: usando .pfx en lugar de win-ca store
    const cfg = this.getConfig();
    const baseUrl = this.getBaseUrl();
    if (!baseUrl.startsWith('https://')) {
      logger.debug('buildHttpsAgent: not HTTPS, returning undefined');
      return undefined;
    }

    const agentOptions: https.AgentOptions = {};
    logger.debug('Building HTTPS agent', { 
      host: baseUrl, 
      ignoreSsl: cfg.ignoreSsl, 
      strictSsl: cfg.strictSsl,
      clientCertThumbprint: cfg.clientCertThumbprint,
      platform: process.platform
    });

    // 1) Certificado cliente desde .pfx (Windows)
    if (cfg.clientCertThumbprint && process.platform === 'win32') {
      try {
<<<<<<< HEAD
        const winCa = require('win-ca');
        // win-ca API: findSync({ thumbprint }) o find({ thumbprint })
        const certs = winCa.findSync ? winCa.findSync({ thumbprint: cfg.clientCertThumbprint }) : winCa.find({ thumbprint: cfg.clientCertThumbprint });
        logger.info('Certificates found in Windows Store', { 
          requestedThumbprint: cfg.clientCertThumbprint,
          foundCount: certs.length,
          foundThumbprints: certs.map((c: any) => c.thumbprint)
        });
        if (certs.length === 0) {
          throw new Error(`Certificado no encontrado en store: ${cfg.clientCertThumbprint}`);
=======
        // Buscar .pfx en ubicaciones conocidas
        const possiblePaths = [
          path.resolve(process.cwd(), 'certs', 'client.pfx'),
          path.resolve(process.cwd(), 'cert2', 'client.pfx'),
          process.env.GALLAGHER_CLIENT_PFX_PATH,
        ].filter(Boolean);
        let pfxPath: string | null = null;
        for (const p of possiblePaths) {
          if (p && fs.existsSync(p)) {
            pfxPath = p;
            break;
          }
>>>>>>> origin/main
        }
        if (!pfxPath) {
          logger.warn('clientCertThumbprint configurado pero no se encontró archivo .pfx en certs/ o cert2/. Se omitirá el certificado cliente.');
        } else {
          const passphrase = process.env.GALLAGHER_CLIENT_PFX_PASS || '123456';
          const pfxData = fs.readFileSync(pfxPath);
          agentOptions.pfx = pfxData;
          agentOptions.passphrase = passphrase;
          logger.info('Certificado cliente cargado desde PFX', { path: pfxPath, thumbprint: cfg.clientCertThumbprint });
        }
      } catch (error: any) {
        logger.error('Error cargando certificado cliente desde PFX', { error: error.message, stack: error.stack });
        // Continuar sin certificado
      }
    } else if (cfg.clientCertThumbprint) {
      logger.warn('clientCertThumbprint configurado pero no estamos en Windows (platform=' + process.platform + ')');
    }

    // 2) Configurar validación de certificado del servidor
    const ignore = cfg.ignoreSsl || !cfg.strictSsl;
    agentOptions.rejectUnauthorized = !ignore;
logger.debug('Final agent options', { 
      hasPfx: !!agentOptions.pfx,
      hasPassphrase: !!agentOptions.passphrase,
      rejectUnauthorized: agentOptions.rejectUnauthorized,
    });

    return new https.Agent(agentOptions);
  }

<<<<<<< HEAD
  private normalizeAlarm(raw: any): AlarmRecord {
    return {
      id: raw.id,
      message: raw.message || '',
      priority: raw.priority ?? 0,
      state: this.mapAlarmState(raw.state),
      source: {
        id: raw.source?.id || '',
        name: raw.source?.name || '',
        type: raw.source?.type,
      },
      eventType: {
        id: raw.eventType?.id || '',
        name: raw.eventType?.name || '',
      },
      division: raw.division ? { id: raw.division.id, name: raw.division.name } : undefined,
      cardholder: raw.cardholder ? {
        id: raw.cardholder.id,
        firstName: raw.cardholder.firstName,
        lastName: raw.cardholder.lastName,
      } : undefined,
      details: raw.details,
      acknowledgedBy: raw.acknowledgedBy,
      acknowledgedTime: raw.acknowledgedTime,
      clearedBy: raw.clearedBy,
      clearedTime: raw.clearedTime,
      createdTime: raw.createdTime,
      updatedTime: raw.updatedTime,
      raw,
    };
  }

  private mapAlarmState(state: string): AlarmRecord['state'] {
    switch (state?.toLowerCase()) {
      case 'active': return 'active';
      case 'acknowledged': return 'acknowledged';
      case 'cleared': return 'cleared';
      default: return 'pending';
    }
  }

  private normalizeEvent(raw: any): EventRecord {
    return {
      id: raw.id,
      time: raw.time,
      message: raw.message || '',
      source: {
        id: raw.source?.id || '',
        name: raw.source?.name || '',
        type: raw.source?.type,
      },
      eventType: {
        id: raw.eventType?.id || '',
        name: raw.eventType?.name || '',
      },
      group: raw.group ? { id: raw.group.id, name: raw.group.name } : undefined,
      division: raw.division ? { id: raw.division.id, name: raw.division.name } : undefined,
      directDivision: raw.directDivision ? { id: raw.directDivision.id, name: raw.directDivision.name } : undefined,
      cardholder: raw.cardholder ? {
        id: raw.cardholder.id,
        firstName: raw.cardholder.firstName,
        lastName: raw.cardholder.lastName,
      } : undefined,
      priority: raw.priority,
      occurrences: raw.occurrences,
      alarmState: raw.alarmState as EventRecord['alarmState'],
      location: raw.location,
      raw,
    };
  }

  async getCardHolders(params?: { search?: string; limit?: number; offset?: number }): Promise<{ cardholders: any[]; nextHref?: string }> {
    const qs = new URLSearchParams();
    if (params) {
      if (params.search) qs.append('search', params.search);
      if (params.limit) qs.append('limit', String(params.limit));
      if (params.offset) qs.append('offset', String(params.offset));
    }
    const query = qs.toString() ? `?${qs}` : '';
    const data = await this.fetchJson<any>(`/api/cardholders${query}`);
    return { cardholders: data?.cardholders || [], nextHref: data?._links?.next?.href };
  }

  async getAlarms(): Promise<{ alarms: AlarmRecord[]; nextHref?: string }> {
    const data = await this.fetchJson<GallagherAlarmResponse>('/api/alarms');
    const normalized = (data?.alarms || []).map(a => this.normalizeAlarm(a));
    return { alarms: normalized, nextHref: data?._links?.next?.href };
  }

  async getAlarmUpdates(url: string): Promise<{ alarms: AlarmRecord[]; nextHref?: string }> {
    const data = await this.fetchJson<GallagherAlarmResponse>(url);
    const normalized = (data?.alarms || []).map(a => this.normalizeAlarm(a));
    return { alarms: normalized, nextHref: data?._links?.next?.href };
  }

  async acknowledgeAlarm(alarmId: string): Promise<void> {
    await this.fetchJson(`/api/alarms/${alarmId}/acknowledge`, { method: 'POST' });
  }

  async clearAlarm(alarmId: string): Promise<void> {
    await this.fetchJson(`/api/alarms/${alarmId}/clear`, { method: 'POST' });
  }

  async getEvents(params: Record<string, any> = {}): Promise<{ events: EventRecord[]; nextHref?: string }> {
=======
  private async fetchJson(url: string, method: string = 'GET', body?: any): Promise<any> {
>>>>>>> origin/main
    const cfg = this.getConfig();
    const baseUrl = this.getBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const agent = this.buildHttpsAgent();

    const options: https.RequestOptions = {
      method,
      agent,
      headers: this.getHeaders(),
      // timeout? cfg.timeout
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(fullUrl, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gallagher API error ${response.status}: ${response.statusText} - ${text}`);
    }
    return response.json();
  }

  private getHeaders(): Record<string, string> {
    const cfg = this.getConfig();
    return {
      'Authorization': `GGL-API-KEY ${cfg.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async getApiRoot() {
    return this.fetchJson('/api');
  }

  async getEvents(params?: { limit?: number; after?: string; before?: string; fields?: string }): Promise<GallagherEventResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.after) query.append('after', params.after);
    if (params?.before) query.append('before', params.before);
    if (params?.fields) query.append('fields', params.fields);
    const queryString = query.toString();
    const url = queryString ? `/api/events?${queryString}` : '/api/events';
    return this.fetchJson(url) as Promise<GallagherEventResponse>;
  }

  async getAlarms(params?: { limit?: number; after?: string; before?: string }): Promise<GallagherAlarmResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.after) query.append('after', params.after);
    if (params?.before) query.append('before', params.before);
    const queryString = query.toString();
    const url = queryString ? `/api/alarms?${queryString}` : '/api/alarms';
    return this.fetchJson(url) as Promise<GallagherAlarmResponse>;
  }

  async acknowledgeAlarm(alarmId: string) {
    return this.fetchJson(`/api/alarms/${alarmId}/acknowledge`, 'POST');
  }

  async clearAlarm(alarmId: string) {
    return this.fetchJson(`/api/alarms/${alarmId}/clear`, 'POST');
  }

  async getUpdates(params?: { timeout?: number }) {
    // Long-poll updates endpoint
    return this.fetchJson('/api/events/updates', 'GET');
  }
}