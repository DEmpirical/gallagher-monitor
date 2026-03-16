import { gallagherClient } from '../clients/gallagher.client';
import { EventRecord, FilterState, LiveCursorState } from './types';
import { logger } from '../utils/logger';

export class EventService {
  private cursor: LiveCursorState = {};
  private currentFilters: FilterState = {};

  setFilters(filters: FilterState) {
    this.currentFilters = { ...filters };
    // Reset cursor when filters change
    this.cursor.eventsNextHref = undefined;
  }

  async fetchInitialEvents(): Promise<EventRecord[]> {
    const params = this.buildQueryParams(this.currentFilters);
    logger.info('Fetching initial events', { params });
    const result = await gallagherClient.getEvents(params);
    this.cursor.eventsNextHref = result.nextHref;
    return result.events;
  }

  async pollEventUpdates(): Promise<EventRecord[]> {
    if (!this.cursor.eventsNextHref) {
      // No updates cursor, restart from current filters
      return this.fetchInitialEvents();
    }
    try {
      logger.debug('Polling event updates');
      const result = await gallagherClient.getEventUpdates(this.cursor.eventsNextHref);
      this.cursor.eventsNextHref = result.nextHref;
      return result.events;
    } catch (error: any) {
      logger.error('Event update failed, resetting cursor', { error: error.message });
      this.cursor.eventsNextHref = undefined;
      return this.fetchInitialEvents();
    }
  }

  private buildQueryParams(filters: FilterState): Record<string, any> {
    const params: Record<string, any> = {};

    // Gallagher supported filters from documentation
    if (filters.group) params.group = filters.group;
    if (filters.type) params.type = filters.type;
    if (filters.cardholder) params.cardholder = filters.cardholder;
    if (filters.division) params.division = filters.division;
    if (filters.directDivision) params.directDivision = filters.directDivision;
    if (filters.relatedItem) params.relatedItem = filters.relatedItem;
    if (filters.source) params.source = filters.source;
    if (filters.after) params.after = filters.after;
    if (filters.before) params.before = filters.before;
    if (filters.top) params.top = String(filters.top);

    // fields: optimize payload. Include location if available
    let fields = filters.fields ? filters.fields.split(',') : [
      'defaults',
      'source',
      'eventType',
      'division',
      'cardholder',
      'priority',
      'occurrences',
    ];
    // Suggest location if available (server 9.00+)
    if (!fields.includes('location')) {
      fields.push('location');
    }
    params.fields = fields.join(',');

    return params;
  }

  getCurrentFilters(): FilterState {
    return { ...this.currentFilters };
  }
}

export const eventService = new EventService();
