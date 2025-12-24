// Route definitions for scene navigation

export enum SceneRoute {
  Boot = 'Boot',
  Lobby = 'Lobby',
  Room = 'Room',
  Results = 'Results'
}

export interface RouteParams {
  [key: string]: any;
}

export interface RouteConfig {
  scene: SceneRoute;
  params?: RouteParams;
}

