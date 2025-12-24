// Lobby Feature - Public API
// 
// IMPORTANT: Other features should ONLY import from this file.
// DO NOT directly import from:
// - usecases/
// - repo/
// - reducer.ts
// - fsm.ts
// - LobbyController.ts (UI layer)

export { LobbyService } from './service';
export type { LobbyState, LobbyAction, RoomInfo } from './types';

