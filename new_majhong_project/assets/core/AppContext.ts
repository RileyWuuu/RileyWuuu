// Application Context - Service Registry (NO business state)

import { logger, Logger } from '../shared/logger';
import { SceneRouter } from './SceneRouter';

export interface IService {
  // Marker interface for services
}

export class AppContext {
  private static instance: AppContext;
  private services: Map<string, IService> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): AppContext {
    if (!AppContext.instance) {
      AppContext.instance = new AppContext();
    }
    return AppContext.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('AppContext', 'Already initialized');
      return;
    }

    logger.info('AppContext', 'Initializing service registry');
    
    // Register core services
    this.register('router', SceneRouter.getInstance());
    this.register('logger', Logger.getInstance());

    this.initialized = true;
    logger.info('AppContext', 'Service registry initialized');
  }

  register<T extends IService>(name: string, service: T): void {
    if (this.services.has(name)) {
      logger.warn('AppContext', `Service ${name} already registered, overwriting`);
    }
    this.services.set(name, service);
    logger.debug('AppContext', `Registered service: ${name}`);
  }

  get<T extends IService>(name: string): T | null {
    const service = this.services.get(name);
    if (!service) {
      logger.warn('AppContext', `Service ${name} not found`);
      return null;
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const appContext = AppContext.getInstance();
