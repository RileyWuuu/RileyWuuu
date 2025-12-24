// Room service

import { World, EntityFactory } from './ecs';
import { GameStateSystem, PlayerSystem, TileSystem, ServerEventSystem, SimulationSystem, AnimationSystem, UIProjectionSystem } from './ecs/systems';
import { GameStateComponent, PlayerComponent, TileComponent, TableComponent, TurnComponent } from './ecs/components';
import { RoomState, RoomEvent, RoomSnapshot } from './types';
import { PlayTileIntentPayload } from '../../shared/network/Messages';
import { NetworkClient, SnapshotApplyStrategy } from '../../shared/network/NetworkClient';
import { logger } from '../../shared/logger';

export class RoomService implements SnapshotApplyStrategy {
  private world: World;
  private networkClient: NetworkClient | null = null;
  private state: RoomState;
  private eventHandlers: Map<string, Array<(event: RoomEvent) => void>> = new Map();
  private serverEventSystem: ServerEventSystem;

  constructor() {
    this.world = new World();
    this.setupSystems();
    this.state = this.createMockState();
    this.initializeWorld();
  }

  private setupSystems(): void {
    this.serverEventSystem = new ServerEventSystem();
    this.world.addSystem(this.serverEventSystem);
    this.world.addSystem(new SimulationSystem());
    this.world.addSystem(new AnimationSystem());
    this.world.addSystem(new UIProjectionSystem());
    this.world.addSystem(new GameStateSystem());
    this.world.addSystem(new PlayerSystem());
    this.world.addSystem(new TileSystem());
  }

  private createMockState(): RoomState {
    return {
      roomId: 'mock_room_001',
      players: [
        { id: 'player_1', name: 'Player 1', tiles: ['tile_1', 'tile_2'], score: 0 },
        { id: 'player_2', name: 'Player 2', tiles: ['tile_3', 'tile_4'], score: 0 },
        { id: 'player_3', name: 'Player 3', tiles: ['tile_5', 'tile_6'], score: 0 },
        { id: 'player_4', name: 'Player 4', tiles: ['tile_7', 'tile_8'], score: 0 }
      ],
      currentPlayerIndex: 0,
      tiles: [],
      gamePhase: 'playing'
    };
  }

  private initializeWorld(): void {
    // Create game state entity
    EntityFactory.createGameStateEntity(
      this.world,
      this.state.roomId,
      this.state.currentPlayerIndex,
      this.state.gamePhase
    );

    // Create player entities
    this.state.players.forEach(player => {
      EntityFactory.createPlayerEntity(
        this.world,
        player.id,
        player.name,
        player.tiles,
        player.score
      );
    });

    // Create table entity
    const tableId = this.world.createEntity();
    this.world.addComponent(tableId, 'Table', {
      tiles: []
    });

    // Create turn entity
    const turnId = this.world.createEntity();
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    this.world.addComponent(turnId, 'Turn', {
      currentPlayerId: currentPlayer.id,
      turnNumber: 0,
      lastActionTime: Date.now()
    });
  }

  connect(networkClient: NetworkClient): void {
    this.networkClient = networkClient;
    
    // Set snapshot strategy
    networkClient.setSnapshotStrategy(this);
    
    // Subscribe to events
    networkClient.onEvent('TILE_PLAYED', (payload) => {
      this.handleEventInternal({ type: 'TILE_PLAYED', payload });
    });

    networkClient.onEvent('TURN_CHANGED', (payload) => {
      this.handleEventInternal({ type: 'TURN_CHANGED', payload });
    });

    logger.info('Room', 'Connected to network client');
  }

  handleEvent(event: RoomEvent): void {
    this.handleEventInternal(event);
  }

  sendIntent(intent: PlayTileIntentPayload): void {
    if (!this.networkClient) {
      logger.warn('Room', 'Cannot send intent: network client not connected');
      return;
    }
    this.networkClient.sendIntent(intent);
    logger.info('Room', `Sent intent: ${intent.type}`, intent.payload);
  }

  // SnapshotApplyStrategy implementation
  apply(snapshot: any): void {
    this.applySnapshot(snapshot as RoomSnapshot);
  }

  onEvent(eventType: string, handler: (event: RoomEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private handleEventInternal(event: RoomEvent): void {
    logger.info('Room', `Received event: ${event.type}`, event.payload);
    
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Add event to world for processing in ServerEvents phase
    this.world.addServerEvent(event);

    // Events are processed in World.applyServerEvents() during the update loop
    // But we also update state immediately for UI responsiveness
    switch (event.type) {
      case 'TURN_CHANGED':
        if (event.payload?.playerIndex !== undefined) {
          this.state.currentPlayerIndex = event.payload.playerIndex;
          
          // Update game state component
          const gameStateEntities = this.world.getEntitiesWithComponent('GameState');
          if (gameStateEntities.length > 0) {
            const gameState = this.world.getComponent<GameStateComponent>(
              gameStateEntities[0].id,
              'GameState'
            );
            if (gameState) {
              gameState.currentPlayerIndex = event.payload.playerIndex;
            }
          }
        }
        break;
    }
  }

  private applySnapshot(snapshot: RoomSnapshot): void {
    logger.info('Room', `Applying snapshot seq: ${snapshot.seq}`);
    this.state = snapshot.state;
    this.world.clear();
    this.initializeWorld();
  }

  getState(): RoomState {
    return { ...this.state };
  }

  getCurrentTurnPlayerId(): string | null {
    const turnEntities = this.world.getEntitiesWithComponent('Turn');
    if (turnEntities.length > 0) {
      const turn = this.world.getComponent<TurnComponent>(turnEntities[0].id, 'Turn');
      return turn?.currentPlayerId || null;
    }
    return null;
  }

  getTableTiles(): Array<{ tileId: string; playerId: string; timestamp: number }> {
    const tableEntities = this.world.getEntitiesWithComponent('Table');
    if (tableEntities.length > 0) {
      const table = this.world.getComponent<TableComponent>(tableEntities[0].id, 'Table');
      return table?.tiles || [];
    }
    return [];
  }

  update(deltaTime: number): void {
    this.world.update(deltaTime);
  }

  destroy(): void {
    this.world.clear();
    this.networkClient = null;
    this.eventHandlers.clear();
  }
}
