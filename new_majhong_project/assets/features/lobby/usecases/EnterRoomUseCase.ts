// Enter Room Use Case

import { ILobbyRepository } from '../repo/LobbyRepository';
import { RoomInfo } from '../types';
import { logger } from '../../../shared/logger';

export class EnterRoomUseCase {
  constructor(private repository: ILobbyRepository) {}

  async execute(roomId: string): Promise<{ success: boolean; error?: string }> {
    logger.info('EnterRoomUseCase', `Entering room: ${roomId}`);

    try {
      const room = await this.repository.getRoom(roomId);
      
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      if (room.playerCount >= room.maxPlayers) {
        return { success: false, error: 'Room is full' };
      }

      if (room.status === 'finished') {
        return { success: false, error: 'Room is finished' };
      }

      logger.info('EnterRoomUseCase', 'Room entry validated');
      return { success: true };
    } catch (error) {
      logger.error('EnterRoomUseCase', 'Failed to enter room', error);
      return { success: false, error: 'Failed to enter room' };
    }
  }
}

