// Mahjong Game Rules (pure logic, no dependencies)

import { Tile, TileSuit } from './Tile';
import { Player } from './Player';

export class MahjongRules {
  static readonly TILES_PER_PLAYER = 13;
  static readonly DEALER_TILES = 14;
  static readonly TOTAL_TILES = 144;
  static readonly MAX_PLAYERS = 4;

  static canPlayTile(player: Player, tileId: string): boolean {
    return player.tiles.some(t => t.id === tileId);
  }

  static isValidTileValue(suit: TileSuit, value: number): boolean {
    if (suit === TileSuit.Wind || suit === TileSuit.Dragon) {
      return value === 0;
    }
    return value >= 1 && value <= 9;
  }

  static isWinningHand(tiles: Tile[]): boolean {
    // Simplified check - full implementation would check for valid mahjong hand patterns
    return tiles.length === 14;
  }

  static canChow(tiles: Tile[], newTile: Tile): boolean {
    // Check if can form a chow (sequence) with the new tile
    // Simplified implementation
    return false;
  }

  static canPong(tiles: Tile[], newTile: Tile): boolean {
    // Check if can form a pong (triplet) with the new tile
    const count = tiles.filter(t => 
      t.suit === newTile.suit && t.value === newTile.value
    ).length;
    return count >= 2;
  }

  static canKong(tiles: Tile[], newTile: Tile): boolean {
    // Check if can form a kong (quad) with the new tile
    const count = tiles.filter(t => 
      t.suit === newTile.suit && t.value === newTile.value
    ).length;
    return count >= 3;
  }
}

