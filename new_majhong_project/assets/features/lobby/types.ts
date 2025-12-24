// Lobby module types

export interface RoomInfo {
  roomId: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  hostId?: string;
}

export interface LobbyState {
  status: 'idle' | 'searching' | 'matched';
  players: number;
  roomId: string | null;
  roomList: RoomInfo[];
  isLoadingRooms: boolean;
  lastUpdateTime: number;
}

export interface LobbyAction {
  type: 'SET_STATUS' | 'SET_PLAYERS' | 'SET_ROOM_ID' | 'SET_ROOM_LIST' | 'SET_LOADING_ROOMS' | 'ADD_ROOM' | 'UPDATE_ROOM' | 'REMOVE_ROOM' | 'RESET';
  payload?: {
    status?: LobbyState['status'];
    players?: number;
    roomId?: string | null;
    roomList?: RoomInfo[];
    room?: RoomInfo;
    roomIdToUpdate?: string;
    roomIdToRemove?: string;
    isLoadingRooms?: boolean;
  };
}

