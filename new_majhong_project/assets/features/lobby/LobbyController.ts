// Lobby Controller - UI layer

import { _decorator, Component, Node, Button, Label, ScrollView, Prefab, instantiate } from 'cc';
import { Store } from '../../shared/store';
import { StateMachine } from '../../shared/fsm';
import { createLobbyFSM } from './fsm';
import { lobbyReducer } from './reducer';
import { LobbyState, LobbyAction, RoomInfo } from './types';
import { LobbyService } from './service';
import { logger } from '../../shared/logger';
import { appContext } from '../../core/AppContext';
import { SceneRouter } from '../../core/SceneRouter';
import { SceneRoute } from '../../core/RouteDefs';
import { NetworkClient } from '../../shared/network/NetworkClient';

const { ccclass, property } = _decorator;

@ccclass('LobbyController')
export class LobbyController extends Component {
  @property(Button)
  enterRoomButton: Button = null!;

  @property(Button)
  refreshRoomListButton: Button = null!;

  @property(Button)
  createRoomButton: Button = null!;

  @property(Label)
  statusLabel: Label = null!;

  @property(Label)
  roomListLabel: Label = null!;

  @property(ScrollView)
  roomListScrollView: ScrollView = null!;

  @property(Prefab)
  roomItemPrefab: Prefab = null!;

  @property(Node)
  roomListContainer: Node = null!;

  private store: Store<LobbyState, LobbyAction>;
  private fsm: StateMachine;
  private lobbyService: LobbyService;
  private networkClient: NetworkClient | null = null;
  private unsubscribe: (() => void) | null = null;
  private roomListUnsubscribe: (() => void) | null = null;

  onLoad() {
    const initialState: LobbyState = {
      status: 'idle',
      players: 0,
      roomId: null,
      roomList: [],
      isLoadingRooms: false,
      lastUpdateTime: 0
    };

    this.store = new Store(initialState, lobbyReducer);
    this.fsm = createLobbyFSM();
    this.lobbyService = new LobbyService();

    // Setup network client (mock for now, replace with actual connection)
    this.networkClient = new NetworkClient({
      url: 'ws://localhost:8080',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    });

    this.lobbyService.connect(this.networkClient.getTransport());

    this.fsm.start('idle');
  }

  start() {
    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe((state) => {
      this.render(state);
    });

    // Subscribe to room list updates
    this.roomListUnsubscribe = this.lobbyService.onRoomListUpdate((rooms) => {
      this.store.dispatch({ type: 'SET_ROOM_LIST', payload: { roomList: rooms } });
    });

    // Setup buttons
    if (this.enterRoomButton) {
      this.enterRoomButton.node.on(Button.EventType.CLICK, this.onEnterRoomClick, this);
    }

    if (this.refreshRoomListButton) {
      this.refreshRoomListButton.node.on(Button.EventType.CLICK, this.onRefreshRoomListClick, this);
    }

    if (this.createRoomButton) {
      this.createRoomButton.node.on(Button.EventType.CLICK, this.onCreateRoomClick, this);
    }

    // Load initial room list
    this.loadRoomList();

    // Start automatic room list updates
    this.lobbyService.startRoomListUpdates(10000); // Update every 10 seconds

    // Initial render
    this.render(this.store.getState());
  }

  onDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.roomListUnsubscribe) {
      this.roomListUnsubscribe();
    }
    this.lobbyService.stopRoomListUpdates();
    this.lobbyService.disconnect();
    if (this.networkClient) {
      this.networkClient.disconnect();
    }
  }

  private async loadRoomList() {
    this.store.dispatch({ type: 'SET_LOADING_ROOMS', payload: { isLoadingRooms: true } });
    const rooms = await this.lobbyService.fetchRoomList();
    this.store.dispatch({ type: 'SET_ROOM_LIST', payload: { roomList: rooms } });
  }

  private async onRefreshRoomListClick() {
    logger.info('Lobby', 'Refresh room list clicked');
    await this.loadRoomList();
  }

  private async onCreateRoomClick() {
    logger.info('Lobby', 'Create room clicked');
    
    const roomName = `房間 ${Date.now()}`;
    const result = await this.lobbyService.createRoom(roomName, 4);

    if (result.success && result.roomId) {
      logger.info('Lobby', `Room created: ${result.roomId}`);
      // Optionally enter the created room
      // await this.enterRoom(result.roomId);
    } else {
      logger.error('Lobby', 'Failed to create room', result.error);
    }
  }

  private async onEnterRoomClick() {
    logger.info('Lobby', 'Enter room button clicked');
    
    // Get first available room or use default
    const state = this.store.getState();
    const availableRoom = state.roomList.find(r => 
      r.status === 'waiting' && r.playerCount < r.maxPlayers
    );

    if (!availableRoom) {
      logger.warn('Lobby', 'No available room found');
      // Create a new room instead
      const result = await this.lobbyService.createRoom('快速遊戲', 4);
      if (result.success && result.roomId) {
        await this.enterRoom(result.roomId);
      }
      return;
    }

    await this.enterRoom(availableRoom.roomId);
  }

  private async enterRoom(roomId: string) {
    // Dispatch action
    this.store.dispatch({ type: 'SET_STATUS', payload: { status: 'searching' } });
    this.fsm.dispatch('START_SEARCH');

    // Use EnterRoomUseCase through service
    const result = await this.lobbyService.enterRoom(roomId);

    if (result.success) {
      this.store.dispatch({ type: 'SET_ROOM_ID', payload: { roomId } });
      this.store.dispatch({ type: 'SET_STATUS', payload: { status: 'matched' } });
      this.fsm.dispatch('MATCHED');

      // Navigate to room
      setTimeout(() => {
        const router = appContext.get<SceneRouter>('router');
        if (router) {
          router.navigate({ scene: SceneRoute.Room, params: { roomId } });
        }
      }, 500);
    } else {
      logger.error('Lobby', `Failed to enter room: ${result.error}`);
      this.store.dispatch({ type: 'SET_STATUS', payload: { status: 'idle' } });
      this.fsm.dispatch('STOP_SEARCH');
    }
  }

  private onRoomItemClick(roomId: string) {
    logger.info('Lobby', `Room item clicked: ${roomId}`);
    this.enterRoom(roomId);
  }

  private render(state: LobbyState) {
    // Update status label
    if (this.statusLabel) {
      const statusText = state.isLoadingRooms 
        ? '載入中...' 
        : `狀態: ${state.status} | 房間數: ${state.roomList.length}`;
      this.statusLabel.string = statusText;
    }

    // Update room list
    this.renderRoomList(state.roomList);

    logger.debug('Lobby', 'State rendered', state);
  }

  private renderRoomList(rooms: RoomInfo[]) {
    if (!this.roomListContainer) {
      return;
    }

    // Clear existing room items
    this.roomListContainer.removeAllChildren();

    // Create room items
    rooms.forEach(room => {
      if (this.roomItemPrefab) {
        const roomItem = instantiate(this.roomItemPrefab);
        this.setupRoomItem(roomItem, room);
        this.roomListContainer.addChild(roomItem);
      } else if (this.roomListLabel) {
        // Fallback: use label if prefab not available
        const roomText = `${room.name} (${room.playerCount}/${room.maxPlayers}) - ${room.status}`;
        const label = instantiate(this.roomListLabel);
        label.getComponent(Label)!.string = roomText;
        this.roomListContainer.addChild(label);
      }
    });

    // If no rooms, show message
    if (rooms.length === 0 && this.roomListLabel) {
      const emptyLabel = instantiate(this.roomListLabel);
      emptyLabel.getComponent(Label)!.string = '目前沒有可用房間';
      this.roomListContainer.addChild(emptyLabel);
    }
  }

  private setupRoomItem(node: Node, room: RoomInfo) {
    // Setup room item UI
    // This assumes the prefab has a Button component and Label components
    const button = node.getComponent(Button);
    if (button) {
      button.node.on(Button.EventType.CLICK, () => {
        this.onRoomItemClick(room.roomId);
      });
    }

    // Update labels in the room item
    const labels = node.getComponentsInChildren(Label);
    labels.forEach((label, index) => {
      switch (index) {
        case 0:
          label.string = room.name;
          break;
        case 1:
          label.string = `${room.playerCount}/${room.maxPlayers}`;
          break;
        case 2:
          label.string = room.status === 'waiting' ? '等待中' : 
                        room.status === 'playing' ? '遊戲中' : '已結束';
          break;
      }
    });
  }
}

