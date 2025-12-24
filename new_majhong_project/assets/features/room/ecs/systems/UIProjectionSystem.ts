// UI Projection System - projects game state to UI

import { System, World, SystemPhase } from '../types';
import { logger } from '../../../../shared/logger';

export class UIProjectionSystem implements System {
  getPhase(): SystemPhase {
    return SystemPhase.UIProjection;
  }

  getOrder(): number {
    return 0;
  }

  update(world: World, deltaTime: number): void {
    // UI state projection
    // This is where game state is projected to UI-ready format
  }
}

