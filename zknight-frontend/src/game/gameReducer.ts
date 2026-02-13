import type { Direction, DirectionVector, GameState, Puzzle } from './types';
import { processTurn } from './processTurn';
import { initGameState } from './initGameState';
// detectAndPruneCycle import removed - cycle detection disabled
import { advanceBarrels } from './barrels';
import { isDeadly } from './collision';
import { getBarrelPositions } from './barrels';
import { isSamePosition } from './position';

export interface ReducerState extends GameState {
  lastDirection: Direction | null;
  // _cyclePruned removed - cycle detection disabled
}

export type GameAction =
  | { type: 'MOVE'; dir: DirectionVector; direction: Direction }
  | { type: 'ADVANCE_BARRELS' }
  | { type: 'RESET' }
  | { type: 'START' }
  | { type: 'IDLE' };

export function createInitialState(puzzle: Puzzle): ReducerState {
  return { ...initGameState(puzzle), lastDirection: null };
}

export function gameReducer(
  state: ReducerState,
  action: GameAction,
  puzzle: Puzzle,
): ReducerState {
  switch (action.type) {
    case 'MOVE': {
      const afterTurn = processTurn(state, action.dir, puzzle);
      // Cycle detection disabled - move counter increases indefinitely
      return {
        ...afterTurn,
        lastDirection: action.direction,
      };
    }
    case 'RESET':
      return createInitialState(puzzle);
    case 'START':
      return {
        ...state,
        gameStatus: 'playing',
        startTime: Date.now(),
      };
    case 'ADVANCE_BARRELS': {
      if (state.gameStatus !== 'playing') return state;

      const newBarrels = advanceBarrels(state.barrels);
      const barrelPositions = getBarrelPositions(newBarrels);

      // Check if any barrel moved into a knight's position
      const exploded =
        isDeadly(state.knightA, puzzle.staticTNT, barrelPositions) ||
        isDeadly(state.knightB, puzzle.staticTNT, barrelPositions);

      if (exploded) {
        return {
          ...state,
          barrels: newBarrels,
          gameStatus: 'exploded',
        };
      }

      return { ...state, barrels: newBarrels };
    }
    case 'IDLE':
      return { ...state, lastDirection: null };
    default:
      return state;
  }
}
