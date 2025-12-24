// Lobby reducer

import { LobbyState, LobbyAction } from './types';

export function lobbyReducer(state: LobbyState, action: LobbyAction): LobbyState {
  switch (action.type) {
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload?.status || state.status
      };

    case 'SET_PLAYERS':
      return {
        ...state,
        players: action.payload?.players ?? state.players
      };

    case 'SET_ROOM_ID':
      return {
        ...state,
        roomId: action.payload?.roomId ?? null
      };

    case 'SET_ROOM_LIST':
      return {
        ...state,
        roomList: action.payload?.roomList || [],
        lastUpdateTime: Date.now(),
        isLoadingRooms: false
      };

    case 'SET_LOADING_ROOMS':
      return {
        ...state,
        isLoadingRooms: action.payload?.isLoadingRooms ?? false
      };

    case 'ADD_ROOM':
      if (!action.payload?.room) {
        return state;
      }
      return {
        ...state,
        roomList: [...state.roomList, action.payload.room],
        lastUpdateTime: Date.now()
      };

    case 'UPDATE_ROOM':
      if (!action.payload?.roomIdToUpdate || !action.payload?.room) {
        return state;
      }
      return {
        ...state,
        roomList: state.roomList.map(room =>
          room.roomId === action.payload!.roomIdToUpdate
            ? { ...room, ...action.payload!.room }
            : room
        ),
        lastUpdateTime: Date.now()
      };

    case 'REMOVE_ROOM':
      if (!action.payload?.roomIdToRemove) {
        return state;
      }
      return {
        ...state,
        roomList: state.roomList.filter(room => room.roomId !== action.payload!.roomIdToRemove),
        lastUpdateTime: Date.now()
      };

    case 'RESET':
      return {
        status: 'idle',
        players: 0,
        roomId: null,
        roomList: [],
        isLoadingRooms: false,
        lastUpdateTime: 0
      };

    default:
      return state;
  }
}

