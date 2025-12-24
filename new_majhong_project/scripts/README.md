# 架構守衛腳本

## arch-guard.ts

自動檢查專案中的架構違規行為，確保：
- 禁止從其他 feature 直接 import 內部文件（usecases/repo/reducer/ecs/replay）
- 只能通過 feature 的 `index.ts` 導入

## 使用方法

```bash
# 使用 ts-node 運行
npx ts-node scripts/arch-guard.ts

# 或使用 npm script
npm run arch-guard
```

## 集成到 CI/CD

在 CI/CD 流程中添加：

```yaml
# GitHub Actions 範例
- name: Check Architecture
  run: npm run arch-guard
```

## 檢查規則

腳本會檢查以下違規模式：
- `from '@features/*/usecases/**'`
- `from '@features/*/repo/**'`
- `from '@features/*/reducer.ts'`
- `from '@features/*/ecs/**'`
- `from '@features/*/replay/**'`
- 相對路徑的類似模式

## 正確的導入方式

```typescript
// ✅ 正確
import { LobbyService } from '@features/lobby';
import { RoomService } from '@features/room';

// ❌ 錯誤
import { FetchRoomListUseCase } from '@features/lobby/usecases/FetchRoomListUseCase';
import { LobbyRepository } from '@features/lobby/repo/LobbyRepository';
```

