import type { Position } from './types';

export function isSamePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isInBounds(pos: Position, w: number, h: number): boolean {
  return pos.x >= 0 && pos.x < w && pos.y >= 0 && pos.y < h;
}

export function clampPosition(pos: Position, w: number, h: number): Position {
  return {
    x: Math.max(0, Math.min(pos.x, w - 1)),
    y: Math.max(0, Math.min(pos.y, h - 1)),
  };
}
