# 資料模型

## 1. GameDefinition

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | `string` | 穩定遊戲識別字串，用於卡片、面板與分數 key |
| `name` | `string` | 繁體中文遊戲名稱 |
| `tagline` | `string` | 一句話操作提示 |
| `icon` | `string` | Emoji 圖示，非必要資訊仍由文字補足 |
| `accent` | `string` | CSS 顏色 token 名稱 |
| `meta` | `string` | 回合、難度或操作摘要 |

## 2. PlayerStats

```json
{
  "completed": 0,
  "bestScores": {
    "reaction": 0,
    "memory": 0,
    "snake": 0,
    "mines": 0,
    "merge": 0,
    "whack": 0,
    "color": 0,
    "tictactoe": 0,
    "stack": 0,
    "number": 0
  },
  "lastPlayedAt": null
}
```

- `completed`：完成或結束一局後加一，不代表勝利。
- `bestScores`：各遊戲只保留數值最高紀錄；反應遊戲以較低毫秒數作為最佳，因此由該遊戲自行以 `min` 更新。
- `lastPlayedAt`：ISO 8601 字串或 `null`，僅用於本機資料完整性，不在介面暴露隱私資訊。
- 載入時只接受非負安全整數的 `completed`、非負有限數值的已知遊戲分數，以及字串型別的 `lastPlayedAt`；其他欄位、未知遊戲 key 與錯誤型別一律正規化為預設值。

儲存 key：`arcade-10-best-scores`。

## 3. GameSession

共用面板每次開啟建立一個短生命週期 session：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `gameId` | `string` | 對應 `GameDefinition.id` |
| `status` | `idle \| playing \| won \| lost \| done` | 當前遊戲狀態 |
| `score` | `number` | 本局主要分數；反應遊戲可用毫秒數呈現 |
| `startedAt` | `number \| null` | `performance.now()` 時間戳 |
| `cleanup` | `Set<Function>` | 計時器與事件訂閱清理函式集合，不序列化；關閉、重玩或換遊戲時全部取消 |

## 4. MinesCell

```json
{
  "mine": false,
  "revealed": false,
  "flagged": false,
  "nearby": 0
}
```

5×5 固定格，地雷數 5。`nearby` 由相鄰八格計算；只在 `revealed` 為 true 時顯示。
