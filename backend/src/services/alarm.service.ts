import { gallagherClient } from '../clients/gallagher.client';
import { AlarmRecord, LiveCursorState } from './types';
import { logger } from '../utils/logger';

export class AlarmService {
  private cursor: LiveCursorState = {};

  async fetchInitialAlarms(): Promise<AlarmRecord[]> {
    logger.info('Fetching initial alarms');
    const result = await gallagherClient.getAlarms();
    this.cursor.alarmsNextHref = result.nextHref;
    return result.alarms;
  }

  async pollAlarmUpdates(): Promise<AlarmRecord[]> {
    if (!this.cursor.alarmsNextHref) {
      // Fallback to full fetch if no updates cursor
      return this.fetchInitialAlarms();
    }
    try {
      logger.debug('Polling alarm updates');
      const result = await gallagherClient.getAlarmUpdates(this.cursor.alarmsNextHref);
      this.cursor.alarmsNextHref = result.nextHref;
      return result.alarms;
    } catch (error: any) {
      logger.error('Alarm update failed, resetting cursor', { error: error.message });
      this.cursor.alarmsNextHref = undefined;
      return this.fetchInitialAlarms();
    }
  }

  async acknowledge(alarmId: string): Promise<void> {
    await gallagherClient.acknowledgeAlarm(alarmId);
    logger.info(`Alarm ${alarmId} acknowledged`);
  }

  async clear(alarmId: string): Promise<void> {
    await gallagherClient.clearAlarm(alarmId);
    logger.info(`Alarm ${alarmId} cleared`);
  }

  getCursor(): LiveCursorState {
    return { ...this.cursor };
  }

  resetCursor(): void {
    this.cursor = {};
  }
}

export const alarmService = new AlarmService();
