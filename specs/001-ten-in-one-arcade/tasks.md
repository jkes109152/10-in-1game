# 實作任務

## Phase 1：SDD 與骨架

- [x] T001 建立 `spec.md` 與需求品質檢核表，覆蓋十款遊戲、狀態、響應式與無障礙需求。
- [x] T002 建立 `plan.md`、`research.md`、`data-model.md`、`contracts/ui-contract.md` 與 `quickstart.md`。
- [x] T003 建立 `package.json`、`index.html` 與 `.github/workflows/sdd-checks.yml` 的靜態專案骨架。

## Phase 2：大廳與共用體驗（US1、US3、US4）

- [x] T004 [US1] 在 `index.html` 建立品牌、首屏 CTA、統計摘要與恰好十張 `[data-game-id]` 卡片。
- [x] T005 [US1] 在 `app.js` 實作遊戲卡開啟、面板關閉、焦點回復與遊戲 session cleanup。
- [x] T006 [US3] 在 `app.js` 實作本機最佳分數讀寫、統計摘要與共用結果區。
- [x] T007 [US4] 在 `styles.css` 實作深色遊戲廳視覺 token、focus-visible、窄螢幕單欄與 reduced-motion。

## Phase 3：十款遊戲（US2）

- [x] T008 [US2] 在 `app.js` 實作反應脈衝與記憶翻牌。
- [x] T009 [US2] 在 `app.js` 實作霓虹貪食蛇與共用鍵盤／觸控方向控制。
- [x] T010 [US2] 在 `app.js` 實作迷你踩地雷與旗標模式。
- [x] T011 [US2] 在 `src/rules.mjs` 與 `app.js` 實作 2048 輕裝版合併規則與操作。
- [x] T012 [US2] 在 `app.js` 實作打地鼠與色彩辨識十題回合。
- [x] T013 [US2] 在 `app.js` 實作井字對決與基本電腦回應。
- [x] T014 [US2] 在 `app.js` 實作完美堆疊 Canvas／按鈕控制。
- [x] T015 [US2] 在 `app.js` 實作數字密碼的隨機目標、提示與八次限制。

## Phase 4：驗證與交付

- [x] T016 [US2] 在 `tests/game-rules.test.mjs` 覆蓋洗牌、2048 合併、地雷鄰居與安全邊界。
- [x] T017 執行 Node 語法檢查、純規則測試、十款遊戲靜態驗收與靜態伺服器 smoke test；自動檢查全部通過。
- [x] T018 同步 SDD 任務與完成狀態，完成手動文件一致性分析（見 `analysis.md`）。
- [ ] T019 以 GitHub plugin 將變更提交至 `001-ten-in-one-arcade`、建立 PR 並等待 workflow。
- [ ] T020 審閱 checks 與 PR 狀態，在保護條件允許時合併至 `main`。
