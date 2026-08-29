# Quickstart

## 本機預覽

在專案根目錄執行：

```bash
python3 -m http.server 4173
```

再以瀏覽器開啟 `http://127.0.0.1:4173/`。使用 HTTP 預覽可避免直接開啟 `file:` URL 時的 module 與 localStorage 行為差異。

## 自動檢查

```bash
npm test
```

此指令會執行：

- `node --check app.js`
- `node --test tests/*.test.mjs`
- `node scripts/verify.mjs`

## 人工 smoke test

1. 確認首屏可看見十張遊戲卡與「開始挑戰」。
2. 依序開啟每張卡，確認有開始提示、遊戲操作、結束狀態與重玩控制。
3. 確認關閉面板後仍可選擇其他遊戲，且上一款的計時器沒有繼續更新。
4. 重新整理，確認至少一款完成過的遊戲在大廳顯示最佳紀錄。
5. 將視窗縮到約 360px 寬，確認操作區與結果區沒有被裁切。
