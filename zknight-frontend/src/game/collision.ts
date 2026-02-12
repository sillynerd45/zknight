import type { Position } from './types';
import { isSamePosition } from './position';

export function isWall(pos: Position, walls: Position[]): boolean {
  return walls.some((w) => isSamePosition(pos, w));
}

export function isStaticTNT(pos: Position, staticTNT: Position[]): boolean {
  return staticTNT.some((t) => isSamePosition(pos, t));
}

export function isBarrel(pos: Position, barrelPositions: Position[]): boolean {
  return barrelPositions.some((b) => isSamePosition(pos, b));
}

export function isDeadly(
  pos: Position,
  staticTNT: Position[],
  barrelPositions: Position[],
): boolean {
  return isStaticTNT(pos, staticTNT) || isBarrel(pos, barrelPositions);
}
