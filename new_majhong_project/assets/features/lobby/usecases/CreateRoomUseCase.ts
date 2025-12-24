// Create Room Use Case

import { ILobbyRepository } from '../repo/LobbyRepository';
import { RoomInfo } from '../types';
import { logger } from '../../../shared/logger';

export class CreateRoomUseCase {
  constructor(private repository: ILobbyRepository) {}

  async execute(name: string, maxPlayers: number = 4): Promise<RoomInfo> {
    logger.info('CreateRoomUseCase', `Creating room: ${name}`);
    
    if (!name || name.trim().length === 0) {
      throw new Error('Room name cannot be empty');
    }

    if (maxPlayers < 2 || maxPlayers > 4) {
      throw new Error('Max players must be between 2 and 4');
    }

    try {
      const room = await this.repository.createRoom(name, maxPlayers);
      logger.info('CreateRoomUseCase', `Room created: ${room.roomId}`);
      return room;
    } catch (error) {
      logger.error('CreateRoomUseCase', 'Failed to create room', error);
      throw error;
    }
  }
}

