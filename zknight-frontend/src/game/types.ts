export interface Position {
  x: number;
  y: number;
}

export interface MovingBarrel {
  id: string;
  path: Position[];
  loop: boolean;
  step: number; // runtime state — current index in path
}

export interface Puzzle {
  id: string;
  name: string;
  gridWidth: number; // always 11
  gridHeight: number; // always 7
  knightA: Position;
  knightB: Position;
  goalA: Position; // where A needs to reach (B's start)
  goalB: Position; // where B needs to reach (A's start)
  walls: Position[];
  staticTNT: Position[];
  movingTNT: Omit<MovingBarrel, 'step'>[];
}

export type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export interface DirectionVector {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

// Tick-based model: move values for ZK circuit
export type MoveValue = 0 | 1 | 2 | 3 | 4;  // 0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp

// Direction → MoveValue mapping (for converting player input to circuit format)
export const DIRECTION_TO_MOVE: Record<Direction, MoveValue> = {
  ArrowUp: 0,
  ArrowDown: 1,
  ArrowLeft: 2,
  ArrowRight: 3,
};

export type GameStatus = 'idle' | 'playing' | 'exploded' | 'won';

export interface GameState {
  knightA: Position;
  knightB: Position;
  barrels: MovingBarrel[];
  tickCount: number;           // Total ticks elapsed (including NoOps)
  tickHistory: MoveValue[];    // 0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp (for ZK circuit)
  turnCount: number;           // Actual player moves only (excludes NoOps) - for UI display
  gameStatus: GameStatus;
  startTime: number | null;
  explodedKnights: { knightA: boolean; knightB: boolean };
  destroyedStaticTNT: Position[]; // Track which static TNT have been destroyed
  crossingExplosionPos: Position | null; // Position where knights crossed (can be fractional)
  // moveHistory removed - replaced by tickHistory
  // stateHistory removed - cycle detection disabled
}
