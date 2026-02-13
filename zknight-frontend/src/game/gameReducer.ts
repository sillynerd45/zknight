import type { Direction, DirectionVector, GameState, Puzzle } from './types';
import { processTurn } from './processTurn';
import { initGameState } from './initGameState';
// detectAndPruneCycle import removed - cycle detection disabled
import { advanceBarrels } from './barrels';
import { isStaticTNT, isBarrel } from './collision';
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

      // Filter out already destroyed static TNT
      const activeStaticTNT = puzzle.staticTNT.filter(
        tnt => !state.destroyedStaticTNT.some(destroyed => isSamePosition(tnt, destroyed))
      );

      // Check each knight separately for collision with barrels
      const knightAHitBarrel = isBarrel(state.knightA, barrelPositions);
      const knightAHitStaticTNT = isStaticTNT(state.knightA, activeStaticTNT);
      const knightAExploded = knightAHitBarrel || knightAHitStaticTNT;

      const knightBHitBarrel = isBarrel(state.knightB, barrelPositions);
      const knightBHitStaticTNT = isStaticTNT(state.knightB, activeStaticTNT);
      const knightBExploded = knightBHitBarrel || knightBHitStaticTNT;

      const anyExplosion = knightAExploded || knightBExploded;

      if (anyExplosion) {
        // Track destroyed obstacles
        const newDestroyedStaticTNT = [...state.destroyedStaticTNT];
        if (knightAHitStaticTNT) {
          const hitTNT = activeStaticTNT.find(tnt => isSamePosition(state.knightA, tnt));
          if (hitTNT) newDestroyedStaticTNT.push(hitTNT);
        }
        if (knightBHitStaticTNT) {
          const hitTNT = activeStaticTNT.find(tnt => isSamePosition(state.knightB, tnt));
          if (hitTNT && !newDestroyedStaticTNT.some(d => isSamePosition(d, hitTNT))) {
            newDestroyedStaticTNT.push(hitTNT);
          }
        }

        // Remove barrels that hit knights
        const finalBarrels = newBarrels.filter(barrel => {
          const barrelPos = barrel.path[barrel.step];
          const hitA = knightAHitBarrel && isSamePosition(state.knightA, barrelPos);
          const hitB = knightBHitBarrel && isSamePosition(state.knightB, barrelPos);
          return !(hitA || hitB);
        });

        return {
          ...state,
          barrels: finalBarrels,
          gameStatus: 'exploded',
          explodedKnights: { knightA: knightAExploded, knightB: knightBExploded },
          destroyedStaticTNT: newDestroyedStaticTNT,
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
