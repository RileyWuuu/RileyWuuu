# 專案結構文件

## 完整檔案列表

### 配置檔案
- `tsconfig.json` - TypeScript 配置
- `project.json` - Cocos Creator 專案配置

### 核心模組 (core/)
- `Boot.ts` - 應用啟動入口，處理認證並跳轉到 Lobby

### 共享模組 (shared/)

#### types/
- `index.ts` - 核心類型定義（Intent, Event, Snapshot, NetworkMessage）

#### logger/
- `index.ts` - 日誌系統，帶 ring-buffer 實現

#### fsm/
- `index.ts` - 狀態機實現（State Machine）

#### store/
- `index.ts` - 狀態管理 Store（支援 middleware）

#### network/
- `transport.ts` - WebSocket Transport 抽象層
  - 支援重連、心跳
  - Intent 上行（帶 seq）
  - Event 下行（帶 seq）
  - Snapshot 重連對齊（seq/ack）
- `index.ts` - 網路模組匯出

#### ui/
- `DebugOverlay.ts` - 調試覆蓋層，顯示最近 N 筆日誌

### 功能模組 (features/)

#### auth/
- `types.ts` - 認證相關類型
- `service.ts` - 認證服務（mock 實現）

#### lobby/
- `types.ts` - 大廳狀態和動作類型
- `reducer.ts` - Store reducer
- `service.ts` - 大廳服務
- `fsm.ts` - 大廳狀態機配置
- `LobbyController.ts` - UI 控制器（只負責 render 和 dispatch）

#### matchmaking/
- `types.ts` - 匹配相關類型
- `service.ts` - 匹配服務（mock 實現）

#### room/
- `types.ts` - 房間相關類型（RoomState, PlayTileIntent, RoomEvent, RoomSnapshot）
- `service.ts` - 房間服務，整合 ECS 和網路
- `components.ts` - ECS 組件定義
- `systems.ts` - ECS 系統實現
- `RoomController.ts` - UI 控制器（只負責 render 和 dispatch）
- `ecs/`
  - `types.ts` - ECS 類型定義
  - `world.ts` - ECS World 實現
  - `index.ts` - ECS 模組匯出

#### results/
- `types.ts` - 結果相關類型
- `service.ts` - 結果服務

## 架構說明

### 1. Network Layer
- **WebSocketTransport**: 完整的 WebSocket 抽象層
  - 自動重連機制
  - 心跳保活
  - seq/ack 序列號管理
  - Intent 上行和 Event 下行
  - Snapshot 支援

### 2. State Management
- **Lobby**: FSM + Store 雙重管理
  - FSM 管理狀態流轉（idle → searching → matched）
  - Store 管理狀態數據
  - UI 層訂閱 Store 變化並渲染

### 3. Room ECS-lite
- **World**: 實體世界，管理所有實體和系統
- **Entity**: 實體，包含多個組件
- **Component**: 純數據組件
- **System**: 邏輯系統，在 update 中處理組件

### 4. Logger
- Ring-buffer 實現，保留最近 N 條日誌
- 支援分類和級別（debug, info, warn, error）
- Debug overlay 可顯示日誌

## 流程說明

### Boot → Lobby → Room

1. **Boot 場景**
   - 執行認證（mock）
   - 成功後跳轉到 Lobby

2. **Lobby 場景**
   - 使用 FSM 管理狀態
   - 使用 Store 管理數據
   - 點擊 EnterRoom 按鈕
   - 調用 LobbyService.enterRoom()
   - 成功後跳轉到 Room

3. **Room 場景**
   - 初始化 RoomService（包含 ECS World）
   - 連接 WebSocket Transport
   - 顯示 mock 遊戲狀態
   - 可以發送 PlayTileIntent
   - 接收並處理 RoomEvent

## 使用方式

### 場景設置

1. **Boot 場景**
   - 在場景根節點添加 `Boot` 組件

2. **Lobby 場景**
   - 添加 `LobbyController` 組件
   - 綁定 UI 元素：
     - `enterRoomButton`: Button
     - `statusLabel`: Label

3. **Room 場景**
   - 添加 `RoomController` 組件
   - 綁定 UI 元素：
     - `playTileButton`: Button
     - `roomIdLabel`: Label
     - `statusLabel`: Label
     - `playerInfoLabel`: Label
     - `eventLogLabel`: Label

### 調試

- 在任意場景添加 `DebugOverlay` 組件
- 綁定 `logLabel` 和 `toggleButton`
- 點擊按鈕切換日誌顯示

## 注意事項

- 所有檔案都是可編譯的最小實現，無 TODO 或 placeholder
- UI 層只負責 render 和 dispatch，不承載業務規則
- 業務邏輯在 Service 層
- Room 使用 ECS-lite 架構，便於擴展遊戲邏輯
- Network 層支援完整的重連和狀態對齊機制
