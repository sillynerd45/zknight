import type { Direction, DirectionVector, GameState, Puzzle } from './types';
import { processTurn } from './processTurn';
import { initGameState } from './initGameState';
import { detectAndPruneCycle } from './cycleDetection';
import { advanceBarrels } from './barrels';
import { isDeadly } from './collision';
import { getBarrelPositions } from './barrels';
import { isSamePosition } from './position';

export interface ReducerState extends GameState {
  lastDirection: Direction | null;
  /** Set to true when cycle detection pruned moves on the last MOVE. */
  _cyclePruned: boolean;
}

export type GameAction =
  | { type: 'MOVE'; dir: DirectionVector; direction: Direction }
  | { type: 'ADVANCE_BARRELS' }
  | { type: 'RESET' }
  | { type: 'START' }
  | { type: 'IDLE' };

export function createInitialState(puzzle: Puzzle): ReducerState {
  return { ...initGameState(puzzle), lastDirection: null, _cyclePruned: false };
}

export function gameReducer(
  state: ReducerState,
  action: GameAction,
  puzzle: Puzzle,
): ReducerState {
  switch (action.type) {
    case 'MOVE': {
      const afterTurn = processTurn(state, action.dir, puzzle);
      // Only run cycle detection if still playing
      if (afterTurn.gameStatus === 'playing') {
        const { state: afterCycle, pruned } = detectAndPruneCycle(afterTurn);
        return {
          ...afterCycle,
          lastDirection: action.direction,
          _cyclePruned: pruned,
        };
      }
      return {
        ...afterTurn,
        lastDirection: action.direction,
        _cyclePruned: false,
      };
    }
    case 'RESET':
      return createInitialState(puzzle);
    case 'START':
      return {
        ...state,
        gameStatus: 'playing',
        startTime: Date.now(),
        _cyclePruned: false,
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
          _cyclePruned: false,
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
