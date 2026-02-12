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

export type GameStatus = 'idle' | 'playing' | 'exploded' | 'won';

export interface GameState {
  knightA: Position;
  knightB: Position;
  barrels: MovingBarrel[];
  moveHistory: DirectionVector[];
  turnCount: number;
  gameStatus: GameStatus;
  startTime: number | null;
  stateHistory: Map<string, number>;
}
