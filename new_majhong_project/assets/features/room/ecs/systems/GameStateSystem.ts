// Game State System

import { System, World, SystemPhase } from '../types';
import { GameStateComponent } from '../components';
import { logger } from '../../../../shared/logger';

export class GameStateSystem implements System {
  getPhase(): SystemPhase {
    return SystemPhase.Simulation;
  }

  getOrder(): number {
    return 0;
  }

  update(world: World, deltaTime: number): void {
    const gameStateEntities = world.getEntitiesWithComponent('GameState');
    if (gameStateEntities.length === 0) {
      return;
    }

    const gameState = world.getComponent<GameStateComponent>(
      gameStateEntities[0].id,
      'GameState'
    );

    if (!gameState) {
      return;
    }

    // System logic here
  }
}

