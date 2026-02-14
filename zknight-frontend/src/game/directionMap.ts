import type { Direction, DirectionVector } from './types';

export const DIRECTION_MAP: Record<Direction, DirectionVector> = {
  ArrowRight: { ax: 1, ay: 0, bx: -1, by: 0 },
  ArrowLeft: { ax: -1, ay: 0, bx: 1, by: 0 },
  ArrowDown: { ax: 0, ay: 1, bx: 0, by: -1 },
  ArrowUp: { ax: 0, ay: -1, bx: 0, by: 1 },
};

// MoveValue → DirectionVector mapping (for converting circuit format to game logic)
// 0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp
export const MOVE_TO_DIRECTION_VECTOR: Record<number, DirectionVector> = {
  0: { ax: 0, ay: -1, bx: 0, by: 1 },   // Up
  1: { ax: 0, ay: 1, bx: 0, by: -1 },    // Down
  2: { ax: -1, ay: 0, bx: 1, by: 0 },    // Left
  3: { ax: 1, ay: 0, bx: -1, by: 0 },    // Right
};
