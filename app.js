import {
  canMerge,
  createMinesBoard,
  moveGrid,
  neighbors,
  shuffle,
} from "./src/rules.mjs";

const STORAGE_KEY = "arcade-10-best-scores";
const GAME_IDS = [
  "reaction",
  "memory",
  "snake",
  "mines",
  "merge",
  "whack",
  "color",
  "tictactoe",
  "stack",
  "number",
];

const gameDefinitions = {
  reaction: { name: "反應脈衝", number: "01", meta: "反應 · 30 秒" },
  memory: { name: "記憶翻牌", number: "02", meta: "記憶 · 3 分鐘" },
  snake: { name: "霓虹貪食蛇", number: "03", meta: "手感 · 2 分鐘" },
  mines: { name: "迷你踩地雷", number: "04", meta: "策略 · 2 分鐘" },
  merge: { name: "2048 輕裝版", number: "05", meta: "策略 · 不限時" },
  whack: { name: "打地鼠", number: "06", meta: "手速 · 30 秒" },
  color: { name: "色彩辨識", number: "07", meta: "專注 · 10 題" },
  tictactoe: { name: "井字對決", number: "08", meta: "對戰 · 1 分鐘" },
  stack: { name: "完美堆疊", number: "09", meta: "節奏 · 2 分鐘" },
  number: { name: "數字密碼", number: "10", meta: "推理 · 2 分鐘" },
};

const defaultStats = {
  completed: 0,
  bestScores: Object.fromEntries(GAME_IDS.map((id) => [id, 0])),
  lastPlayedAt: null,
};

const dom = {
  panel: document.querySelector("#game-panel"),
  panelTitle: document.querySelector("#panel-title"),
  panelKicker: document.querySelector("#panel-kicker"),
  stage: document.querySelector("#game-stage"),
  result: document.querySelector("#game-result"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  restart: document.querySelector("#restart-game"),
  close: document.querySelector("#close-game"),
  backdrop: document.querySelector("#modal-backdrop"),
  live: document.querySelector("#live-region"),
  headerCompleted: document.querySelector("#header-completed"),
  headerBests: document.querySelector("#header-bests"),
};

const appState = {
  stats: loadStats(),
  currentGameId: null,
  trigger: null,
  session: null,
};

function loadStats() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      ...defaultStats,
      ...stored,
      bestScores: { ...defaultStats.bestScores, ...(stored?.bestScores ?? {}) },
    };
  } catch {
    return {
      completed: 0,
      bestScores: { ...defaultStats.bestScores },
      lastPlayedAt: null,
    };
  }
}

function persistStats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.stats));
  } catch {
    // 儲存被瀏覽器拒絕時，保留本次工作階段的記憶體紀錄即可。
  }
  updateHeaderStats();
}

function updateHeaderStats() {
  dom.headerCompleted.textContent = String(appState.stats.completed);
  dom.headerBests.textContent = String(
    Object.values(appState.stats.bestScores).filter((value) => Number(value) > 0).length,
  );
}

function announce(message) {
  dom.live.textContent = "";
  window.setTimeout(() => {
    dom.live.textContent = message;
  }, 20);
}

function createSession() {
  const timers = new Set();
  const listeners = new Set();
  let disposed = false;

  return {
    listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      listeners.add(() => target.removeEventListener(type, handler, options));
    },
    timeout(callback, delay) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!disposed) callback();
      }, delay);
      timers.add(id);
      return id;
    },
    interval(callback, delay) {
      const id = window.setInterval(() => {
        if (!disposed) callback();
      }, delay);
      timers.add(id);
      return id;
    },
    cancel(id) {
      window.clearTimeout(id);
      window.clearInterval(id);
      timers.delete(id);
    },
    dispose() {
      disposed = true;
      timers.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
      listeners.forEach((remove) => remove());
      timers.clear();
      listeners.clear();
    },
  };
}

function startSession() {
  appState.session?.dispose();
  appState.session = createSession();
  return appState.session;
}

function statsMarkup(items) {
  return items
    .map(
      ([label, id, value]) =>
        `<div class="mini-stat"><small>${label}</small><strong id="${id}">${value}</strong></div>`,
    )
    .join("");
}

function shellMarkup(instructions, stats, body) {
  return `
    <div class="game-shell">
      <div class="game-intro">
        <p class="game-instructions">${instructions}</p>
        <div class="game-stats">${statsMarkup(stats)}</div>
      </div>
      ${body}
    </div>
  `;
}

function setStage(content) {
  dom.stage.innerHTML = content;
}

function updateStat(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = String(value);
}

function finishGame({ title, copy, score = 0, lowerBetter = false }) {
  const id = appState.currentGameId;
  if (!id || !gameDefinitions[id]) return;

  appState.session?.dispose();
  appState.session = null;
  appState.stats.completed += 1;
  const oldBest = Number(appState.stats.bestScores[id] ?? 0);
  const hasNewBest = lowerBetter ? oldBest === 0 || score < oldBest : score > oldBest;
  if (hasNewBest) appState.stats.bestScores[id] = score;
  appState.stats.lastPlayedAt = new Date().toISOString();
  persistStats();

  dom.resultTitle.textContent = hasNewBest ? "新的最佳紀錄！" : title;
  dom.resultCopy.textContent = hasNewBest ? `${copy} 把紀錄再往前推了一點。` : copy;
  dom.result.hidden = false;
  announce(`${gameDefinitions[id].name}結束。${copy}`);
}

function openGame(gameId, trigger = null) {
  if (!gameDefinitions[gameId]) return;
  appState.session?.dispose();
  appState.currentGameId = gameId;
  appState.trigger = trigger;
  const definition = gameDefinitions[gameId];
  dom.panelTitle.textContent = definition.name;
  dom.panelKicker.textContent = `遊戲 ${definition.number} / 10 · ${definition.meta}`;
  dom.result.hidden = true;
  dom.panel.hidden = false;
  dom.panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
  const starter = {
    reaction: startReactionGame,
    memory: startMemoryGame,
    snake: startSnakeGame,
    mines: startMinesGame,
    merge: startMergeGame,
    whack: startWhackGame,
    color: startColorGame,
    tictactoe: startTictactoeGame,
    stack: startStackGame,
    number: startNumberGame,
  }[gameId];
  starter();
  window.requestAnimationFrame(() => {
    dom.panelTitle.focus();
  });
}

function closeGame() {
  const trigger = appState.trigger;
  appState.session?.dispose();
  appState.session = null;
  appState.currentGameId = null;
  appState.trigger = null;
  dom.stage.innerHTML = "";
  dom.result.hidden = true;
  dom.panel.hidden = true;
  dom.panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
  trigger?.focus();
}

function restartGame() {
  if (!appState.currentGameId) return;
  openGame(appState.currentGameId, appState.trigger);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startReactionGame() {
  const session = startSession();
  setStage(
    shellMarkup(
      "先等圓點變成薄荷綠，再用最快的速度點下去。過早點擊不算，準備好就按重新等待。",
      [["最佳", "reaction-best", appState.stats.bestScores.reaction ? `${appState.stats.bestScores.reaction} ms` : "—"], ["本次", "reaction-time", "—"]],
      `<div class="reaction-game">
        <p class="reaction-label" id="reaction-label">準備好了嗎？等它亮起。</p>
        <button class="reaction-target" id="reaction-target" type="button" aria-label="反應目標"></button>
        <button class="game-control" id="reaction-reset" type="button">重新等待</button>
      </div>`,
    ),
  );

  const target = document.querySelector("#reaction-target");
  const label = document.querySelector("#reaction-label");
  const reset = document.querySelector("#reaction-reset");
  let phase = "waiting";
  let startedAt = 0;
  let timer = null;

  const arm = () => {
    phase = "waiting";
    startedAt = 0;
    target.className = "reaction-target";
    label.textContent = "等它亮起，再點下去。";
    if (timer) session.cancel(timer);
    timer = session.timeout(() => {
      phase = "ready";
      startedAt = performance.now();
      target.classList.add("is-ready");
      label.textContent = "就是現在！";
      announce("目標亮起，現在點擊！");
    }, randomInt(900, 2300));
  };

  session.listen(target, "pointerdown", () => {
    if (phase === "waiting") {
      phase = "early";
      if (timer) session.cancel(timer);
      target.classList.add("is-early");
      label.textContent = "太早了，再按一次重新等待。";
      announce("太早點擊，請重新等待。");
      return;
    }
    if (phase !== "ready") return;
    const milliseconds = Math.max(1, Math.round(performance.now() - startedAt));
    phase = "done";
    updateStat("reaction-time", `${milliseconds} ms`);
    target.classList.remove("is-ready");
    label.textContent = `反應時間 ${milliseconds} ms，漂亮。`;
    finishGame({
      title: "反應很快。",
      copy: `這一局是 ${milliseconds} ms。`,
      score: milliseconds,
      lowerBetter: true,
    });
  });
  session.listen(reset, "click", arm);
  arm();
}

function startMemoryGame() {
  const session = startSession();
  const symbols = ["◒", "✦", "✹", "⌁", "◈", "✳", "⬡", "◌"];
  const cards = shuffle([...symbols, ...symbols]);
  setStage(
    shellMarkup(
      "翻開兩張牌找出相同圖示。每次翻牌算一步，八組全配對就完成。",
      [["配對", "memory-matched", "0 / 8"], ["步數", "memory-moves", "0"], ["時間", "memory-time", "0s"]],
      `<div class="memory-grid" id="memory-grid" aria-label="記憶翻牌棋盤"></div>`,
    ),
  );
  const board = document.querySelector("#memory-grid");
  let flipped = [];
  let matched = new Set();
  let moves = 0;
  let locked = false;
  const startedAt = Date.now();

  const render = () => {
    board.innerHTML = cards
      .map((symbol, index) => {
        const open = flipped.includes(index) || matched.has(index);
        const className = ["memory-tile", open ? "is-flipped" : "", matched.has(index) ? "is-matched" : ""]
          .filter(Boolean)
          .join(" ");
        return `<button class="${className}" data-index="${index}" type="button" aria-label="第 ${index + 1} 張牌${open ? `：${symbol}` : "，未翻開"}">${open ? symbol : "?"}</button>`;
      })
      .join("");
    updateStat("memory-matched", `${matched.size / 2} / 8`);
    updateStat("memory-moves", moves);
  };

  const checkPair = () => {
    if (flipped.length !== 2) return;
    const [first, second] = flipped;
    moves += 1;
    if (cards[first] === cards[second]) {
      matched.add(first);
      matched.add(second);
      flipped = [];
      locked = false;
      render();
      if (matched.size === cards.length) {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        finishGame({
          title: "記得很準。",
          copy: `用 ${moves} 步、${seconds} 秒完成全部配對。`,
          score: Math.max(100, 1600 - moves * 35 - seconds * 5),
        });
      }
      return;
    }
    locked = true;
    session.timeout(() => {
      flipped = [];
      locked = false;
      render();
    }, 620);
    render();
  };

  session.listen(board, "pointerdown", (event) => {
    const tile = event.target.closest("[data-index]");
    if (!tile || locked) return;
    const index = Number(tile.dataset.index);
    if (matched.has(index) || flipped.includes(index)) return;
    flipped.push(index);
    render();
    checkPair();
  });
  session.interval(() => {
    updateStat("memory-time", `${Math.round((Date.now() - startedAt) / 1000)}s`);
  }, 500);
  render();
}

function startSnakeGame() {
  const session = startSession();
  const size = 16;
  const canvasSize = 320;
  setStage(
    shellMarkup(
      "用方向鍵、WASD 或下方方向鍵移動。吃到發光方塊會變長，撞牆或撞到自己就結束。",
      [["分數", "snake-score", "0"], ["長度", "snake-length", "3"]],
      `<div class="canvas-wrap"><canvas id="snake-canvas" width="${canvasSize}" height="${canvasSize}" aria-label="霓虹貪食蛇遊戲區"></canvas></div>
       <div class="direction-pad" aria-label="蛇的方向控制">
         <button data-direction="up" type="button" aria-label="向上">↑</button>
         <button data-direction="left" type="button" aria-label="向左">←</button>
         <button data-direction="center" type="button" aria-label="目前方向" disabled>•</button>
         <button data-direction="right" type="button" aria-label="向右">→</button>
         <button data-direction="down" type="button" aria-label="向下">↓</button>
       </div>
       <button class="game-control" id="snake-reset" type="button">重新開始</button>`,
    ),
  );

  const canvas = document.querySelector("#snake-canvas");
  const ctx = canvas.getContext("2d");
  const reset = document.querySelector("#snake-reset");
  const directionButtons = document.querySelectorAll("[data-direction]");
  let snake;
  let food;
  let direction;
  let nextDirection;
  let score;
  let loop;
  let ended = false;

  const samePoint = (first, second) => first.x === second.x && first.y === second.y;
  const randomFood = () => {
    const open = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!snake.some((part) => part.x === x && part.y === y)) open.push({ x, y });
      }
    }
    return open[randomInt(0, Math.max(0, open.length - 1))] ?? { x: 8, y: 8 };
  };

  const draw = () => {
    const cell = canvasSize / size;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#0b1117";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = "rgba(124, 201, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let index = 1; index < size; index += 1) {
      ctx.beginPath();
      ctx.moveTo(index * cell, 0);
      ctx.lineTo(index * cell, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, index * cell);
      ctx.lineTo(canvasSize, index * cell);
      ctx.stroke();
    }
    ctx.fillStyle = "#ff765f";
    ctx.shadowColor = "#ff765f";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? "#b8ffd6" : "#8cf0bf";
      ctx.shadowColor = "#8cf0bf";
      ctx.shadowBlur = index === 0 ? 15 : 6;
      ctx.beginPath();
      ctx.roundRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4, 5);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  };

  const setDirection = (value) => {
    const opposite = { up: "down", down: "up", left: "right", right: "left" };
    if (value !== opposite[nextDirection]) nextDirection = value;
  };

  const tick = () => {
    if (ended) return;
    direction = nextDirection;
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[direction];
    const head = { x: snake[0].x + delta[0], y: snake[0].y + delta[1] };
    const hitWall = head.x < 0 || head.x >= size || head.y < 0 || head.y >= size;
    const hitSelf = snake.some((part) => samePoint(part, head));
    if (hitWall || hitSelf) {
      ended = true;
      finishGame({ title: "蛇蛇撞到了。", copy: `你收集了 ${score} 分，下一局再繞漂亮一點。`, score });
      return;
    }
    snake.unshift(head);
    if (samePoint(head, food)) {
      score += 10;
      food = randomFood();
      updateStat("snake-score", score);
      updateStat("snake-length", snake.length);
    } else {
      snake.pop();
    }
    draw();
  };

  const resetGame = () => {
    if (loop) session.cancel(loop);
    snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
    food = { x: 11, y: 8 };
    direction = "right";
    nextDirection = "right";
    score = 0;
    ended = false;
    updateStat("snake-score", score);
    updateStat("snake-length", snake.length);
    draw();
    loop = session.interval(tick, 145);
  };

  session.listen(window, "keydown", (event) => {
    const keyMap = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
    const value = keyMap[event.key];
    if (value) {
      event.preventDefault();
      setDirection(value);
    }
  });
  session.listen(reset, "click", resetGame);
  directionButtons.forEach((button) => {
    session.listen(button, "pointerdown", () => {
      if (button.dataset.direction !== "center") setDirection(button.dataset.direction);
    });
  });
  resetGame();
}

function startMinesGame() {
  const session = startSession();
  const size = 5;
  const mineCount = 5;
  let boardState = createMinesBoard(size, mineCount);
  let flagMode = false;
  let ended = false;

  setStage(
    shellMarkup(
      "點擊格子揭開安全區；需要標記時切換旗標模式。你可以用右鍵在桌面快速插旗。",
      [["地雷", "mines-left", String(mineCount)], ["安全格", "mines-safe", "0 / 20"]],
      `<div class="mines-toolbar">
         <span class="hint-line" id="mines-hint">先找出一個安全格。</span>
         <button class="game-control" id="mines-mode" type="button" aria-pressed="false">旗標模式：關</button>
       </div>
       <div class="mines-grid" id="mines-grid" aria-label="迷你踩地雷棋盤"></div>`,
    ),
  );

  const grid = document.querySelector("#mines-grid");
  const modeButton = document.querySelector("#mines-mode");
  const hint = document.querySelector("#mines-hint");

  const render = () => {
    const safeRevealed = boardState.filter((cell) => cell.revealed && !cell.mine).length;
    const flags = boardState.filter((cell) => cell.flagged).length;
    updateStat("mines-left", Math.max(0, mineCount - flags));
    updateStat("mines-safe", `${safeRevealed} / ${size * size - mineCount}`);
    grid.innerHTML = boardState
      .map((cell, index) => {
        const classes = [
          "mine-cell",
          cell.revealed ? "is-revealed" : "",
          cell.flagged ? "is-flagged" : "",
          cell.revealed && cell.mine ? "is-mine" : "",
        ].filter(Boolean).join(" ");
        const value = cell.revealed ? (cell.mine ? "✹" : cell.nearby || "·") : cell.flagged ? "⚑" : "";
        const label = cell.revealed ? (cell.mine ? "地雷" : `附近有 ${cell.nearby} 顆地雷`) : cell.flagged ? "已標記" : "未揭開";
        return `<button class="${classes}" data-mine-index="${index}" type="button" aria-label="第 ${index + 1} 格：${label}">${value}</button>`;
      })
      .join("");
  };

  const reveal = (startIndex) => {
    const queue = [startIndex];
    const visited = new Set();
    while (queue.length) {
      const index = queue.shift();
      if (visited.has(index)) continue;
      visited.add(index);
      const cell = boardState[index];
      if (!cell || cell.flagged || cell.revealed) continue;
      cell.revealed = true;
      if (cell.nearby === 0 && !cell.mine) {
        neighbors(index, size).forEach((neighbor) => {
          if (!boardState[neighbor].mine) queue.push(neighbor);
        });
      }
    }
  };

  const toggleFlag = (index) => {
    const cell = boardState[index];
    if (!cell || cell.revealed) return;
    cell.flagged = !cell.flagged;
    render();
  };

  const revealAllMines = () => boardState.forEach((cell) => { if (cell.mine) cell.revealed = true; });

  const checkWin = () => boardState.every((cell) => cell.mine || cell.revealed);

  session.listen(modeButton, "click", () => {
    flagMode = !flagMode;
    modeButton.setAttribute("aria-pressed", String(flagMode));
    modeButton.textContent = `旗標模式：${flagMode ? "開" : "關"}`;
    modeButton.classList.toggle("is-active", flagMode);
    hint.textContent = flagMode ? "現在點格子會插旗或取消旗標。" : "現在點格子會揭開安全區。";
  });

  session.listen(grid, "pointerdown", (event) => {
    if (ended) return;
    const button = event.target.closest("[data-mine-index]");
    if (!button) return;
    const index = Number(button.dataset.mineIndex);
    if (flagMode) {
      toggleFlag(index);
      return;
    }
    const cell = boardState[index];
    if (!cell || cell.flagged || cell.revealed) return;
    if (cell.mine) {
      cell.revealed = true;
      revealAllMines();
      ended = true;
      render();
      finishGame({ title: "踩到地雷了。", copy: "別急，下一局先從數字少的區域開始。", score: 0 });
      return;
    }
    reveal(index);
    render();
    if (checkWin()) {
      ended = true;
      finishGame({ title: "安全通關！", copy: "所有安全格都找到了，這盤走得很穩。", score: 1000 });
    }
  });
  session.listen(grid, "contextmenu", (event) => {
    event.preventDefault();
    if (ended) return;
    const button = event.target.closest("[data-mine-index]");
    if (button) toggleFlag(Number(button.dataset.mineIndex));
  });
  render();
}

function startMergeGame() {
  const session = startSession();
  const size = 4;
  let gridState = Array.from({ length: size }, () => Array(size).fill(0));
  let score = 0;
  let ended = false;

  setStage(
    shellMarkup(
      "用方向鍵、WASD 或下方控制移動數字。相同數字相撞就會合併，試著把 2 推到 2048。",
      [["分數", "merge-score", "0"], ["最高", "merge-best", String(appState.stats.bestScores.merge || 0)]],
      `<div class="merge-grid" id="merge-grid" aria-label="2048 輕裝版棋盤"></div>
       <div class="merge-controls" aria-label="2048 移動控制">
         <button data-merge-direction="up" type="button" aria-label="向上">↑</button>
         <button data-merge-direction="left" type="button" aria-label="向左">←</button>
         <button data-merge-direction="down" type="button" aria-label="向下">↓</button>
         <button data-merge-direction="right" type="button" aria-label="向右">→</button>
       </div>`,
    ),
  );

  const board = document.querySelector("#merge-grid");
  const addTile = () => {
    const open = [];
    gridState.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
      if (value === 0) open.push([rowIndex, columnIndex]);
    }));
    if (!open.length) return;
    const [row, column] = open[randomInt(0, open.length - 1)];
    gridState[row][column] = Math.random() < 0.9 ? 2 : 4;
  };
  const render = () => {
    board.innerHTML = gridState.flat().map((value, index) => {
      const className = value ? `merge-cell tile-${value}` : "merge-cell";
      return `<div class="${className}" role="img" aria-label="第 ${index + 1} 格：${value || "空格"}">${value || ""}</div>`;
    }).join("");
    updateStat("merge-score", score);
  };
  const reset = () => {
    gridState = Array.from({ length: size }, () => Array(size).fill(0));
    score = 0;
    ended = false;
    addTile();
    addTile();
    render();
  };
  const move = (direction) => {
    if (ended) return;
    const result = moveGrid(gridState, direction);
    if (!result.moved) {
      if (!canMerge(gridState)) {
        ended = true;
        finishGame({ title: "棋盤滿了。", copy: `最後停在 ${score} 分，再開一局試試不同路線。`, score });
      }
      return;
    }
    gridState = result.grid;
    score += result.gained;
    addTile();
    render();
    if (gridState.flat().some((value) => value >= 2048)) {
      ended = true;
      finishGame({ title: "你合到 2048 了！", copy: `用 ${score} 分完成一塊漂亮的數字拼圖。`, score: score + 1000 });
      return;
    }
    if (!canMerge(gridState)) {
      ended = true;
      finishGame({ title: "棋盤滿了。", copy: `最後停在 ${score} 分，再開一局試試不同路線。`, score });
    }
  };

  session.listen(window, "keydown", (event) => {
    const direction = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" }[event.key];
    if (direction) {
      event.preventDefault();
      move(direction);
    }
  });
  document.querySelectorAll("[data-merge-direction]").forEach((button) => {
    session.listen(button, "pointerdown", () => move(button.dataset.mergeDirection));
  });
  reset();
}

function startWhackGame() {
  const session = startSession();
  const duration = 30;
  let remaining = duration;
  let score = 0;
  let activeIndex = -1;
  let ended = false;

  setStage(
    shellMarkup(
      "三十秒內點擊冒出來的地鼠，每次命中加 10 分。目標會一直換位置，眼睛跟上。",
      [["分數", "whack-score", "0"], ["倒數", "whack-time", `${duration}s`]],
      `<div class="whack-head"><p class="hint-line" id="whack-hint">預備，地鼠要出現了。</p><button class="game-control" id="whack-start" type="button">重新開始</button></div>
       <div class="whack-grid" id="whack-grid" aria-label="打地鼠遊戲區"></div>`,
    ),
  );
  const board = document.querySelector("#whack-grid");
  const hint = document.querySelector("#whack-hint");
  const reset = document.querySelector("#whack-start");

  const chooseMole = () => {
    activeIndex = randomInt(0, 8);
    board.querySelectorAll(".mole-cell").forEach((cell, index) => {
      const active = index === activeIndex;
      cell.classList.toggle("is-active", active);
      cell.textContent = active ? "●" : "";
      cell.setAttribute("aria-label", active ? `第 ${index + 1} 格：地鼠出現` : `第 ${index + 1} 格：空洞`);
    });
  };
  const render = () => {
    board.innerHTML = [...Array(9)].map((_, index) => `<button class="mole-cell" data-mole-index="${index}" type="button" aria-label="第 ${index + 1} 格：空洞"></button>`).join("");
    chooseMole();
    updateStat("whack-score", score);
    updateStat("whack-time", `${remaining}s`);
  };
  const resetGame = () => {
    remaining = duration;
    score = 0;
    ended = false;
    hint.textContent = "預備，地鼠要出現了。";
    render();
  };

  session.listen(board, "pointerdown", (event) => {
    if (ended) return;
    const cell = event.target.closest("[data-mole-index]");
    if (!cell) return;
    if (Number(cell.dataset.moleIndex) === activeIndex) {
      score += 10;
      updateStat("whack-score", score);
      hint.textContent = "命中！下一隻來了。";
      chooseMole();
    } else {
      hint.textContent = "差一點，盯住亮起的格子。";
    }
  });
  session.interval(() => {
    if (ended) return;
    remaining -= 1;
    updateStat("whack-time", `${remaining}s`);
    if (remaining <= 0) {
      ended = true;
      finishGame({ title: "時間到！", copy: `你在三十秒內打中了 ${score / 10} 隻地鼠。`, score });
    }
  }, 1000);
  session.interval(chooseMole, 760);
  session.listen(reset, "click", resetGame);
  render();
}

function startColorGame() {
  const session = startSession();
  const colors = [
    { id: "red", name: "紅色", value: "#ff765f" },
    { id: "blue", name: "藍色", value: "#7cc9ff" },
    { id: "green", name: "綠色", value: "#8cf0bf" },
    { id: "yellow", name: "黃色", value: "#f9c86b" },
  ];
  let round = 0;
  let score = 0;
  let correct = 0;
  let actual;
  let word;

  setStage(
    shellMarkup(
      "看大字實際呈現的顏色，不要讀它寫了什麼。十題結束後會告訴你今天的專注力分數。",
      [["題目", "color-round", "1 / 10"], ["答對", "color-score", "0"]],
      `<div class="color-prompt"><small>這個字的顏色是？</small><strong id="color-word">紅色</strong></div>
       <div class="color-options" id="color-options" aria-label="顏色答案"></div>`,
    ),
  );
  const wordElement = document.querySelector("#color-word");
  const options = document.querySelector("#color-options");

  const nextRound = () => {
    word = colors[randomInt(0, colors.length - 1)];
    actual = colors[randomInt(0, colors.length - 1)];
    wordElement.textContent = word.name;
    wordElement.style.color = actual.value;
    options.innerHTML = colors.map((color) => `<button class="color-option" data-color-id="${color.id}" type="button" style="--option-color: ${color.value}">${color.name}</button>`).join("");
    updateStat("color-round", `${round + 1} / 10`);
    updateStat("color-score", correct);
  };

  session.listen(options, "pointerdown", (event) => {
    const button = event.target.closest("[data-color-id]");
    if (!button) return;
    if (button.dataset.colorId === actual.id) correct += 1;
    round += 1;
    score = correct * 10;
    if (round >= 10) {
      finishGame({ title: correct >= 8 ? "專注力滿格。" : "有幾題被文字騙到了。", copy: `十題答對 ${correct} 題。`, score });
      return;
    }
    nextRound();
  });
  nextRound();
}

function startTictactoeGame() {
  const session = startSession();
  let cells = Array(9).fill("");
  let ended = false;

  setStage(
    shellMarkup(
      "你是 X，電腦是 O。先連成三個就贏；每一步都會讓電腦回應。",
      [["你的符號", "ttt-mark", "X"], ["最佳", "ttt-best", String(appState.stats.bestScores.tictactoe || 0)]],
      `<div class="ttt-grid" id="ttt-grid" aria-label="井字對決棋盤"></div>
       <p class="hint-line" id="ttt-hint" role="status">輪到你了，選一格落子。</p>`,
    ),
  );
  const board = document.querySelector("#ttt-grid");
  const hint = document.querySelector("#ttt-hint");

  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const winner = (mark) => winningLines.some((line) => line.every((index) => cells[index] === mark));
  const openCells = () => cells.map((cell, index) => cell ? null : index).filter((index) => index !== null);
  const render = () => {
    board.innerHTML = cells.map((cell, index) => `<button class="ttt-cell ${cell === "O" ? "is-o" : ""}" data-ttt-index="${index}" type="button" ${cell ? "disabled" : ""} aria-label="第 ${index + 1} 格${cell ? `：${cell}` : "，空格"}">${cell}</button>`).join("");
  };
  const aiPick = () => {
    const open = openCells();
    if (!open.length) return -1;
    for (const mark of ["O", "X"]) {
      for (const index of open) {
        cells[index] = mark;
        const wins = winner(mark);
        cells[index] = "";
        if (wins) return index;
      }
    }
    if (open.includes(4)) return 4;
    const corners = open.filter((index) => [0, 2, 6, 8].includes(index));
    if (corners.length) return corners[randomInt(0, corners.length - 1)];
    return open[randomInt(0, open.length - 1)];
  };
  const afterMove = (mark) => {
    if (winner(mark)) {
      ended = true;
      render();
      finishGame({ title: mark === "X" ? "你贏了！" : "電腦先連線。", copy: mark === "X" ? "這一局的落子很漂亮。" : "換個開場角度，再挑戰一次。", score: mark === "X" ? 100 : 0 });
      return true;
    }
    if (!openCells().length) {
      ended = true;
      render();
      finishGame({ title: "平局。", copy: "棋盤沒有空位了，下一局換你先攻。", score: 50 });
      return true;
    }
    return false;
  };

  session.listen(board, "pointerdown", (event) => {
    if (ended) return;
    const button = event.target.closest("[data-ttt-index]");
    if (!button) return;
    const index = Number(button.dataset.tttIndex);
    if (cells[index]) return;
    cells[index] = "X";
    render();
    if (afterMove("X")) return;
    hint.textContent = "電腦思考中…";
    session.timeout(() => {
      if (ended) return;
      const aiIndex = aiPick();
      if (aiIndex >= 0) cells[aiIndex] = "O";
      render();
      if (!afterMove("O")) hint.textContent = "輪到你了，選一格落子。";
    }, 380);
  });
  render();
}

function startStackGame() {
  const session = startSession();
  const width = 360;
  const height = 220;
  const blockHeight = 18;
  let base;
  let current;
  let stack;
  let score;
  let direction;
  let ended;
  let loop;

  setStage(
    shellMarkup(
      "按下放置或空白鍵，讓移動中的方塊與底下的方塊重疊。重疊越準，堆疊就越高。",
      [["層數", "stack-score", "0"], ["最佳", "stack-best", String(appState.stats.bestScores.stack || 0)]],
      `<div class="stack-wrap"><canvas id="stack-canvas" width="${width}" height="${height}" aria-label="完美堆疊遊戲區"></canvas></div>
       <button class="game-control stack-cta" id="stack-place" type="button">放下方塊 <span aria-hidden="true">· 空白鍵</span></button>
       <p class="hint-line" id="stack-hint" role="status">抓準節奏，讓它落下。</p>`,
    ),
  );
  const canvas = document.querySelector("#stack-canvas");
  const ctx = canvas.getContext("2d");
  const placeButton = document.querySelector("#stack-place");
  const hint = document.querySelector("#stack-hint");
  const colors = ["#ff765f", "#f9c86b", "#8cf0bf", "#7cc9ff", "#b9a3ff"];

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b1117";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    for (let y = 20; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    stack.forEach((block, index) => {
      const y = height - (index + 1) * blockHeight;
      ctx.fillStyle = block.color;
      ctx.shadowColor = block.color;
      ctx.shadowBlur = 13;
      ctx.fillRect(block.x, y, block.width, blockHeight - 2);
    });
    ctx.shadowBlur = 0;
    const currentY = height - (stack.length + 1) * blockHeight;
    ctx.fillStyle = "#f5f7fb";
    ctx.globalAlpha = 0.9;
    ctx.fillRect(current.x, currentY, current.width, blockHeight - 2);
    ctx.globalAlpha = 1;
  };

  const reset = () => {
    if (loop) session.cancel(loop);
    base = { x: 100, width: 160 };
    current = { x: 0, width: 160 };
    stack = [{ x: base.x, width: base.width, color: "#303746" }];
    score = 0;
    direction = 1;
    ended = false;
    updateStat("stack-score", score);
    hint.textContent = "抓準節奏，讓它落下。";
    draw();
    loop = session.interval(() => {
      if (ended) return;
      current.x += direction * 3.2;
      if (current.x <= 0 || current.x + current.width >= width) direction *= -1;
      draw();
    }, 28);
  };
  const place = () => {
    if (ended) return;
    const previousWidth = base.width;
    const overlapLeft = Math.max(current.x, base.x);
    const overlapRight = Math.min(current.x + current.width, base.x + base.width);
    const overlap = overlapRight - overlapLeft;
    if (overlap <= 0) {
      ended = true;
      finishGame({ title: "這層沒接住。", copy: `你堆了 ${score} 層，差一點就更高了。`, score });
      return;
    }
    score += 1;
    stack.push({ x: overlapLeft, width: overlap, color: colors[score % colors.length] });
    base = { x: overlapLeft, width: overlap };
    current = { x: 0, width: overlap };
    direction = 1;
    updateStat("stack-score", score);
    hint.textContent = overlap / (previousWidth || 1) > 0.9 ? "漂亮！幾乎正中。" : "接住了，下一層更快。";
    draw();
    if (score >= 10) {
      ended = true;
      finishGame({ title: "十層完美堆疊！", copy: "每一層都留得很剛好。", score: score * 100 });
    }
  };

  session.listen(placeButton, "pointerdown", place);
  session.listen(window, "keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      place();
    }
  });
  reset();
}

function startNumberGame() {
  const session = startSession();
  const target = randomInt(1, 50);
  let tries = 0;
  const maxTries = 8;
  let ended = false;

  setStage(
    shellMarkup(
      "輸入 1–50 的整數。每次猜完都會得到高低提示，八次機會內破解數字密碼。",
      [["機會", "number-tries", `0 / ${maxTries}`], ["範圍", "number-range", "1–50"]],
      `<div class="number-lock"><small>密碼鎖定中</small><strong>？ ？ ？</strong>
       <form class="number-form" id="number-form"><label class="sr-only" for="number-input">輸入你的猜測</label><input class="number-input" id="number-input" name="guess" type="number" min="1" max="50" inputmode="numeric" placeholder="輸入數字" required /><button class="game-control" type="submit">猜</button></form>
       <p class="hint-line" id="number-hint" role="status">第一個直覺通常很有用。</p></div>`,
    ),
  );
  const form = document.querySelector("#number-form");
  const input = document.querySelector("#number-input");
  const hint = document.querySelector("#number-hint");

  session.listen(form, "submit", (event) => {
    event.preventDefault();
    if (ended) return;
    const guess = Number(input.value);
    if (!Number.isInteger(guess) || guess < 1 || guess > 50) {
      hint.textContent = "請輸入 1 到 50 之間的整數。";
      input.focus();
      return;
    }
    tries += 1;
    updateStat("number-tries", `${tries} / ${maxTries}`);
    if (guess === target) {
      ended = true;
      finishGame({ title: "密碼破解！", copy: `你用 ${tries} 次猜中了 ${target}。`, score: (maxTries - tries + 1) * 100 });
      return;
    }
    if (tries >= maxTries) {
      ended = true;
      finishGame({ title: "機會用完了。", copy: `這次的密碼是 ${target}，記住下一局的直覺。`, score: 0 });
      return;
    }
    hint.textContent = guess > target ? "太高了，往下猜。" : "太低了，往上猜。";
    input.select();
  });
  window.setTimeout(() => input.focus(), 60);
}

document.querySelectorAll("[data-game-id]").forEach((card) => {
  card.addEventListener("click", () => openGame(card.dataset.gameId, card));
});

document.querySelector("#start-featured").addEventListener("click", () => {
  openGame("reaction", document.querySelector("#start-featured"));
});

document.querySelector("#scroll-games").addEventListener("click", () => {
  document.querySelector("#games").scrollIntoView({ behavior: "smooth", block: "start" });
});

dom.close.addEventListener("click", closeGame);
dom.backdrop.addEventListener("click", closeGame);
dom.restart.addEventListener("click", restartGame);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dom.panel.hidden) closeGame();
});

updateHeaderStats();
