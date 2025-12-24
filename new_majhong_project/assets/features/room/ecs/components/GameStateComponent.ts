// Game State Component

import { Component } from '../types';

export interface GameStateComponent extends Component {
  roomId: string;
  currentPlayerIndex: number;
  phase: 'waiting' | 'playing' | 'finished';
}

