// Network Messages - Unified Envelope with seq/ack

// Base envelope structure
export interface MessageEnvelope {
  seq: number;
  ack: number;
}

// Intent envelope
export interface IntentEnvelope extends MessageEnvelope {
  type: 'intent';
  intent: IntentPayload;
}

// Event envelope
export interface EventEnvelope extends MessageEnvelope {
  type: 'event';
  event: EventPayload;
}

// Snapshot envelope
export interface SnapshotEnvelope extends MessageEnvelope {
  type: 'snapshot';
  snapshot: SnapshotPayload;
}

// Heartbeat envelope
export interface HeartbeatEnvelope extends MessageEnvelope {
  type: 'heartbeat';
}

// Ack envelope
export interface AckEnvelope {
  type: 'ack';
  ack: number;
}

// Union of all envelope types
export type NetworkEnvelope = IntentEnvelope | EventEnvelope | SnapshotEnvelope | HeartbeatEnvelope | AckEnvelope;

// Intent payload types
export interface PlayTileIntentPayload {
  type: 'PLAY_TILE';
  payload: {
    tileId: string;
  };
}

export interface EnterRoomIntentPayload {
  type: 'ENTER_ROOM';
  payload: {
    roomId: string;
  };
}

export interface CreateRoomIntentPayload {
  type: 'CREATE_ROOM';
  payload: {
    name: string;
    maxPlayers: number;
  };
}

export interface FetchRoomListIntentPayload {
  type: 'FETCH_ROOM_LIST';
  payload?: {};
}

export type IntentPayload = 
  | PlayTileIntentPayload 
  | EnterRoomIntentPayload 
  | CreateRoomIntentPayload 
  | FetchRoomListIntentPayload;

// Event payload types
export interface TilePlayedEventPayload {
  type: 'TILE_PLAYED';
  payload: {
    playerId: string;
    tileId: string;
  };
}

export interface TurnChangedEventPayload {
  type: 'TURN_CHANGED';
  payload: {
    playerIndex: number;
  };
}

export interface GameStartedEventPayload {
  type: 'GAME_STARTED';
  payload: {
    roomId: string;
  };
}

export interface GameEndedEventPayload {
  type: 'GAME_ENDED';
  payload: {
    roomId: string;
    winner: string;
  };
}

export interface RoomListUpdatedEventPayload {
  type: 'ROOM_LIST_UPDATED';
  payload: {
    rooms: any[];
  };
}

export type EventPayload = 
  | TilePlayedEventPayload 
  | TurnChangedEventPayload 
  | GameStartedEventPayload 
  | GameEndedEventPayload 
  | RoomListUpdatedEventPayload;

// Snapshot payload
export interface SnapshotPayload {
  seq: number;
  state: any;
}

// Legacy type aliases for backward compatibility
export type Intent = IntentPayload;
export type Event = EventPayload;
export type Snapshot = SnapshotPayload;
