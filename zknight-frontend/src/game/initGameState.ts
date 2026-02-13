import type { GameState, Puzzle } from './types';
// cycleDetection import removed - cycle detection disabled

export function initGameState(puzzle: Puzzle): GameState {
  const knightA = { ...puzzle.knightA };
  const knightB = { ...puzzle.knightB };
  const barrels = puzzle.movingTNT.map((b) => ({ ...b, step: 0 }));

  return {
    knightA,
    knightB,
    barrels,
    moveHistory: [],
    turnCount: 0,
    gameStatus: 'idle',
    startTime: null,
  };
}
