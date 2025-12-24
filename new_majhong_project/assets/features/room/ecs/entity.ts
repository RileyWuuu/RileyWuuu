// ECS Entity factory and utilities

import { Entity, EntityId } from './types';
import { World } from './world';

export class EntityFactory {
  static createPlayerEntity(world: World, playerId: string, name: string, tiles: string[], score: number): EntityId {
    const entityId = world.createEntity();
    world.addComponent(entityId, 'Player', {
      playerId,
      name,
      tiles,
      score
    });
    return entityId;
  }

  static createTileEntity(world: World, tileId: string, suit: string, value: number, ownerId: string | null): EntityId {
    const entityId = world.createEntity();
    world.addComponent(entityId, 'Tile', {
      tileId,
      suit,
      value,
      ownerId
    });
    return entityId;
  }

  static createGameStateEntity(world: World, roomId: string, currentPlayerIndex: number, phase: string): EntityId {
    const entityId = world.createEntity();
    world.addComponent(entityId, 'GameState', {
      roomId,
      currentPlayerIndex,
      phase
    });
    return entityId;
  }
}

