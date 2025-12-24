// Matchmaking module types

export interface MatchmakingState {
  isSearching: boolean;
  queueTime: number;
}

export interface MatchmakingAction {
  type: 'START_SEARCH' | 'STOP_SEARCH' | 'MATCHED';
  payload?: {
    queueTime?: number;
  };
}

