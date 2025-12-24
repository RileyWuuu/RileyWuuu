// Turn Component - tracks current turn state

import { Component } from '../types';

export interface TurnComponent extends Component {
  currentPlayerId: string;
  turnNumber: number;
  lastActionTime: number;
}

