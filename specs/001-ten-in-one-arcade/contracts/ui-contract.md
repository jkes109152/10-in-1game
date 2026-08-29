# UI 契約：單頁遊戲大廳

## 固定元素

- `header.site-header`：品牌標記、網站名稱與本機紀錄摘要。
- `main#top`：頁面主要內容與首頁錨點。
- `section.hero`：短標題、說明、`#start-featured` 與 `#scroll-games`。
- `section#games`：十張 `[data-game-id]` 遊戲卡。
- `div#game-panel`：使用 `hidden` 控制、具 `role="dialog"` 與 `aria-modal="true"` 的共用遊戲面板。
- `div#game-stage`：當前遊戲注入區；不得依賴固定遊戲路由。
- `div#game-result`：結束訊息與 `#restart-game`。

## 互動契約

1. 以滑鼠、觸控或鍵盤啟用 `[data-game-id]` 或 `#start-featured` 時呼叫 `openGame(gameId)`。
2. 開啟遊戲時設定 `#game-panel.hidden = false`、加入 `body.is-modal-open`，將背景 header／main 設為 `inert`，並將焦點移到面板標題。
3. 點擊 `#close-game` 執行當前 session cleanup，清空 `#game-stage`，隱藏面板並將焦點送回觸發卡片。
4. 遊戲結束時由 `finishGame()` 填入結果文案、更新最佳紀錄與統計，並顯示 `#game-result`。
5. 所有 `button` 必須有可見文字或 `aria-label`，並由原生 `click` 接受滑鼠、觸控及 Enter／Space；僅用顏色表達狀態時，需同時有文字或圖示。
6. 關閉遊戲時解除背景 `inert`，確保焦點回復後可繼續操作大廳。

## 響應式契約

- 360px 以上：遊戲大廳不產生不必要的水平捲軸。
- 720px 以下：主版面改為單欄，遊戲面板與卡片 padding 收斂，操作按鈕維持可點擊大小。
- `prefers-reduced-motion: reduce`：停用卡片浮動、背景漂移與面板入場動畫。
