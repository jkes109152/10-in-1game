import test from "node:test";
import assert from "node:assert/strict";
import {
  canChangeDirection,
  canMerge,
  createMinesBoard,
  mergeLine,
  moveGrid,
  neighbors,
  normalizePlayerStats,
  shuffle,
  snakeWouldCollide,
} from "../src/rules.mjs";

test("shuffle 保留所有元素且不改動原陣列", () => {
  const source = [1, 2, 3, 4];
  const result = shuffle(source, () => 0.5);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.deepEqual([...result].sort(), source);
});

test("mergeLine 只合併相鄰同值一次", () => {
  assert.deepEqual(mergeLine([2, 2, 2, 2]), {
    line: [4, 4, 0, 0],
    gained: 8,
    moved: true,
  });
  assert.deepEqual(mergeLine([2, 0, 4, 0]), {
    line: [2, 4, 0, 0],
    gained: 0,
    moved: true,
  });
});

test("moveGrid 支援四個方向並回報得分", () => {
  const grid = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  assert.deepEqual(moveGrid(grid, "left").grid[0], [4, 0, 0, 0]);
  assert.equal(moveGrid(grid, "left").gained, 4);
  assert.deepEqual(moveGrid(grid, "right").grid[0], [0, 0, 0, 4]);
});

test("neighbors 不超出棋盤並包含對角線", () => {
  assert.deepEqual(neighbors(0, 5), [1, 5, 6]);
  assert.equal(neighbors(12, 5).length, 8);
  assert.deepEqual(neighbors(24, 5), [18, 19, 23]);
});

test("createMinesBoard 產生固定數量地雷與鄰近數字", () => {
  const board = createMinesBoard(3, 2, () => 0.1);
  assert.equal(board.filter((cell) => cell.mine).length, 2);
  board.forEach((cell, index) => {
    assert.equal(
      cell.nearby,
      neighbors(index, 3).filter((neighbor) => board[neighbor].mine).length,
    );
  });
});

test("canMerge 可識別空格、相鄰相同值與已鎖死棋盤", () => {
  assert.equal(canMerge([[0, 2], [4, 8]]), true);
  assert.equal(canMerge([[2, 2], [4, 8]]), true);
  assert.equal(canMerge([[2, 4], [8, 16]]), false);
});

test("canChangeDirection 依目前移動方向阻止快速 180 度反轉", () => {
  assert.equal(canChangeDirection("right", "up"), true);
  assert.equal(canChangeDirection("right", "left"), false);
  assert.equal(canChangeDirection("up", "up"), true);
  assert.equal(canChangeDirection("invalid", "left"), false);
});

test("snakeWouldCollide 允許移入離開中的尾端，但成長時仍視為碰撞", () => {
  const snake = [
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 1, y: 1 },
  ];
  assert.equal(snakeWouldCollide(snake, { x: 1, y: 1 }, false), false);
  assert.equal(snakeWouldCollide(snake, { x: 1, y: 1 }, true), true);
  assert.equal(snakeWouldCollide(snake, { x: 2, y: 2 }, false), true);
});

test("normalizePlayerStats 過濾型別錯誤與未知的本機資料", () => {
  const gameIds = ["reaction", "snake"];
  assert.deepEqual(normalizePlayerStats(null, gameIds), {
    completed: 0,
    bestScores: { reaction: 0, snake: 0 },
    lastPlayedAt: null,
  });
  assert.deepEqual(
    normalizePlayerStats(
      {
        completed: "7",
        bestScores: { reaction: "180", snake: -1, unknown: 999 },
        lastPlayedAt: 123,
      },
      gameIds,
    ),
    {
      completed: 0,
      bestScores: { reaction: 0, snake: 0 },
      lastPlayedAt: null,
    },
  );
  assert.deepEqual(
    normalizePlayerStats(
      { completed: 4, bestScores: { reaction: 180, snake: 30 }, lastPlayedAt: "2026-08-29T00:00:00.000Z" },
      gameIds,
    ),
    {
      completed: 4,
      bestScores: { reaction: 180, snake: 30 },
      lastPlayedAt: "2026-08-29T00:00:00.000Z",
    },
  );
});
