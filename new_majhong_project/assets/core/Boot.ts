// Boot script - entry point

import { _decorator, Component } from 'cc';
import { AuthService } from '../features/auth/service';
import { logger } from '../shared/logger';
import { appContext } from './AppContext';
import { SceneRouter } from './SceneRouter';
import { SceneRoute } from './RouteDefs';

const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
  private authService: AuthService;

  async onLoad() {
    logger.info('Boot', 'Application starting');
    
    // Initialize app context
    await appContext.initialize();
    
    this.authService = new AuthService();
  }

  async start() {
    // Mock authentication
    const result = await this.authService.login('player_1', 'password');
    
    if (result.success) {
      logger.info('Boot', 'Authentication successful, loading lobby');
      const router = appContext.get<SceneRouter>('router');
      if (router) {
        router.navigate({ scene: SceneRoute.Lobby });
      }
    } else {
      logger.error('Boot', 'Authentication failed');
    }
  }
}

