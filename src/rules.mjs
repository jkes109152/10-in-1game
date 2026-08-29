/**
 * 無副作用的遊戲規則，讓瀏覽器程式與 Node 測試共用。
 */

export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function mergeLine(line) {
  const compact = line.filter((value) => value !== 0);
  const merged = [];
  let gained = 0;

  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) {
      const value = compact[index] * 2;
      merged.push(value);
      gained += value;
      index += 1;
    } else {
      merged.push(compact[index]);
    }
  }

  const result = [...merged, ...Array(line.length - merged.length).fill(0)];
  return {
    line: result,
    gained,
    moved: result.some((value, index) => value !== line[index]),
  };
}

export function moveGrid(grid, direction) {
  const size = grid.length;
  const next = grid.map((row) => [...row]);
  let moved = false;
  let gained = 0;

  const readLine = (lineIndex) => {
    if (direction === "left" || direction === "right") {
      const row = [...grid[lineIndex]];
      return direction === "right" ? row.reverse() : row;
    }
    const column = grid.map((row) => row[lineIndex]);
    return direction === "down" ? column.reverse() : column;
  };

  const writeLine = (lineIndex, values) => {
    const output = [...values];
    if (direction === "right" || direction === "down") output.reverse();
    for (let cellIndex = 0; cellIndex < size; cellIndex += 1) {
      if (direction === "left" || direction === "right") {
        next[lineIndex][cellIndex] = output[cellIndex];
      } else {
        next[cellIndex][lineIndex] = output[cellIndex];
      }
    }
  };

  for (let lineIndex = 0; lineIndex < size; lineIndex += 1) {
    const result = mergeLine(readLine(lineIndex));
    writeLine(lineIndex, result.line);
    moved ||= result.moved;
    gained += result.gained;
  }

  return { grid: next, moved, gained };
}

export function neighbors(index, size) {
  const row = Math.floor(index / size);
  const column = index % size;
  const result = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const neighborRow = row + rowOffset;
      const neighborColumn = column + columnOffset;
      if (
        neighborRow >= 0 &&
        neighborRow < size &&
        neighborColumn >= 0 &&
        neighborColumn < size
      ) {
        result.push(neighborRow * size + neighborColumn);
      }
    }
  }
  return result;
}

export function createMinesBoard(size = 5, mineCount = 5, random = Math.random) {
  const total = size * size;
  const mineIndexes = new Set(shuffle([...Array(total).keys()], random).slice(0, mineCount));
  return [...Array(total).keys()].map((index) => ({
    mine: mineIndexes.has(index),
    revealed: false,
    flagged: false,
    nearby: neighbors(index, size).filter((neighbor) => mineIndexes.has(neighbor)).length,
  }));
}

export function canMerge(grid) {
  const size = grid.length;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const value = grid[row][column];
      if (value === 0) return true;
      if (column + 1 < size && grid[row][column + 1] === value) return true;
      if (row + 1 < size && grid[row + 1][column] === value) return true;
    }
  }
  return false;
}
