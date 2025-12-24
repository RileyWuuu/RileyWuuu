// Player Component

import { Component } from '../types';

export interface PlayerComponent extends Component {
  playerId: string;
  name: string;
  tiles: string[];
  score: number;
}

