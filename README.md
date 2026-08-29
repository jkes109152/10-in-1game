# 十合一小遊戲

一個不用登入、不用下載，打開就能玩十款短回合遊戲的繁體中文單頁網站。

## 內容

- ⚡ 反應脈衝
- 🧠 記憶翻牌
- 🐍 霓虹貪食蛇
- 💣 迷你踩地雷
- 🔢 2048 輕裝版
- 🎯 打地鼠
- 🎨 色彩辨識
- ✕ 井字對決
- 🧱 完美堆疊
- 🔐 數字密碼

最佳分數與已完成局數只儲存在使用者當前瀏覽器，不建立帳號或後端資料。

## 開始

```bash
python3 -m http.server 4173
```

開啟 `http://127.0.0.1:4173/` 即可。完整驗收指令與人工 smoke test 見 [`quickstart.md`](specs/001-ten-in-one-arcade/quickstart.md)。

## SDD

本功能的需求、計畫、研究、資料模型、UI 契約與任務狀態位於 [`specs/001-ten-in-one-arcade/`](specs/001-ten-in-one-arcade/)。

## 授權

本 repository 目前未加入第三方程式碼或外部圖片資產。
