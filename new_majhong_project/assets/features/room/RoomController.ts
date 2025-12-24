// Room Controller - UI layer

import { _decorator, Component, Node, Button, Label, Sprite } from 'cc';
import { RoomService } from './service';
import { RoomState, RoomEvent } from './types';
import { PlayTileIntentPayload } from '../../shared/network/Messages';
import { NetworkClient } from '../../shared/network/NetworkClient';
import { logger } from '../../shared/logger';
import { ReplayLog } from './replay/ReplayLog';

const { ccclass, property } = _decorator;

@ccclass('RoomController')
export class RoomController extends Component {
  @property(Button)
  playTileButton: Button = null!;

  @property(Label)
  roomIdLabel: Label = null!;

  @property(Label)
  statusLabel: Label = null!;

  @property(Label)
  playerInfoLabel: Label = null!;

  @property(Label)
  eventLogLabel: Label = null!;

  @property(Label)
  turnPlayerLabel: Label = null!;

  @property(Label)
  tableTilesLabel: Label = null!;

  private roomService: RoomService;
  private networkClient: NetworkClient | null = null;
  private eventLog: string[] = [];
  private maxLogEntries: number = 10;
  private replayLog: ReplayLog | null = null;

  onLoad() {
    this.roomService = new RoomService();
    
    // Setup network client with mock mode
    this.networkClient = new NetworkClient({
      url: 'ws://localhost:8080',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      mockMode: true // Enable mock mode for testing
    });

    // Connect room service to network client
    this.roomService.connect(this.networkClient);

    // Initialize replay log
    const initialState = this.roomService.getState();
    this.replayLog = new ReplayLog(initialState.roomId, initialState);

    // Subscribe to room events and log to replay
    this.roomService.onEvent('TILE_PLAYED', (event: RoomEvent) => {
      this.addEventLog(`Tile played: ${JSON.stringify(event.payload)}`);
      if (this.replayLog && event.payload) {
        this.replayLog.addEvent({
          type: 'TILE_PLAYED',
          payload: event.payload
        });
      }
    });

    this.roomService.onEvent('TURN_CHANGED', (event: RoomEvent) => {
      this.addEventLog(`Turn changed: Player ${event.payload?.playerIndex}`);
      if (this.replayLog && event.payload) {
        this.replayLog.addEvent({
          type: 'TURN_CHANGED',
          payload: event.payload
        });
      }
      this.render();
    });
  }

  start() {
    if (this.playTileButton) {
      this.playTileButton.node.on(Button.EventType.CLICK, this.onPlayTileClick, this);
    }

    this.render();
    this.addEventLog('Room initialized');
    
    // Setup DebugOverlay with network client and replay log if available
    const debugOverlay = this.node.getComponentInChildren('DebugOverlay' as any);
    if (debugOverlay) {
      if (this.networkClient) {
        (debugOverlay as any).setNetworkClient(this.networkClient);
      }
      if (this.replayLog) {
        (debugOverlay as any).setReplayLog(this.replayLog);
      }
    }
  }

  onDestroy() {
    if (this.roomService) {
      this.roomService.destroy();
    }
    if (this.networkClient) {
      this.networkClient.disconnect();
    }
  }

  update(deltaTime: number) {
    if (this.roomService) {
      this.roomService.update(deltaTime);
    }
  }

  private onPlayTileClick() {
    const state = this.roomService.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    if (currentPlayer && currentPlayer.tiles.length > 0) {
      const tileId = currentPlayer.tiles[0];
      
      const intent: PlayTileIntentPayload = {
        type: 'PLAY_TILE',
        payload: {
          tileId: tileId
        }
      };

      this.roomService.sendIntent(intent);
      this.addEventLog(`Sent intent: PLAY_TILE (tile: ${tileId})`);
    } else {
      this.addEventLog('No tiles available to play');
    }
  }

  private render() {
    const state = this.roomService.getState();

    if (this.roomIdLabel) {
      this.roomIdLabel.string = `Room: ${state.roomId}`;
    }

    if (this.statusLabel) {
      this.statusLabel.string = `Phase: ${state.gamePhase}`;
    }

    if (this.playerInfoLabel) {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const info = `Current Player: ${currentPlayer?.name || 'Unknown'}\n` +
                   `Players: ${state.players.length}\n` +
                   `Tiles: ${currentPlayer?.tiles.length || 0}`;
      this.playerInfoLabel.string = info;
    }

    // Display current turn player
    if (this.turnPlayerLabel) {
      const turnPlayerId = this.roomService.getCurrentTurnPlayerId();
      const turnPlayer = state.players.find(p => p.id === turnPlayerId);
      this.turnPlayerLabel.string = `Turn: ${turnPlayer?.name || turnPlayerId || 'Unknown'}`;
    }

    // Display table tiles
    if (this.tableTilesLabel) {
      const tableTiles = this.roomService.getTableTiles();
      if (tableTiles.length > 0) {
        const tilesText = tableTiles.map(t => 
          `${t.playerId}: ${t.tileId}`
        ).join(', ');
        this.tableTilesLabel.string = `Table: ${tilesText}`;
      } else {
        this.tableTilesLabel.string = 'Table: (empty)';
      }
    }

    if (this.eventLogLabel) {
      this.eventLogLabel.string = this.eventLog.slice(-this.maxLogEntries).join('\n');
    }
  }

  private addEventLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLog.push(`[${timestamp}] ${message}`);
    if (this.eventLog.length > this.maxLogEntries * 2) {
      this.eventLog = this.eventLog.slice(-this.maxLogEntries);
    }
    this.render();
    logger.info('Room', message);
  }

  getReplayLog(): ReplayLog | null {
    return this.replayLog;
  }
}
