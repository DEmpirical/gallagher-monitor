export interface AlarmRecord {
  id: string;
  message: string;
  priority: number;
  state: 'active' | 'acknowledged' | 'cleared' | 'pending';
  source: { id: string; name: string; type?: string };
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
}

export interface EventRecord {
  id: string;
  time: string;
  message: string;
  source: { id: string; name: string; type?: string };
  eventType: { id: string; name: string };
  group?: { id: string; name: string };
  division?: { id: string; name: string };
  directDivision?: { id: string; name: string };
  cardholder?: { id: string; firstName?: string; lastName?: string };
  priority?: number;
  occurrences?: number;
  alarmState?: 'active' | 'acknowledged' | 'cleared';
  location?: Record<string, unknown>;
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
  after?: string;
  before?: string;
  top?: number;
  fields?: string;
}

export interface Config {
  host: string;
  port: number;
  strictSsl: boolean;
  ignoreSsl: boolean;
  timeout: number;
  pollInterval: number;
  defaultFields: string;
}
