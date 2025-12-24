// Server Event System - applies server events to world

import { System, World, SystemPhase } from '../types';
import { TableComponent, TurnComponent } from '../components';
import { logger } from '../../../../shared/logger';

export class ServerEventSystem implements System {
  getPhase(): SystemPhase {
    return SystemPhase.ServerEvents;
  }

  getOrder(): number {
    return 0;
  }

  update(world: World, deltaTime: number): void {
    // This system processes server events that were added via world.addServerEvent()
    // Events are processed in World.applyServerEvents()
    // This is a placeholder for event processing logic
  }

  processTilePlayedEvent(world: World, playerId: string, tileId: string): void {
    logger.info('ServerEventSystem', `Processing TILE_PLAYED: player=${playerId}, tile=${tileId}`);
    
    // Find or create table entity
    let tableEntity = world.getEntitiesWithComponent('Table')[0];
    if (!tableEntity) {
      const tableId = world.createEntity();
      world.addComponent(tableId, 'Table', {
        tiles: []
      });
      tableEntity = world.getEntity(tableId)!;
    }

    const table = world.getComponent<TableComponent>(tableEntity.id, 'Table');
    if (table) {
      table.tiles.push({
        tileId,
        playerId,
        timestamp: Date.now()
      });
      logger.debug('ServerEventSystem', `Added tile to table: ${tileId}`);
    }
  }

  processTurnChangedEvent(world: World, playerIndex: number, players: any[]): void {
    logger.info('ServerEventSystem', `Processing TURN_CHANGED: playerIndex=${playerIndex}`);
    
    if (!players || players.length === 0) {
      // Try to get players from world
      const playerEntities = world.getEntitiesWithComponent('Player');
      if (playerEntities.length === 0) {
        logger.warn('ServerEventSystem', 'No players found in world');
        return;
      }
      // Extract player IDs from entities
      players = playerEntities.map(e => {
        const player = world.getComponent<any>(e.id, 'Player');
        return { id: player?.playerId || e.id };
      });
    }
    
    if (playerIndex < 0 || playerIndex >= players.length) {
      logger.warn('ServerEventSystem', `Invalid player index: ${playerIndex}, total players: ${players.length}`);
      return;
    }

    const newPlayerId = players[playerIndex]?.id;
    if (!newPlayerId) {
      logger.warn('ServerEventSystem', `Player not found at index: ${playerIndex}`);
      return;
    }

    // Find or create turn entity
    let turnEntity = world.getEntitiesWithComponent('Turn')[0];
    if (!turnEntity) {
      const turnId = world.createEntity();
      world.addComponent(turnId, 'Turn', {
        currentPlayerId: newPlayerId,
        turnNumber: 0,
        lastActionTime: Date.now()
      });
      turnEntity = world.getEntity(turnId)!;
    }

    const turn = world.getComponent<TurnComponent>(turnEntity.id, 'Turn');
    if (turn) {
      turn.currentPlayerId = newPlayerId;
      turn.turnNumber++;
      turn.lastActionTime = Date.now();
      logger.debug('ServerEventSystem', `Turn changed to player: ${newPlayerId}`);
    }
  }
}

