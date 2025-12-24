// Mahjong Game State domain model

import { Player } from './Player';
import { Tile } from './Tile';

export enum GamePhase {
  Waiting = 'waiting',
  Playing = 'playing',
  Finished = 'finished'
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  wallTiles: Tile[]; // Remaining tiles in the wall
  discardPile: Tile[]; // Discarded tiles
  round: number;
  dealerIndex: number;
}

export class GameStateFactory {
  static createGameState(roomId: string, players: Player[]): GameState {
    return {
      roomId,
      players,
      currentPlayerIndex: 0,
      phase: GamePhase.Waiting,
      wallTiles: [],
      discardPile: [],
      round: 1,
      dealerIndex: 0
    };
  }

  static startGame(state: GameState): GameState {
    return {
      ...state,
      phase: GamePhase.Playing,
      currentPlayerIndex: state.dealerIndex
    };
  }

  static nextTurn(state: GameState): GameState {
    return {
      ...state,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length
    };
  }

  static endGame(state: GameState): GameState {
    return {
      ...state,
      phase: GamePhase.Finished
    };
  }
}

