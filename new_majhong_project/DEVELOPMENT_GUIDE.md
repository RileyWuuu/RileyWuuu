# 開發指南：大廳與麻將遊戲實現

## 🎯 開發順序建議

### 階段一：大廳基礎功能（優先）

#### 1. 完善大廳 UI 場景
- [ ] 在 Cocos Creator 中創建 `Lobby` 場景
- [ ] 添加 UI 元素：
  - 進入房間按鈕（已綁定 `enterRoomButton`）
  - 狀態顯示標籤（已綁定 `statusLabel`）
  - 玩家數量顯示
  - 房間列表（可選）

#### 2. 擴展 LobbyService
**檔案：`assets/features/lobby/service.ts`**

需要實現：
- [ ] 連接網路 Transport
- [ ] 處理大廳相關的 Event（如玩家加入/離開）
- [ ] 房間列表查詢
- [ ] 快速匹配功能

#### 3. 完善 LobbyController
**檔案：`assets/features/lobby/LobbyController.ts`**

需要添加：
- [ ] 更多 UI 元素綁定
- [ ] 房間列表渲染
- [ ] 匹配進度顯示
- [ ] 錯誤處理和提示

---

### 階段二：房間基礎功能

#### 1. 完善房間 UI 場景
- [ ] 在 Cocos Creator 中創建 `Room` 場景
- [ ] 添加 UI 元素：
  - 房間 ID 顯示（已綁定 `roomIdLabel`）
  - 遊戲狀態顯示（已綁定 `statusLabel`）
  - 玩家資訊顯示（已綁定 `playerInfoLabel`）
  - 事件日誌顯示（已綁定 `eventLogLabel`）
  - **新增：手牌顯示區域**
  - **新增：出牌按鈕（已綁定 `playTileButton`）**
  - **新增：其他玩家資訊顯示**

#### 2. 擴展 RoomService
**檔案：`assets/features/room/service.ts`**

需要實現：
- [ ] 完整的遊戲狀態管理
- [ ] 手牌管理（發牌、摸牌、出牌）
- [ ] 回合管理（輪到誰）
- [ ] 遊戲規則邏輯（可放在 ECS Systems 中）

#### 3. 完善 ECS Systems
**檔案：`assets/features/room/systems.ts`**

需要實現：
- [ ] `GameStateSystem`：管理遊戲階段（等待、進行中、結束）
- [ ] `PlayerSystem`：管理玩家狀態和操作
- [ ] `TileSystem`：管理牌的操作（發牌、摸牌、出牌）
- [ ] `TurnSystem`：管理回合輪轉

#### 4. 擴展 RoomController
**檔案：`assets/features/room/RoomController.ts`**

需要添加：
- [ ] 手牌 UI 渲染（顯示玩家手牌）
- [ ] 出牌 UI 交互（選擇牌並出牌）
- [ ] 其他玩家資訊顯示
- [ ] 遊戲狀態視覺化

---

### 階段三：麻將遊戲核心邏輯

#### 1. 麻將牌型定義
**新建檔案：`assets/features/room/tiles.ts`**

```typescript
// 定義完整的麻將牌型
export const TILE_TYPES = {
  // 萬子、條子、筒子
  // 風牌、箭牌
  // 花牌（可選）
}
```

#### 2. 遊戲規則系統
**新建檔案：`assets/features/room/rules.ts`**

需要實現：
- [ ] 發牌邏輯（每人 13 張，莊家 14 張）
- [ ] 摸牌邏輯
- [ ] 出牌邏輯
- [ ] 吃、碰、槓邏輯
- [ ] 胡牌判斷（可後續實現）

#### 3. 擴展 RoomState
**檔案：`assets/features/room/types.ts`**

需要添加：
- [ ] 牌堆狀態（剩餘牌數）
- [ ] 玩家手牌詳細資訊
- [ ] 已出的牌
- [ ] 吃碰槓記錄

---

## 🚀 快速開始步驟

### 第一步：設置場景

1. **創建 Lobby 場景**
   ```
   1. 在 Cocos Creator 中創建新場景 "Lobby"
   2. 創建 Canvas 根節點
   3. 添加一個空節點，命名為 "LobbyController"
   4. 將 LobbyController 組件添加到該節點
   5. 創建 UI 元素並綁定到組件屬性
   ```

2. **創建 Room 場景**
   ```
   1. 創建新場景 "Room"
   2. 創建 Canvas 根節點
   3. 添加一個空節點，命名為 "RoomController"
   4. 將 RoomController 組件添加到該節點
   5. 創建 UI 元素並綁定到組件屬性
   ```

### 第二步：擴展 LobbyService

**優先實現的功能：**
- 連接網路（如果已有後端）
- 處理房間進入邏輯
- 處理匹配邏輯

### 第三步：擴展 RoomService

**優先實現的功能：**
- 初始化遊戲狀態（發牌）
- 處理出牌 Intent
- 處理回合輪轉

### 第四步：實現 UI 渲染

**優先實現的 UI：**
- 手牌顯示（玩家自己的牌）
- 出牌按鈕和交互
- 遊戲狀態顯示

---

## 📝 建議的實現順序

### 最小可行版本（MVP）

1. ✅ **大廳場景可顯示**
   - 狀態標籤顯示
   - 進入房間按鈕可用

2. ✅ **房間場景可顯示**
   - 顯示房間 ID
   - 顯示玩家資訊
   - 顯示遊戲狀態

3. ✅ **基本遊戲流程**
   - 進入房間後初始化遊戲
   - 顯示手牌（mock 數據）
   - 可以點擊出牌按鈕（發送 Intent）

4. ✅ **網路連接**
   - 連接 WebSocket（如果已有後端）
   - 接收 Event 並更新狀態

### 完整版本

5. ⬜ **完整遊戲邏輯**
   - 發牌、摸牌、出牌
   - 回合管理
   - 吃碰槓
   - 胡牌判斷

6. ⬜ **完整 UI**
   - 手牌視覺化
   - 出牌動畫
   - 其他玩家資訊
   - 遊戲結果顯示

---

## 🔧 關鍵檔案位置

### 大廳相關
- `assets/features/lobby/LobbyController.ts` - UI 控制器
- `assets/features/lobby/service.ts` - 業務邏輯
- `assets/features/lobby/types.ts` - 類型定義
- `assets/features/lobby/reducer.ts` - Store reducer
- `assets/features/lobby/fsm.ts` - 狀態機配置

### 房間相關
- `assets/features/room/RoomController.ts` - UI 控制器
- `assets/features/room/service.ts` - 業務邏輯
- `assets/features/room/types.ts` - 類型定義
- `assets/features/room/components.ts` - ECS 組件
- `assets/features/room/systems.ts` - ECS 系統
- `assets/features/room/ecs/` - ECS 核心

### 共享模組
- `assets/shared/network/transport.ts` - 網路傳輸
- `assets/shared/store/index.ts` - 狀態管理
- `assets/shared/fsm/index.ts` - 狀態機
- `assets/shared/logger/index.ts` - 日誌系統

---

## 💡 開發建議

1. **先做 UI，再做邏輯**
   - 先讓場景可以顯示，再完善功能
   - 使用 mock 數據測試 UI

2. **逐步擴展功能**
   - 先實現最基本的流程（進入房間 → 顯示狀態 → 出牌）
   - 再逐步添加複雜功能（吃碰槓、胡牌）

3. **善用 ECS 架構**
   - 遊戲邏輯放在 Systems 中
   - 數據放在 Components 中
   - 這樣便於擴展和維護

4. **測試網路連接**
   - 如果還沒有後端，可以先 mock 網路事件
   - 使用 logger 查看網路消息

---

## 🎮 下一步行動

**建議從這裡開始：**

1. **創建 Lobby 場景並設置 UI**
   - 這是最直觀的開始點
   - 可以立即看到效果

2. **擴展 LobbyService.enterRoom()**
   - 實現實際的房間進入邏輯
   - 連接網路 Transport（如果有的話）

3. **完善 RoomController 的 render()**
   - 添加手牌顯示邏輯
   - 添加更多 UI 元素

4. **實現基本的出牌功能**
   - 在 RoomService 中處理出牌
   - 更新遊戲狀態
   - 在 UI 中反映變化

需要我幫你實現哪個部分？我可以：
- 擴展 LobbyService 的具體功能
- 實現 RoomService 的遊戲邏輯
- 創建麻將牌型定義
- 實現 ECS Systems 的具體邏輯
- 或其他你需要的部分

