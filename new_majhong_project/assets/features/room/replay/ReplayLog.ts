// Replay Log - in-memory event log for replay

import { ReplayData, ReplayEvent } from '../../../shared/types/ReplayTypes';
import { EventPayload } from '../../../shared/network/Messages';
import { logger } from '../../../shared/logger';

export class ReplayLog {
  private roomId: string;
  private startTime: number;
  private events: ReplayEvent[] = [];
  private initialState: any = null;

  constructor(roomId: string, initialState?: any) {
    this.roomId = roomId;
    this.startTime = Date.now();
    this.initialState = initialState;

    logger.info('ReplayLog', `Replay log created for room: ${roomId}`);
  }

  addEvent(event: EventPayload): void {
    const replayEvent: ReplayEvent = {
      timestamp: Date.now() - this.startTime,
      event
    };

    this.events.push(replayEvent);
    logger.debug('ReplayLog', `Event added: ${event.type}`, { totalEvents: this.events.length });
  }

  addSnapshot(snapshot: any): void {
    // Store snapshot as initial state or checkpoint
    this.initialState = snapshot;
    logger.debug('ReplayLog', 'Snapshot added to replay log');
  }

  getReplayData(): ReplayData {
    return {
      schemaVersion: '1.0.0',
      gameVersion: '1.0.0',
      buildHash: 'dev-build',
      createdAt: this.startTime,
      roomId: this.roomId,
      initialState: this.initialState,
      events: [...this.events]
    };
  }

  getRecentEvents(count: number = 10): ReplayEvent[] {
    return this.events.slice(-count);
  }

  getAllEvents(): ReplayEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
    this.initialState = null;
    logger.info('ReplayLog', 'Replay log cleared');
  }
}

