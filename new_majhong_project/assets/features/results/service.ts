// Results service

import { logger } from '../../shared/logger';
import { GameResult, PlayerResult } from './types';

export class ResultsService {
  private currentResult: GameResult | null = null;

  setResult(result: GameResult): void {
    this.currentResult = result;
    logger.info('Results', 'Game result set', result);
  }

  getResult(): GameResult | null {
    return this.currentResult;
  }

  clear(): void {
    this.currentResult = null;
  }
}

