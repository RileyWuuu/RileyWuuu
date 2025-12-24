// ECS-lite World implementation with fixed tick order

import { Entity, EntityId, Component, System, SystemPhase } from './types';
import { logger } from '../../../shared/logger';

export class World {
  private entities: Map<EntityId, Entity> = new Map();
  private systems: System[] = [];
  private nextEntityId: EntityId = 1;
  private componentIndex: Map<string, Set<EntityId>> = new Map();
  private serverEvents: Array<{ event: any; timestamp: number }> = [];

  createEntity(): EntityId {
    const id = this.nextEntityId++;
    const entity: Entity = {
      id,
      components: new Map(),
      active: true
    };
    this.entities.set(id, entity);
    logger.debug('ECS', `Created entity: ${id}`);
    return id;
  }

  removeEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (!entity) {
      return;
    }

    entity.components.forEach((_, componentType) => {
      this.removeComponent(id, componentType);
    });

    this.entities.delete(id);
    logger.debug('ECS', `Removed entity: ${id}`);
  }

  addComponent(id: EntityId, componentType: string, component: Component): void {
    const entity = this.entities.get(id);
    if (!entity) {
      logger.warn('ECS', `Cannot add component: entity ${id} not found`);
      return;
    }

    entity.components.set(componentType, component);

    if (!this.componentIndex.has(componentType)) {
      this.componentIndex.set(componentType, new Set());
    }
    this.componentIndex.get(componentType)!.add(id);

    logger.debug('ECS', `Added component ${componentType} to entity ${id}`);
  }

  removeComponent(id: EntityId, componentType: string): void {
    const entity = this.entities.get(id);
    if (!entity) {
      return;
    }

    entity.components.delete(componentType);

    const index = this.componentIndex.get(componentType);
    if (index) {
      index.delete(id);
    }

    logger.debug('ECS', `Removed component ${componentType} from entity ${id}`);
  }

  getComponent<T extends Component>(id: EntityId, componentType: string): T | null {
    const entity = this.entities.get(id);
    if (!entity) {
      return null;
    }
    return (entity.components.get(componentType) as T) || null;
  }

  hasComponent(id: EntityId, componentType: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) {
      return false;
    }
    return entity.components.has(componentType);
  }

  getEntitiesWithComponent(componentType: string): Entity[] {
    const ids = this.componentIndex.get(componentType);
    if (!ids) {
      return [];
    }

    const entities: Entity[] = [];
    ids.forEach(id => {
      const entity = this.entities.get(id);
      if (entity && entity.active) {
        entities.push(entity);
      }
    });
    return entities;
  }

  getEntity(id: EntityId): Entity | null {
    return this.entities.get(id) || null;
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.active);
  }

  addSystem(system: System): void {
    this.systems.push(system);
    // Sort systems by phase and order
    this.sortSystems();
    logger.debug('ECS', `Added system: ${system.constructor.name}`);
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index > -1) {
      this.systems.splice(index, 1);
      logger.debug('ECS', `Removed system: ${system.constructor.name}`);
    }
  }

  private sortSystems(): void {
    this.systems.sort((a, b) => {
      const phaseA = a.getPhase?.() ?? SystemPhase.Simulation;
      const phaseB = b.getPhase?.() ?? SystemPhase.Simulation;
      
      if (phaseA !== phaseB) {
        return phaseA - phaseB;
      }
      
      const orderA = a.getOrder?.() ?? 0;
      const orderB = b.getOrder?.() ?? 0;
      return orderA - orderB;
    });
  }

  addServerEvent(event: any): void {
    this.serverEvents.push({
      event,
      timestamp: Date.now()
    });
  }

  // Fixed pipeline API
  applyServerEvents(): void {
    const serverEventSystems = this.systems.filter(s => 
      s.getPhase?.() === SystemPhase.ServerEvents
    );

    while (this.serverEvents.length > 0) {
      const { event } = this.serverEvents.shift()!;
      
      // Process events through server event systems
      serverEventSystems.forEach(system => {
        // Try to call specific event handlers if available
        if ((system as any).processTilePlayedEvent && event.type === 'TILE_PLAYED') {
          (system as any).processTilePlayedEvent(
            this,
            event.payload?.playerId,
            event.payload?.tileId
          );
        } else if ((system as any).processTurnChangedEvent && event.type === 'TURN_CHANGED') {
          // Get players from world entities
          const playerEntities = this.getEntitiesWithComponent('Player');
          const players = playerEntities.map(e => {
            const player = this.getComponent<any>(e.id, 'Player');
            return { id: player?.playerId || e.id };
          });
          (system as any).processTurnChangedEvent(this, event.payload?.playerIndex, players);
        } else {
          system.update(this, 0);
        }
      });
    }
  }

  runSimulation(deltaTime: number): void {
    const simulationSystems = this.systems.filter(s => 
      s.getPhase?.() === SystemPhase.Simulation
    );

    simulationSystems.forEach(system => {
      system.update(this, deltaTime);
    });
  }

  runAnimation(deltaTime: number): void {
    const animationSystems = this.systems.filter(s => 
      s.getPhase?.() === SystemPhase.Animation
    );

    animationSystems.forEach(system => {
      system.update(this, deltaTime);
    });
  }

  projectUi(deltaTime: number): void {
    const uiSystems = this.systems.filter(s => 
      s.getPhase?.() === SystemPhase.UIProjection
    );

    uiSystems.forEach(system => {
      system.update(this, deltaTime);
    });
  }

  update(deltaTime: number): void {
    // Fixed pipeline: only call these four stages
    this.applyServerEvents();
    this.runSimulation(deltaTime);
    this.runAnimation(deltaTime);
    this.projectUi(deltaTime);
  }

  clear(): void {
    this.entities.clear();
    this.systems = [];
    this.componentIndex.clear();
    this.nextEntityId = 1;
    this.serverEvents = [];
    logger.debug('ECS', 'World cleared');
  }
}
