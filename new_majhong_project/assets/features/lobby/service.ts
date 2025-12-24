// Lobby Service - Facade layer

import { logger } from '../../shared/logger';
import { LobbyState, RoomInfo } from './types';
import { WsTransport } from '../../shared/network/WsTransport';
import { LobbyRepository, ILobbyRepository } from './repo/LobbyRepository';
import { FetchRoomListUseCase } from './usecases/FetchRoomListUseCase';
import { CreateRoomUseCase } from './usecases/CreateRoomUseCase';
import { EnterRoomUseCase } from './usecases/EnterRoomUseCase';

export class LobbyService {
  private state: LobbyState = {
    status: 'idle',
    players: 0,
    roomId: null,
    roomList: [],
    isLoadingRooms: false,
    lastUpdateTime: 0
  };

  private transport: WsTransport | null = null;
  private roomListUpdateInterval: number | null = null;
  private roomListUpdateHandlers: Array<(rooms: RoomInfo[]) => void> = [];
  
  private repository: ILobbyRepository;
  private fetchRoomListUseCase: FetchRoomListUseCase;
  private createRoomUseCase: CreateRoomUseCase;
  private enterRoomUseCase: EnterRoomUseCase;

  constructor() {
    this.repository = new LobbyRepository();
    this.fetchRoomListUseCase = new FetchRoomListUseCase(this.repository);
    this.createRoomUseCase = new CreateRoomUseCase(this.repository);
    this.enterRoomUseCase = new EnterRoomUseCase(this.repository);
  }

  connect(transport: WsTransport): void {
    this.transport = transport;

    transport.onEvent('ROOM_LIST_UPDATED', (data: { rooms: RoomInfo[] }) => {
      this.updateRoomList(data.rooms);
    });

    transport.onEvent('ROOM_ADDED', (data: { room: RoomInfo }) => {
      this.addRoom(data.room);
    });

    transport.onEvent('ROOM_UPDATED', (data: { room: RoomInfo }) => {
      this.updateRoom(data.room);
    });

    transport.onEvent('ROOM_REMOVED', (data: { roomId: string }) => {
      this.removeRoom(data.roomId);
    });

    logger.info('Lobby', 'Connected to transport');
  }

  disconnect(): void {
    this.stopRoomListUpdates();
    this.transport = null;
  }

  async fetchRoomList(): Promise<RoomInfo[]> {
    this.state.isLoadingRooms = true;
    try {
      const rooms = await this.fetchRoomListUseCase.execute();
      return rooms;
    } catch (error) {
      logger.error('Lobby', 'Failed to fetch room list', error);
      return [];
    } finally {
      this.state.isLoadingRooms = false;
    }
  }

  async refreshRoomList(): Promise<void> {
    const rooms = await this.fetchRoomList();
    this.updateRoomList(rooms);
  }

  startRoomListUpdates(interval: number = 5000): void {
    this.stopRoomListUpdates();
    this.refreshRoomList();
    this.roomListUpdateInterval = setInterval(() => {
      this.refreshRoomList();
    }, interval) as unknown as number;
    logger.info('Lobby', `Started room list updates (interval: ${interval}ms)`);
  }

  stopRoomListUpdates(): void {
    if (this.roomListUpdateInterval) {
      clearInterval(this.roomListUpdateInterval);
      this.roomListUpdateInterval = null;
      logger.info('Lobby', 'Stopped room list updates');
    }
  }

  onRoomListUpdate(handler: (rooms: RoomInfo[]) => void): () => void {
    this.roomListUpdateHandlers.push(handler);
    return () => {
      const index = this.roomListUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.roomListUpdateHandlers.splice(index, 1);
      }
    };
  }

  private updateRoomList(rooms: RoomInfo[]): void {
    this.state.roomList = rooms;
    this.state.lastUpdateTime = Date.now();
    this.state.isLoadingRooms = false;
    logger.info('Lobby', `Room list updated: ${rooms.length} rooms`);
    this.roomListUpdateHandlers.forEach(handler => handler(rooms));
  }

  private addRoom(room: RoomInfo): void {
    const exists = this.state.roomList.some(r => r.roomId === room.roomId);
    if (!exists) {
      this.state.roomList = [...this.state.roomList, room];
      this.state.lastUpdateTime = Date.now();
      logger.info('Lobby', `Room added: ${room.roomId}`);
      this.roomListUpdateHandlers.forEach(handler => handler(this.state.roomList));
    }
  }

  private updateRoom(room: RoomInfo): void {
    this.state.roomList = this.state.roomList.map(r =>
      r.roomId === room.roomId ? { ...r, ...room } : r
    );
    this.state.lastUpdateTime = Date.now();
    logger.info('Lobby', `Room updated: ${room.roomId}`);
    this.roomListUpdateHandlers.forEach(handler => handler(this.state.roomList));
  }

  private removeRoom(roomId: string): void {
    this.state.roomList = this.state.roomList.filter(r => r.roomId !== roomId);
    this.state.lastUpdateTime = Date.now();
    logger.info('Lobby', `Room removed: ${roomId}`);
    this.roomListUpdateHandlers.forEach(handler => handler(this.state.roomList));
  }

  async enterRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
    logger.info('Lobby', `Entering room: ${roomId}`);
    const result = await this.enterRoomUseCase.execute(roomId);
    
    if (result.success) {
      this.state = {
        ...this.state,
        status: 'matched',
        roomId
      };
    }
    
    return result;
  }

  async createRoom(name: string, maxPlayers: number = 4): Promise<{ success: boolean; roomId?: string; error?: string }> {
    logger.info('Lobby', `Creating room: ${name}`);
    try {
      const room = await this.createRoomUseCase.execute(name, maxPlayers);
      this.addRoom(room);
      return { success: true, roomId: room.roomId };
    } catch (error: any) {
      logger.error('Lobby', 'Failed to create room', error);
      return { success: false, error: error.message || 'Failed to create room' };
    }
  }

  getRoomList(): RoomInfo[] {
    return [...this.state.roomList];
  }

  getRoom(roomId: string): RoomInfo | null {
    return this.state.roomList.find(r => r.roomId === roomId) || null;
  }

  getState(): LobbyState {
    return { ...this.state };
  }
}
