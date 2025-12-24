// Matchmaking service

import { logger } from '../../shared/logger';

export class MatchmakingService {
  private isSearching: boolean = false;
  private searchStartTime: number = 0;

  async startSearch(): Promise<void> {
    if (this.isSearching) {
      return;
    }

    this.isSearching = true;
    this.searchStartTime = Date.now();
    logger.info('Matchmaking', 'Started searching for match');
  }

  async stopSearch(): Promise<void> {
    this.isSearching = false;
    logger.info('Matchmaking', 'Stopped searching');
  }

  async findMatch(): Promise<{ success: boolean; roomId?: string }> {
    if (!this.isSearching) {
      return { success: false };
    }

    // Mock matchmaking
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const roomId = `room_${Date.now()}`;
    this.isSearching = false;
    
    logger.info('Matchmaking', `Match found: ${roomId}`);
    return { success: true, roomId };
  }

  getQueueTime(): number {
    if (!this.isSearching) {
      return 0;
    }
    return Date.now() - this.searchStartTime;
  }

  isActive(): boolean {
    return this.isSearching;
  }
}

