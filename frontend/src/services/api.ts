import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set internal token after reading from env
const INTERNAL_TOKEN = import.meta.env.VITE_INTERNAL_TOKEN;
if (INTERNAL_TOKEN) {
  api.defaults.headers.common['X-Internal-Token'] = INTERNAL_TOKEN;
}

export interface AlarmsResponse {
  alarms: any[]; // TODO: replace with AlarmRecord
  cursor?: any;
}

export interface EventsResponse {
  events: any[];
  filters?: any;
}

export const alarmsApi = {
  fetchInitial: () => api.get<AlarmsResponse>('/alarms'),
  fetchUpdates: () => api.get<AlarmsResponse>('/alarms/updates'),
  acknowledge: (id: string) => api.post(`/alarms/${id}/acknowledge`),
  clear: (id: string) => api.post(`/alarms/${id}/clear`),
};

export const eventsApi = {
  fetchInitial: (params?: Record<string, any>) => api.get<EventsResponse>('/events', { params }),
  fetchUpdates: () => api.get<EventsResponse>('/events/updates'),
};

export const healthApi = {
  backend: () => api.get('/health'),
  gallagher: () => api.get('/health/gallagher'),
};
