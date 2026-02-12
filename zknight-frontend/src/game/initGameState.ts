import type { GameState, Puzzle } from './types';
import { encodeState } from './cycleDetection';

export function initGameState(puzzle: Puzzle): GameState {
  const knightA = { ...puzzle.knightA };
  const knightB = { ...puzzle.knightB };
  const barrels = puzzle.movingTNT.map((b) => ({ ...b, step: 0 }));

  const stateHistory = new Map<string, number>();
  stateHistory.set(encodeState(knightA, knightB, barrels), 0);

  return {
    knightA,
    knightB,
    barrels,
    moveHistory: [],
    turnCount: 0,
    gameStatus: 'idle',
    startTime: null,
    stateHistory,
  };
}
