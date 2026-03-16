import fetch from 'node-fetch';
import https from 'https';
import { configService } from '../services/config.service';
import {
  GallagherAlarmResponse,
  GallagherEventResponse,
  AlarmRecord,
  EventRecord,
} from '../services/types';
import { logger } from '../utils/logger';

export class GallagherClient {
  private getConfigFn: () => { gallagher: any };
  private staticConfig: { gallagher: any } | null = null;

  constructor(configOrGetConfig?: (() => { gallagher: any }) | { gallagher: any }) {
    if (typeof configOrGetConfig === 'function') {
      this.getConfigFn = configOrGetConfig;
    } else if (configOrGetConfig) {
      this.staticConfig = configOrGetConfig;
    } else {
      // Default: use configService
      this.getConfigFn = () => configService.getConfig();
    }
  }

  private getConfig() {
    if (this.staticConfig) {
      return this.staticConfig.gallagher;
    }
    return this.getConfigFn().gallagher;
  }

  private getBaseUrl(): string {
    const cfg = this.getConfig();
    // host ya incluye https:// o http://
    if (!cfg.host.includes('://')) {
      throw new Error('Host must include protocol (https:// or http://)');
    }
    // Asegurar que no termine con /
    const cleaned = cfg.host.replace(/\/$/, '');
    // Agregar puerto si no está ya en la URL
    const url = new URL(cleaned);
    if (!url.port) {
      url.port = String(cfg.port);
    }
    return url.toString();
  }

  private getHeaders(): Record<string, string> {
    const cfg = this.getConfig();
    return {
      'Authorization': `GGL-API-KEY ${cfg.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async fetchJson<T>(url: string, init: fetch.RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const controller = new AbortController();
    const timeoutMs = this.getConfig().timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Obtener https.Agent si es necesario
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

      if (response.status === 204) return null as any;
      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildHttpsAgent(): https.Agent | undefined {
    const cfg = this.getConfig();
    const baseUrl = this.getBaseUrl();
    if (!baseUrl.startsWith('https://')) {
      return undefined; // HTTP no necesita agent especial
    }

    const agentOptions: https.RequestOptions = {};
    logger.debug('Building HTTPS agent', { 
      host: baseUrl, 
      ignoreSsl: cfg.ignoreSsl, 
      strictSsl: cfg.strictSsl,
      clientCertThumbprint: cfg.clientCertThumbprint,
      platform: process.platform
    });

    // 1) Certificado cliente desde store de Windows (solo win32)
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
        logger.debug('Client certificate loaded', { subject: cert.subject });
      } catch (error: any) {
        logger.error('Error cargando certificado desde Windows store', { error: error.message });
        // Si falla, continuamos sin certificado (puede que no sea requerido)
      }
    }

    // 2) Configurar validación de certificado del servidor
    const ignore = cfg.ignoreSsl || !cfg.strictSsl;
    agentOptions.rejectUnauthorized = !ignore;
    logger.debug('Agent options', { 
      rejectUnauthorized: agentOptions.rejectUnauthorized, 
      ignore: ignore,
      strictSsl: cfg.strictSsl,
      ignoreSsl: cfg.ignoreSsl
    });

    return new https.Agent(agentOptions);
  }

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
    const cfg = this.getConfig();
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, String(v));
      }
    });
    if (!params.fields) {
      qs.append('fields', cfg.defaultFields);
    }
    const query = qs.toString() ? `?${qs}` : '';
    const data = await this.fetchJson<GallagherEventResponse>(`/api/events${query}`);
    const normalized = (data?.events || []).map(e => this.normalizeEvent(e));
    return { events: normalized, nextHref: data?._links?.next?.href };
  }

  async getEventUpdates(url: string): Promise<{ events: EventRecord[]; nextHref?: string }> {
    const data = await this.fetchJson<GallagherEventResponse>(url);
    const normalized = (data?.events || []).map(e => this.normalizeEvent(e));
    return { events: normalized, nextHref: data?._links?.next?.href };
  }

  async getApiRoot(): Promise<{ _links: Record<string, { href: string }> }> {
    return this.fetchJson('/api');
  }
}

export const gallagherClient = new GallagherClient();
