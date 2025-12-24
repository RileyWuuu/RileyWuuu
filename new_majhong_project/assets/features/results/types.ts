// Results module types

export interface GameResult {
  roomId: string;
  players: PlayerResult[];
  winner: string | null;
  endTime: number;
}

export interface PlayerResult {
  playerId: string;
  name: string;
  score: number;
  rank: number;
}

