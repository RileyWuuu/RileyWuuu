// Room Feature - Public API
//
// IMPORTANT: Other features should ONLY import from this file.
// DO NOT directly import from:
// - ecs/ (internal implementation)
// - replay/ (internal implementation)
// - RoomController.ts (UI layer)

export { RoomService } from './service';
export type { RoomState, RoomEvent, RoomSnapshot, Player, Tile } from './types';

