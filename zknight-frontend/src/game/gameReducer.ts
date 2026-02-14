import type { Direction, GameState, Puzzle, MoveValue } from './types';
import { MOVE_TO_DIRECTION_VECTOR } from './directionMap';
import { processTurn } from './processTurn';
import { initGameState } from './initGameState';
import { advanceBarrels } from './barrels';

export interface ReducerState extends GameState {
  lastDirection: Direction | null;
  // _cyclePruned removed - cycle detection disabled
}

export type GameAction =
  | { type: 'TICK'; move: MoveValue; direction: Direction | null }
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
    case 'TICK': {
      if (state.gameStatus !== 'playing') return state;

      const newTickCount = state.tickCount + 1;

      // Step 1: Advance barrels if even tick and not tick 0
      let newBarrels = state.barrels;
      if (newTickCount > 0 && newTickCount % 2 === 0) {
        newBarrels = advanceBarrels(state.barrels);
      }

      // Step 2: Get direction vector (or null for NoOp)
      const dir = action.move === 4
        ? null
        : MOVE_TO_DIRECTION_VECTOR[action.move];

      // Step 3: Process knight movement + collision (pass pre-advanced barrels)
      const afterTurn = processTurn(state, dir, puzzle, newBarrels);

      // Step 4: Increment turnCount only for actual moves (not NoOps)
      const newTurnCount = action.move === 4
        ? state.turnCount  // NoOp - don't increment turnCount
        : afterTurn.turnCount;  // Real move - processTurn already incremented it

      const newTickHistory = [...state.tickHistory, action.move];

      // Debug: Log complete tick history when puzzle is solved
      if (afterTurn.gameStatus === 'won') {
        console.log('[ZK DEBUG] ========================================');
        console.log('[ZK DEBUG] COMPLETE SOLUTION - Ready for Circuit');
        console.log('[ZK DEBUG] ========================================');
        console.log('[ZK DEBUG] Final tick count:', newTickCount);
        console.log('[ZK DEBUG] Final turn count:', newTurnCount);
        console.log('[ZK DEBUG] Complete tick history (length=' + newTickHistory.length + '):');
        console.log(JSON.stringify(newTickHistory));
        console.log('[ZK DEBUG] ========================================');
      }

      return {
        ...afterTurn,
        barrels: newBarrels,
        tickCount: newTickCount,
        tickHistory: newTickHistory,
        turnCount: newTurnCount,
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
    case 'IDLE':
      return { ...state, lastDirection: null };
    default:
      return state;
  }
}
