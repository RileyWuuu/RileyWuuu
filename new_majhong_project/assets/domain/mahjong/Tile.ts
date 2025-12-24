// Mahjong Tile domain model (pure, no Cocos dependencies)

export enum TileSuit {
  Bamboo = 'bamboo',
  Character = 'character',
  Dot = 'dot',
  Wind = 'wind',
  Dragon = 'dragon'
}

export enum WindType {
  East = 'east',
  South = 'south',
  West = 'west',
  North = 'north'
}

export enum DragonType {
  Red = 'red',
  Green = 'green',
  White = 'white'
}

export interface Tile {
  id: string;
  suit: TileSuit;
  value: number;
  windType?: WindType;
  dragonType?: DragonType;
}

export class TileFactory {
  static createTile(id: string, suit: TileSuit, value: number, windType?: WindType, dragonType?: DragonType): Tile {
    return {
      id,
      suit,
      value,
      windType,
      dragonType
    };
  }

  static createNumberTile(id: string, suit: TileSuit, value: number): Tile {
    if (suit === TileSuit.Wind || suit === TileSuit.Dragon) {
      throw new Error('Cannot create number tile with wind or dragon suit');
    }
    return this.createTile(id, suit, value);
  }

  static createWindTile(id: string, windType: WindType): Tile {
    return this.createTile(id, TileSuit.Wind, 0, windType);
  }

  static createDragonTile(id: string, dragonType: DragonType): Tile {
    return this.createTile(id, TileSuit.Dragon, 0, undefined, dragonType);
  }
}

