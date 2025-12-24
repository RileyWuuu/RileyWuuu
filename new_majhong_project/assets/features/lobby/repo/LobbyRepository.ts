// Lobby Repository - data access layer

import { RoomInfo } from '../types';
import { logger } from '../../../shared/logger';

export interface ILobbyRepository {
  fetchRoomList(): Promise<RoomInfo[]>;
  createRoom(name: string, maxPlayers: number): Promise<RoomInfo>;
  getRoom(roomId: string): Promise<RoomInfo | null>;
}

export class LobbyRepository implements ILobbyRepository {
  private mockRooms: Map<string, RoomInfo> = new Map();

  constructor() {
    this.initializeMockData();
  }

  async fetchRoomList(): Promise<RoomInfo[]> {
    logger.debug('LobbyRepository', 'Fetching room list');
    // In real implementation, this would call network API
    await new Promise(resolve => setTimeout(resolve, 300));
    return Array.from(this.mockRooms.values());
  }

  async createRoom(name: string, maxPlayers: number): Promise<RoomInfo> {
    logger.debug('LobbyRepository', `Creating room: ${name}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const room: RoomInfo = {
      roomId: `room_${Date.now()}`,
      name,
      playerCount: 1,
      maxPlayers,
      status: 'waiting',
      createdAt: Date.now(),
      hostId: 'current_user_id'
    };

    this.mockRooms.set(room.roomId, room);
    return room;
  }

  async getRoom(roomId: string): Promise<RoomInfo | null> {
    logger.debug('LobbyRepository', `Getting room: ${roomId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.mockRooms.get(roomId) || null;
  }

  private initializeMockData(): void {
    const mockRooms: RoomInfo[] = [
      {
        roomId: 'room_001',
        name: '房間 1',
        playerCount: 2,
        maxPlayers: 4,
        status: 'waiting',
        createdAt: Date.now() - 60000,
        hostId: 'player_1'
      },
      {
        roomId: 'room_002',
        name: '房間 2',
        playerCount: 3,
        maxPlayers: 4,
        status: 'waiting',
        createdAt: Date.now() - 30000,
        hostId: 'player_2'
      }
    ];

    mockRooms.forEach(room => {
      this.mockRooms.set(room.roomId, room);
    });
  }
}

