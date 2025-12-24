// Replay Runner - minimal implementation for game replay

import { ReplayData, ReplayConfig, ReplayState, ReplayMetadata } from '../../../shared/types/ReplayTypes';
import { logger } from '../../../shared/logger';

export class ReplayRunner {
  private data: ReplayData | null = null;
  private config: ReplayConfig;
  private state: ReplayState = ReplayState.Stopped;
  private currentEventIndex: number = 0;
  private playbackTimer: number | null = null;
  private startTime: number = 0;

  constructor(config: Partial<ReplayConfig> = {}) {
    this.config = {
      speed: config.speed || 1.0,
      autoPlay: config.autoPlay ?? true,
      loop: config.loop ?? false
    };
  }

  load(data: ReplayData): void {
    // Validate metadata
    if (!this.validateMetadata(data.metadata)) {
      logger.warn('ReplayRunner', 'Replay metadata validation failed', data.metadata);
    }

    this.data = data;
    this.currentEventIndex = 0;
    this.state = ReplayState.Stopped;
    logger.info('ReplayRunner', 'Replay data loaded', { 
      roomId: data.roomId, 
      eventCount: data.events.length,
      schemaVersion: data.metadata.schemaVersion,
      gameVersion: data.metadata.gameVersion
    });
  }

  private validateMetadata(metadata: ReplayMetadata): boolean {
    return !!(
      metadata.schemaVersion &&
      metadata.gameVersion &&
      metadata.buildHash &&
      metadata.createdAt
    );
  }

  play(): void {
    if (!this.data) {
      logger.warn('ReplayRunner', 'No replay data loaded');
      return;
    }

    if (this.state === ReplayState.Playing) {
      return;
    }

    this.state = ReplayState.Playing;
    this.startTime = Date.now();
    this.processNextEvent();
    logger.info('ReplayRunner', 'Replay started');
  }

  pause(): void {
    if (this.state === ReplayState.Playing) {
      this.state = ReplayState.Paused;
      this.stopTimer();
      logger.info('ReplayRunner', 'Replay paused');
    }
  }

  stop(): void {
    this.state = ReplayState.Stopped;
    this.currentEventIndex = 0;
    this.stopTimer();
    logger.info('ReplayRunner', 'Replay stopped');
  }

  private processNextEvent(): void {
    if (!this.data || this.state !== ReplayState.Playing) {
      return;
    }

    if (this.currentEventIndex >= this.data.events.length) {
      if (this.config.loop) {
        this.currentEventIndex = 0;
      } else {
        this.state = ReplayState.Finished;
        logger.info('ReplayRunner', 'Replay finished');
        return;
      }
    }

    const event = this.data.events[this.currentEventIndex];
    const elapsed = Date.now() - this.startTime;
    const targetTime = event.timestamp / this.config.speed;

    if (elapsed >= targetTime) {
      // Process event
      this.onEvent(event.event);
      this.currentEventIndex++;

      if (this.currentEventIndex < this.data.events.length) {
        this.processNextEvent();
      } else {
        this.state = ReplayState.Finished;
      }
    } else {
      // Schedule next check
      const delay = targetTime - elapsed;
      this.playbackTimer = setTimeout(() => {
        this.processNextEvent();
      }, delay) as unknown as number;
    }
  }

  private onEvent(event: any): void {
    // Event handler - to be implemented by consumer
    logger.debug('ReplayRunner', 'Processing event', event);
  }

  private stopTimer(): void {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  getState(): ReplayState {
    return this.state;
  }

  getProgress(): number {
    if (!this.data || this.data.events.length === 0) {
      return 0;
    }
    return this.currentEventIndex / this.data.events.length;
  }

  getMetadata(): ReplayMetadata | null {
    return this.data?.metadata || null;
  }
}
