// Fetch Room List Use Case

import { ILobbyRepository } from '../repo/LobbyRepository';
import { RoomInfo } from '../types';
import { logger } from '../../../shared/logger';

export class FetchRoomListUseCase {
  constructor(private repository: ILobbyRepository) {}

  async execute(): Promise<RoomInfo[]> {
    logger.info('FetchRoomListUseCase', 'Executing fetch room list');
    try {
      const rooms = await this.repository.fetchRoomList();
      logger.info('FetchRoomListUseCase', `Fetched ${rooms.length} rooms`);
      return rooms;
    } catch (error) {
      logger.error('FetchRoomListUseCase', 'Failed to fetch room list', error);
      throw error;
    }
  }
}

