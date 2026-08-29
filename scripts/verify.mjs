import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const [html, css, js, spec, workflow] = await Promise.all([
  readFile("index.html", "utf8"),
  readFile("styles.css", "utf8"),
  readFile("app.js", "utf8"),
  readFile("specs/001-ten-in-one-arcade/spec.md", "utf8"),
  readFile(".github/workflows/sdd-checks.yml", "utf8"),
]);

const gameIds = [
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

for (const gameId of gameIds) {
  assert.match(html, new RegExp(`data-game-id=["']${gameId}["']`));
  assert.match(js, new RegExp(`start${gameId[0].toUpperCase()}${gameId.slice(1)}Game`));
}

assert.equal((html.match(/data-game-id=/g) ?? []).length, 10);
assert.match(html, /id=["']game-panel["']/);
assert.match(html, /id=["']game-result["']/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);
assert.match(css, /@media/);
assert.match(js, /localStorage/);
assert.match(js, /pointer/);
assert.match(spec, /不在範圍內/);
assert.match(workflow, /pull_request/);
assert.match(workflow, /npm test/);

console.log("靜態需求驗收通過：十款遊戲、共用面板、響應式與 CI 設定均存在。");
