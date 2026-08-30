# 研究紀錄

查證日期：2026-08-29（UTC）

## R1：Canvas 適合少量即時遊戲繪製

- 決策：使用原生 `<canvas>` 處理霓虹貪食蛇與完美堆疊的幾何繪製，並保留 HTML 文字狀態與按鈕作為操作與資訊層。
- 來源：[Canvas API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- 查證版本：MDN 頁面於 2026-08-12 更新；頁面標示 Canvas API 為廣泛可用的成熟 Web API。
- 採用理由：Canvas 原生支援 JavaScript 動畫與遊戲圖形，無需加入遊戲引擎；MDN 同時提醒 Canvas 僅是 bitmap 且內容不會自動暴露給輔助工具，因此本方案不把關鍵文案或唯一操作放在 Canvas 內。
- 替代方案：全 DOM 格子可避免 bitmap 無障礙限制，但對連續移動方塊的繪製較繁瑣；本次只讓 Canvas 負責小型、裝飾與幾何區域。
- 限制：Canvas 在放大時可能模糊，仍需在窄螢幕測試尺寸與文字層。

## R2：localStorage 適合裝置內的最佳分數

- 決策：將最佳分數與完成局數存於當前網站 origin 的 `localStorage`，不建立帳號或後端同步。
- 來源：[Window: localStorage property - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- 查證版本：MDN 頁面於 2026-07-28 更新；頁面說明資料可跨瀏覽器 session 保留。
- 採用理由：需求只要求同一瀏覽器的紀錄，localStorage 符合 scope 且零依賴。
- 替代方案：`sessionStorage` 不符合跨 session；後端資料庫超出本次範圍。
- 限制：使用者可能封鎖儲存，且 `file:` URL 的行為未定義，因此程式包住讀寫例外，並以 HTTP 靜態伺服器作為 quickstart 路徑。

## R3：Pointer Events 用於需要指標語意的自訂互動

- 決策：只有需要座標、壓力或按壓階段的自訂互動才直接使用 pointer 事件；鍵盤方向操作另保留 KeyboardEvent。
- 來源：[Pointer events - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- 查證版本：MDN 頁面於 2026-07-20 更新；頁面說明 pointer events 可統一滑鼠、觸控與筆輸入。
- 採用理由：Pointer Events 可在需要原始指標資訊時減少手機與桌面分支，並配合 `touch-action` 避免遊戲操作被瀏覽器手勢攔截。
- 替代方案：分開處理 mouse、touch、pointer 會增加重複事件與重複命中風險。
- 限制：特定裝置的部分 pointer 能力仍可能有支援差異；核心遊戲仍提供按鈕與鍵盤替代入口。

## R4：GitHub Actions 作為公開 repository 的檢查入口

- 決策：在 `.github/workflows/sdd-checks.yml` 以 Pull request 與 push main 觸發 Node.js 檢查。
- 來源：[Understanding GitHub Actions - GitHub Docs](https://docs.github.com/en/actions/get-started/understand-github-actions)
- 查證日期：2026-08-29；官方文件說明 workflow 以 YAML 存在 repository 的 `.github/workflows`，可在 PR 與 push 等事件觸發。
- 採用理由：repository 為公開且目前沒有建置伺服器；短期 runner 足以執行語法、規則與靜態驗收。
- 替代方案：不設定 CI 會讓品質檢查只存在本地；自行架伺服器超出需求。
- 限制：Actions 只驗證程式，不取代瀏覽器上的人工操作與視覺確認。

## R5：原生按鈕使用 click 保留跨裝置啟用語意

- 決策：反應目標、棋盤格、方向鍵與放置控制只要是原生 `<button>`，就以 `click` 執行遊戲動作，不直接以 `pointerdown` 取代。
- 來源：[Element: click event - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)、[button element - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)、[Element: pointerdown event - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event)
- 查證日期：2026-08-29；MDN 說明 `click` 是裝置無關的啟用事件，原生按鈕可由滑鼠、鍵盤與觸控啟用，而 `pointerdown` 表示指標開始活動，並不等同鍵盤啟用。
- 採用理由：網站的遊戲格本身已使用語意化按鈕，沿用瀏覽器既有啟用行為能讓 Enter／Space 與觸控點按走同一條程式路徑，避免重複註冊鍵盤處理器。
- 替代方案：同時監聽 `pointerdown` 與 `keydown` 需要自行去重且容易造成一次操作觸發兩次；非按鈕元素補上 `role` 與鍵盤模擬也沒有原生按鈕穩定。
- 限制：真正需要座標、拖曳或壓力值時仍應使用 Pointer Events，不能把所有指標互動一概改成 `click`。
