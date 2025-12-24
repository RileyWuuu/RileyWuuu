// ECS-lite type definitions

export type EntityId = number;

export interface Component {
  [key: string]: any;
}

export interface Entity {
  id: EntityId;
  components: Map<string, Component>;
  active: boolean;
}

export interface System {
  update(world: World, deltaTime: number): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;
  getOrder?(): number; // System execution order (lower = earlier)
  getPhase?(): SystemPhase; // System phase
}

export enum SystemPhase {
  ServerEvents = 0,    // Apply server events first
  Simulation = 1,      // Game logic simulation
  Animation = 2,       // Animation/interpolation
  UIProjection = 3     // UI state projection
}

export interface World {
  createEntity(): EntityId;
  removeEntity(id: EntityId): void;
  addComponent(id: EntityId, componentType: string, component: Component): void;
  removeComponent(id: EntityId, componentType: string): void;
  getComponent<T extends Component>(id: EntityId, componentType: string): T | null;
  hasComponent(id: EntityId, componentType: string): boolean;
  getEntitiesWithComponent(componentType: string): Entity[];
  getEntity(id: EntityId): Entity | null;
  getAllEntities(): Entity[];
  addSystem(system: System): void;
  removeSystem(system: System): void;
  update(deltaTime: number): void;
  clear(): void;
}
