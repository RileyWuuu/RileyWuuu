// Tile Component

import { Component } from '../types';

export interface TileComponent extends Component {
  tileId: string;
  suit: 'bamboo' | 'character' | 'dot' | 'wind' | 'dragon';
  value: number;
  ownerId: string | null;
}

