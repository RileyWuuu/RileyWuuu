# 麻將遊戲專案骨架

基於 Cocos Creator 3.8.x + TypeScript 的麻將遊戲專案架構。

## 專案結構

```
assets/
├── core/                              # 核心應用層
│   ├── Boot.ts                        # 應用入口點
│   ├── AppContext.ts                  # 應用上下文（全局狀態與服務）
│   ├── SceneRouter.ts                 # 場景路由（統一場景切換）
│   └── RouteDefs.ts                   # 路由定義
├── domain/                            # 領域層（純業務邏輯，無 Cocos 依賴）
│   └── mahjong/
│       ├── Tile.ts                    # 麻將牌模型
│       ├── Player.ts                  # 玩家模型
│       ├── GameState.ts               # 遊戲狀態模型
│       ├── Rules.ts                   # 麻將規則
│       └── index.ts
├── shared/                            # 共享模組
│   ├── fsm/                           # 狀態機
│   │   └── index.ts
│   ├── store/                         # 狀態管理
│   │   └── index.ts
│   ├── network/                       # 網路層
│   │   ├── Messages.ts                # Intent/Event/Snapshot 定義
│   │   ├── Protocol.ts                # 消息序列化/反序列化
│   │   ├── Sequence.ts                # 序列號管理
│   │   ├── WsTransport.ts             # WebSocket 傳輸實現
│   │   └── index.ts
│   ├── logger/                        # 日誌系統（ring-buffer）
│   │   └── index.ts
│   ├── types/                         # 共享類型定義
│   │   ├── index.ts
│   │   └── ReplayTypes.ts             # 回放類型定義
│   └── ui/
│       └── DebugOverlay.ts            # 調試覆蓋層
└── features/                          # 功能模組
    ├── auth/                          # 驗證模組
    │   ├── types.ts
    │   └── service.ts                 # Facade
    ├── lobby/                         # 大廳模組
    │   ├── types.ts
    │   ├── reducer.ts                 # Store reducer
    │   ├── fsm.ts                      # 狀態機配置
    │   ├── service.ts                 # Facade
    │   ├── LobbyController.ts         # UI 控制器
    │   ├── repo/                      # 資料存取層
    │   │   └── LobbyRepository.ts
    │   └── usecases/                  # 用例層
    │       ├── FetchRoomListUseCase.ts
    │       ├── CreateRoomUseCase.ts
    │       └── EnterRoomUseCase.ts
    ├── matchmaking/                   # 匹配模組
    │   ├── types.ts
    │   └── service.ts                 # Facade
    ├── room/                          # 房間模組（ECS-lite）
    │   ├── types.ts
    │   ├── service.ts                 # Facade
    │   ├── RoomController.ts          # UI 控制器
    │   ├── ecs/                       # ECS 架構
    │   │   ├── types.ts
    │   │   ├── world.ts
    │   │   ├── entity.ts              # 實體工廠
    │   │   ├── index.ts
    │   │   ├── components/            # 組件定義
    │   │   │   ├── PlayerComponent.ts
    │   │   │   ├── TileComponent.ts
    │   │   │   ├── GameStateComponent.ts
    │   │   │   └── index.ts
    │   │   └── systems/               # 系統實現
    │   │       ├── GameStateSystem.ts
    │   │       ├── PlayerSystem.ts
    │   │       ├── TileSystem.ts
    │   │       └── index.ts
    │   └── replay/                    # 回放功能
    │       └── ReplayRunner.ts
    └── results/                       # 結果模組
        ├── types.ts
        └── service.ts                 # Facade
```

## 架構說明

### 1. 核心層 (core/)
- **AppContext**: 應用上下文，管理全局狀態和服務
- **SceneRouter**: 統一場景路由，所有場景切換必須通過 SceneRouter
- **RouteDefs**: 路由定義和參數類型

### 2. 領域層 (domain/)
- **mahjong/**: 麻將領域模型和規則
  - 純業務邏輯，不依賴 Cocos Node/API
  - 可獨立測試和重用
  - 包含：Tile、Player、GameState、Rules

### 3. 網路層 (shared/network)
- **Messages.ts**: Intent/Event/Snapshot 聯合類型定義（唯一定義處）
- **Protocol.ts**: 消息序列化/反序列化
- **Sequence.ts**: 序列號管理（seq/ack）
- **WsTransport.ts**: WebSocket 傳輸實現
  - 支援自動重連
  - 心跳機制
  - Intent 上行（帶 seq）
  - Event 下行（帶 seq）
  - Snapshot 重連對齊（seq/ack）

### 4. 功能模組 (features/)
每個功能模組採用以下結構：
- **service.ts**: Facade 層，對外提供統一接口
- **repo/**: 資料存取層，封裝資料來源（網路、本地存儲等）
- **usecases/**: 用例層，實現具體業務流程
- **Controller.ts**: UI 控制器，只負責 render 和 dispatch，不包含規則決策

### 5. Room ECS-lite
- **components/**: 組件定義（資料）
- **systems/**: 系統實現（邏輯）
- **entity.ts**: 實體工廠
- **world.ts**: 世界管理

### 6. 回放功能
- **ReplayTypes.ts**: 回放類型定義
- **ReplayRunner.ts**: 回放執行器（最小可編譯實現）

## 責任邊界

### UI Controller
- ✅ 只負責 render（根據 state 渲染 UI）
- ✅ 只負責 dispatch（發送 action/intent）
- ❌ 不包含規則決策
- ❌ 不包含業務邏輯

### Service (Facade)
- ✅ 提供統一對外接口
- ✅ 協調 usecases 和 repo
- ✅ 管理模組狀態
- ❌ 不包含具體業務邏輯（在 usecases 中）

### UseCase
- ✅ 實現具體業務流程
- ✅ 調用 repository 獲取資料
- ✅ 業務規則驗證
- ❌ 不直接操作 UI

### Repository
- ✅ 封裝資料存取
- ✅ 處理資料轉換
- ❌ 不包含業務邏輯

### Domain
- ✅ 純業務邏輯
- ✅ 不依賴框架（Cocos、網路等）
- ✅ 可獨立測試

## 流程

### Boot → Lobby → Room

1. **Boot**: 
   - 初始化 AppContext
   - 執行認證
   - 通過 SceneRouter 跳轉到 Lobby

2. **Lobby**: 
   - 使用 FSM 管理狀態（idle → searching → matched）
   - 使用 Store 管理數據
   - Service 協調 UseCase 和 Repository
   - 點擊 EnterRoom 按鈕，通過 SceneRouter 進入房間

3. **Room**:
   - 使用 ECS-lite 管理遊戲狀態
   - Service 協調 UseCase 和 Repository
   - 顯示 mock 狀態
   - 可以發送 PlayTileIntent（定義在 Messages.ts）

## 使用說明

### 場景設置

1. **Boot 場景**:
   - 添加 `Boot` 組件到場景根節點

2. **Lobby 場景**:
   - 添加 `LobbyController` 組件
   - 綁定 UI 元素

3. **Room 場景**:
   - 添加 `RoomController` 組件
   - 綁定 UI 元素
   - 可選：添加 `DebugOverlay` 組件查看日誌和網路事件

### 場景切換

所有場景切換必須通過 SceneRouter：

```typescript
import { appContext } from '@core/AppContext';
import { SceneRouter } from '@core/SceneRouter';
import { SceneRoute } from '@core/RouteDefs';

// 通過 AppContext（推薦）
const router = appContext.get<SceneRouter>('router');
router?.navigate({ scene: SceneRoute.Room, params: { roomId: 'room_001' } });
```

### DebugOverlay 使用

在場景中添加 `DebugOverlay` 組件：
- 綁定 `logLabel` - 顯示應用日誌
- 綁定 `networkLogLabel` - 顯示網路事件日誌
- 綁定 `categoryFilterInput` - 日誌分類篩選
- 綁定 `toggleButton` - 切換顯示/隱藏

在 RoomController 中設置 NetworkClient：
```typescript
const debugOverlay = this.node.getComponentInChildren('DebugOverlay');
if (debugOverlay && this.networkClient) {
  debugOverlay.setNetworkClient(this.networkClient);
}
```

### 類型定義

- **Intent**: 定義在 `shared/network/Messages.ts`
- **Event**: 定義在 `shared/network/Messages.ts`
- **Snapshot**: 定義在 `shared/network/Messages.ts`

## 注意事項

- ✅ UI Controller 只負責 render 和 dispatch，不處理遊戲規則
- ✅ 所有業務邏輯在 UseCase 層
- ✅ Service 僅作為 Facade，避免變成巨型檔案
- ✅ Room 使用 ECS-lite 架構，便於擴展
- ✅ Network 層支援完整的重連和狀態對齊機制
- ✅ Domain 層不依賴 Cocos，可獨立測試
- ✅ 場景切換統一通過 SceneRouter
- ✅ AppContext 僅作為 Service Registry，不承載業務狀態
- ✅ Feature 間只能通過 index.ts 導入，禁止直接導入內部文件
- ✅ 網路消息使用統一 envelope 結構（seq/ack）
- ✅ ECS World 固定 tick 順序：Server Events → Simulation → Animation → UI Projection

## Deterministic 要求

### Domain 層確定性

**重要原則：Domain 層必須是確定性的**

Domain 層（`domain/mahjong/*`）的業務邏輯必須滿足確定性要求：

✅ **允許的做法：**
- 使用注入的隨機數生成器（seed-based）
- 使用注入的時間源（用於測試）
- 純函數計算
- 基於輸入的確定性邏輯

❌ **禁止的做法：**
- 直接調用 `Math.random()` 或 `Date.now()`
- 使用全局隨機狀態
- 依賴系統時間（除非通過依賴注入）

**實現方式：**
```typescript
// ✅ 正確：注入隨機數生成器
class GameRules {
  constructor(private rng: () => number) {}
  
  shuffleTiles(tiles: Tile[]): Tile[] {
    // 使用注入的 rng
  }
}

// ❌ 錯誤：直接使用 Math.random()
shuffleTiles(tiles: Tile[]): Tile[] {
  return tiles.sort(() => Math.random() - 0.5); // 非確定性
}
```

**原因：**
- 確保回放功能的正確性
- 支持斷點重現和調試
- 保證服務端和客戶端邏輯一致性
- 便於單元測試

## Non-goals

### 回放功能範圍

**重要說明：Replay ≠ Video**

本專案的回放功能（Replay）設計目標：

✅ **包含的功能：**
- 遊戲事件序列的重放
- 遊戲狀態的重現
- 基於事件流的邏輯回放
- 用於調試和分析的狀態快照

❌ **不包含的功能：**
- 視頻錄製和播放
- 視覺動畫的錄製
- 音頻錄製
- 完整的視覺回放（僅重現邏輯狀態）

**設計理念：**
- Replay 系統專注於**邏輯狀態**的重現，而非視覺表現
- 回放數據包含事件序列和狀態快照，用於重新執行遊戲邏輯
- 視覺表現由 UI 層根據重現的狀態重新渲染
- 這使得回放數據更小、更易於存儲和傳輸

## 架構硬化

### 1. AppContext - Service Registry

AppContext 僅作為服務註冊表，不承載業務狀態：

```typescript
// 註冊服務
appContext.register('router', SceneRouter.getInstance());
appContext.register('logger', logger);

// 獲取服務
const router = appContext.get<SceneRouter>('router');
```

### 2. Feature 封裝邊界

每個 feature 提供 `index.ts` 作為唯一公共 API：

```typescript
// ✅ 正確：從 index.ts 導入
import { LobbyService } from '../features/lobby';

// ❌ 錯誤：直接導入內部文件
import { FetchRoomListUseCase } from '../features/lobby/usecases/FetchRoomListUseCase';
```

### 3. 網路協議固定

- **Messages.ts**: 定義統一 envelope（Intent/Event/Snapshot）含 seq/ack
- **Protocol.ts**: encode/decode envelope
- **Sequence.ts**: 管理本地 lastAck/nextSeq

### 4. ECS 固定 Tick 順序

World.update() 固定執行順序：
1. **Server Events**: 應用伺服器事件
2. **Simulation**: 遊戲邏輯模擬系統
3. **Animation**: 動畫/插值系統
4. **UI Projection**: UI 狀態投影系統

### 5. Logger 增強

- 支援 category + level + enable flag
- DebugOverlay 支援 category 篩選
- DebugOverlay 顯示最近 N 筆 network/event log

### 6. NetworkClient 集中處理

- `sendIntent()` 自動封裝 envelope + seq
- `handleIncoming()` decode + ack + event dispatch
- `setSnapshotStrategy()` 統一 snapshot 應用策略
- 內建 network log 用於調試

### 7. ECS World 固化 Pipeline

- `applyServerEvents()` - 應用伺服器事件
- `runSimulation()` - 運行模擬系統
- `runAnimation()` - 運行動畫系統
- `projectUi()` - UI 狀態投影
- `update()` 僅調用這四個階段，確保執行順序固定

### 8. 架構守衛（Architecture Guard）

- `scripts/arch-guard.ts` 自動檢查導入規則
- 禁止從其他 feature 直接 import 內部文件
- 只能通過 feature 的 `index.ts` 導入
- 可集成到 CI/CD 流程中

**使用方法：**
```bash
# 運行架構檢查
npm run arch-guard

# 或使用 ESLint（如果已安裝）
npm run lint
```

### 9. Path Alias

TypeScript 路徑別名配置：
- `@core/*` → `assets/core/*`
- `@shared/*` → `assets/shared/*`
- `@domain/*` → `assets/domain/*`
- `@features/*` → `assets/features/*`

**使用範例：**
```typescript
import { SceneRouter } from '@core/SceneRouter';
import { logger } from '@shared/logger';
import { Tile } from '@domain/mahjong';
import { LobbyService } from '@features/lobby';
```

## Guardrails（架構守衛）

### 自動檢查工具

專案提供自動化工具確保架構規範：

#### 1. TypeScript Path Alias

在 `tsconfig.json` 中配置：
- `@core/*` → `assets/core/*`
- `@shared/*` → `assets/shared/*`
- `@domain/*` → `assets/domain/*`
- `@features/*` → `assets/features/*`

#### 2. 架構守衛腳本

運行 `npm run arch-guard` 檢查：
- 禁止跨 feature 直接導入內部文件
- 只能通過 feature 的 `index.ts` 導入

#### 3. ESLint 規則

`.eslintrc.json` 配置了 `no-restricted-imports` 規則，自動檢查違規導入。

### 強制規範

1. **Feature 封裝**：只能通過 `index.ts` 導入
2. **NetworkClient**：所有網路操作必須通過 NetworkClient
3. **ECS Pipeline**：World.update() 固定調用四個階段
4. **Deterministic**：Domain 層必須是確定性的

## 重構目標

本次重構旨在：
1. 降低長期維護風險
2. 避免 service.ts 變成巨型檔案
3. 明確責任邊界
4. 提高代碼可測試性
5. 支援回放功能擴展
6. 固定協議與執行順序
7. 封裝邊界，降低技術債
8. 提供可執行的架構守衛
