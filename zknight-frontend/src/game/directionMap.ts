import type { Direction, DirectionVector } from './types';

export const DIRECTION_MAP: Record<Direction, DirectionVector> = {
  ArrowRight: { ax: 1, ay: 0, bx: -1, by: 0 },
  ArrowLeft: { ax: -1, ay: 0, bx: 1, by: 0 },
  ArrowDown: { ax: 0, ay: 1, bx: 0, by: -1 },
  ArrowUp: { ax: 0, ay: -1, bx: 0, by: 1 },
};
