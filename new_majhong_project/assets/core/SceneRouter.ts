// Scene Router - centralized scene navigation

import { director } from 'cc';
import { SceneRoute, RouteConfig, RouteParams } from './RouteDefs';
import { logger } from '../shared/logger';

export class SceneRouter {
  private static instance: SceneRouter;
  private currentScene: SceneRoute | null = null;
  private sceneHistory: SceneRoute[] = [];
  private routeHandlers: Map<SceneRoute, (params?: RouteParams) => void> = new Map();

  private constructor() {}

  static getInstance(): SceneRouter {
    if (!SceneRouter.instance) {
      SceneRouter.instance = new SceneRouter();
    }
    return SceneRouter.instance;
  }

  navigate(config: RouteConfig): void {
    const { scene, params } = config;
    
    logger.info('SceneRouter', `Navigating to scene: ${scene}`, params);

    // Record history
    if (this.currentScene) {
      this.sceneHistory.push(this.currentScene);
    }
    this.currentScene = scene;

    // Call route handler if exists
    const handler = this.routeHandlers.get(scene);
    if (handler) {
      handler(params);
    }

    // Load scene
    director.loadScene(scene);
  }

  goBack(): void {
    if (this.sceneHistory.length > 0) {
      const previousScene = this.sceneHistory.pop()!;
      this.navigate({ scene: previousScene });
    } else {
      logger.warn('SceneRouter', 'No previous scene to go back to');
    }
  }

  registerRouteHandler(scene: SceneRoute, handler: (params?: RouteParams) => void): void {
    this.routeHandlers.set(scene, handler);
  }

  unregisterRouteHandler(scene: SceneRoute): void {
    this.routeHandlers.delete(scene);
  }

  getCurrentScene(): SceneRoute | null {
    return this.currentScene;
  }

  clearHistory(): void {
    this.sceneHistory = [];
  }
}

export const sceneRouter = SceneRouter.getInstance();

