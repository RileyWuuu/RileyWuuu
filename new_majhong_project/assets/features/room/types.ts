// Room module types

export interface RoomState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  tiles: Tile[];
  gamePhase: 'waiting' | 'playing' | 'finished';
}

export interface Player {
  id: string;
  name: string;
  tiles: Tile[];
  score: number;
}

export interface Tile {
  id: string;
  suit: 'bamboo' | 'character' | 'dot' | 'wind' | 'dragon';
  value: number;
}

// PlayTileIntent is now defined in shared/network/Messages.ts

export interface RoomEvent {
  type: 'TILE_PLAYED' | 'TURN_CHANGED' | 'GAME_STARTED' | 'GAME_ENDED';
  payload?: any;
}

export interface RoomSnapshot {
  seq: number;
  state: RoomState;
}

