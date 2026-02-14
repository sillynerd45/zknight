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
    tickCount: 0,
    tickHistory: [],
    turnCount: 0,  // Actual player moves (excludes NoOps)
    gameStatus: 'idle',
    startTime: null,
    explodedKnights: { knightA: false, knightB: false },
    destroyedStaticTNT: [],
    crossingExplosionPos: null,
  };
}
