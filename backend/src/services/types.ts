// Internal normalized types

export interface AlarmRecord {
  id: string;
  message: string;
  priority: number;
  state: 'active' | 'acknowledged' | 'cleared' | 'pending';
  source: {
    id: string;
    name: string;
    type?: string;
  };
  eventType: {
    id: string;
    name: string;
  };
  division?: {
    id: string;
    name: string;
  };
  cardholder?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  details?: string;
  acknowledgedBy?: string;
  acknowledgedTime?: string;
  clearedBy?: string;
  clearedTime?: string;
  createdTime: string;
  updatedTime: string;
  raw: Record<string, unknown>; // Original response for debug
}

export interface EventRecord {
  id: string;
  time: string;
  message: string;
  source: {
    id: string;
    name: string;
    type?: string;
  };
  eventType: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    name: string;
  };
  division?: {
    id: string;
    name: string;
  };
  directDivision?: {
    id: string;
    name: string;
  };
  cardholder?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  priority?: number;
  occurrences?: number;
  alarmState?: 'active' | 'acknowledged' | 'cleared';
  location?: {
    // Will vary based on server capabilities
    [key: string]: unknown;
  };
  raw: Record<string, unknown>;
}

export interface FilterState {
  searchText?: string;
  priority?: number | 'high' | 'medium' | 'low';
  state?: AlarmRecord['state'];
  division?: string;
  source?: string;
  eventType?: string;
  group?: string;
  directDivision?: string;
  relatedItem?: string;
  cardholder?: string;
  after?: string; // ISO datetime
  before?: string;
  top?: number;
  fields?: string; // comma-separated Gallagher fields
}

export interface LiveCursorState {
  eventsNextHref?: string;
  alarmsNextHref?: string;
  lastEventId?: string;
  lastAlarmId?: string;
}

// Gallagher raw types (partial)
export interface GallagherAlarmResponse {
  alarms: Array<{
    id: string;
    message: string;
    priority: number;
    state: string;
    source: { id: string; name: string };
    eventType: { id: string; name: string };
    division?: { id: string; name: string };
    cardholder?: { id: string; firstName?: string; lastName?: string };
    details?: string;
    acknowledgedBy?: string;
    acknowledgedTime?: string;
    clearedBy?: string;
    clearedTime?: string;
    createdTime: string;
    updatedTime: string;
    _links?: { next?: { href: string } };
  }>;
  _links?: { next?: { href: string } };
}

export interface GallagherEventResponse {
  events: Array<{
    id: string;
    time: string;
    message: string;
    source: { id: string; name: string };
    eventType: { id: string; name: string };
    group?: { id: string; name: string };
    division?: { id: string; name: string };
    directDivision?: { id: string; name: string };
    cardholder?: { id: string; firstName?: string; lastName?: string };
    priority?: number;
    occurrences?: number;
    alarmState?: string;
    location?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  _links?: { next?: { href: string } };
}
