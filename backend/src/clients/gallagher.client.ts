import fetch from 'node-fetch';
import { configService } from '../services/config.service';
import {
  GallagherAlarmResponse,
  GallagherEventResponse,
  AlarmRecord,
  EventRecord,
} from '../services/types';
import { logger } from '../utils/logger';

export class GallagherClient {
  private getConfig() {
    return configService.getConfig().gallagher;
  }

  private getHeaders(): Record<string, string> {
    const cfg = this.getConfig();
    return {
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private getBaseUrl(): string {
    const cfg = this.getConfig();
    return cfg.host.replace(/\/$/, '');
  }

  private async fetchJson<T>(url: string, init: fetch.RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const controller = new AbortController();
    const timeoutMs = this.getConfig().timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        ...init,
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
    // Usar defaultFields si no se especifica fields
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
