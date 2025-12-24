// Replay types for game replay functionality

import { EventPayload } from '../network/Messages';

export interface ReplayEvent {
  timestamp: number;
  event: EventPayload;
}

export interface ReplayMetadata {
  schemaVersion: string;
  gameVersion: string;
  buildHash: string;
  createdAt: number;
}

export interface ReplayData {
  schemaVersion: string;
  gameVersion: string;
  buildHash: string;
  createdAt: number;
  roomId: string;
  initialState: any;
  events: ReplayEvent[];
}

export interface ReplayConfig {
  speed: number; // Playback speed multiplier
  autoPlay: boolean;
  loop: boolean;
}

export enum ReplayState {
  Stopped = 'stopped',
  Playing = 'playing',
  Paused = 'paused',
  Finished = 'finished'
}
