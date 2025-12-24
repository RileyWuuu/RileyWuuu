// Mahjong Player domain model

import { Tile } from './Tile';

export interface Player {
  id: string;
  name: string;
  tiles: Tile[];
  score: number;
  position: number; // 0-3: East, South, West, North
}

export class PlayerFactory {
  static createPlayer(id: string, name: string, position: number): Player {
    return {
      id,
      name,
      tiles: [],
      score: 0,
      position
    };
  }

  static addTile(player: Player, tile: Tile): Player {
    return {
      ...player,
      tiles: [...player.tiles, tile]
    };
  }

  static removeTile(player: Player, tileId: string): Player {
    return {
      ...player,
      tiles: player.tiles.filter(t => t.id !== tileId)
    };
  }

  static updateScore(player: Player, score: number): Player {
    return {
      ...player,
      score
    };
  }
}

