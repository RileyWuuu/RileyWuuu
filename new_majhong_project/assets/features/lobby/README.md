# Lobby 模組 - 房間列表功能

## 功能概述

LobbyService 現在支援完整的房間列表功能，包括：
- 獲取房間列表
- 自動刷新房間列表
- 創建房間
- 進入房間
- 監聽房間變化（新增、更新、刪除）

## 使用方式

### 1. 基本使用

```typescript
import { LobbyService } from './service';
import { WebSocketTransport } from '../../shared/network/transport';

// 創建服務實例
const lobbyService = new LobbyService();

// 連接網路（可選，如果沒有網路會使用 mock 數據）
const transport = new WebSocketTransport({
  url: 'ws://localhost:8080'
});
lobbyService.connect(transport);

// 獲取房間列表
const rooms = await lobbyService.fetchRoomList();

// 開始自動刷新（每 10 秒）
lobbyService.startRoomListUpdates(10000);

// 停止自動刷新
lobbyService.stopRoomListUpdates();
```

### 2. 在 LobbyController 中使用

LobbyController 已經整合了房間列表功能：

```typescript
// 在 Cocos Creator 中設置：
// 1. 綁定 refreshRoomListButton - 刷新按鈕
// 2. 綁定 createRoomButton - 創建房間按鈕
// 3. 綁定 roomListScrollView - 房間列表滾動視圖
// 4. 綁定 roomListContainer - 房間列表容器節點
// 5. 綁定 roomItemPrefab - 房間項目的 Prefab（可選）
```

### 3. 監聽房間列表更新

```typescript
const unsubscribe = lobbyService.onRoomListUpdate((rooms) => {
  console.log('房間列表更新:', rooms);
  // 更新 UI
});

// 取消訂閱
unsubscribe();
```

### 4. 創建房間

```typescript
const result = await lobbyService.createRoom('我的房間', 4);
if (result.success) {
  console.log('房間創建成功:', result.roomId);
}
```

### 5. 進入房間

```typescript
const result = await lobbyService.enterRoom('room_001');
if (result.success) {
  // 進入成功，可以跳轉到房間場景
} else {
  console.error('進入失敗:', result.error);
}
```

## 類型定義

### RoomInfo

```typescript
interface RoomInfo {
  roomId: string;           // 房間 ID
  name: string;             // 房間名稱
  playerCount: number;      // 當前玩家數
  maxPlayers: number;       // 最大玩家數
  status: 'waiting' | 'playing' | 'finished';  // 房間狀態
  createdAt: number;        // 創建時間戳
  hostId?: string;          // 房主 ID（可選）
}
```

### LobbyState

```typescript
interface LobbyState {
  status: 'idle' | 'searching' | 'matched';
  players: number;
  roomId: string | null;
  roomList: RoomInfo[];           // 房間列表
  isLoadingRooms: boolean;        // 是否正在載入
  lastUpdateTime: number;         // 最後更新時間
}
```

## Store Actions

### SET_ROOM_LIST
設置完整的房間列表

```typescript
store.dispatch({
  type: 'SET_ROOM_LIST',
  payload: { roomList: rooms }
});
```

### ADD_ROOM
添加單個房間

```typescript
store.dispatch({
  type: 'ADD_ROOM',
  payload: { room }
});
```

### UPDATE_ROOM
更新房間資訊

```typescript
store.dispatch({
  type: 'UPDATE_ROOM',
  payload: {
    roomIdToUpdate: 'room_001',
    room: updatedRoom
  }
});
```

### REMOVE_ROOM
移除房間

```typescript
store.dispatch({
  type: 'REMOVE_ROOM',
  payload: { roomIdToRemove: 'room_001' }
});
```

### SET_LOADING_ROOMS
設置載入狀態

```typescript
store.dispatch({
  type: 'SET_LOADING_ROOMS',
  payload: { isLoadingRooms: true }
});
```

## 網路事件

如果連接了 WebSocket Transport，服務會自動監聽以下事件：

- `ROOM_LIST_UPDATED` - 房間列表更新
- `ROOM_ADDED` - 新增房間
- `ROOM_UPDATED` - 房間資訊更新
- `ROOM_REMOVED` - 房間移除

## Mock 數據

在開發階段，如果沒有連接網路，服務會使用 mock 數據：
- 4 個示例房間
- 不同的玩家數量和狀態
- 用於測試 UI 和流程

## 注意事項

1. **自動刷新**：建議在進入大廳時啟動自動刷新，離開時停止
2. **網路連接**：如果沒有網路連接，會使用 mock 數據，但功能仍然可用
3. **房間驗證**：進入房間前會檢查房間是否存在、是否已滿、狀態是否有效
4. **錯誤處理**：所有異步操作都包含錯誤處理，會返回 `{ success: boolean, error?: string }`

