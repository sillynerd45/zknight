import type { GameState, MovingBarrel, Position } from './types';

export function encodeState(
  knightA: Position,
  knightB: Position,
  barrels: MovingBarrel[],
): string {
  const barrelSteps = barrels.map((b) => b.step).join(',');
  return `${knightA.x},${knightA.y}|${knightB.x},${knightB.y}|${barrelSteps}`;
}

export function detectAndPruneCycle(state: GameState): {
  state: GameState;
  pruned: boolean;
} {
  const key = encodeState(state.knightA, state.knightB, state.barrels);
  const previousTurn = state.stateHistory.get(key);

  if (previousTurn !== undefined) {
    // Cycle detected — prune moves between previousTurn and current
    const newStateHistory = new Map<string, number>();
    for (const [k, v] of state.stateHistory) {
      if (v <= previousTurn) newStateHistory.set(k, v);
    }

    return {
      state: {
        ...state,
        moveHistory: state.moveHistory.slice(0, previousTurn),
        turnCount: previousTurn,
        stateHistory: newStateHistory,
      },
      pruned: true,
    };
  }

  // No cycle — record current state
  const newStateHistory = new Map(state.stateHistory);
  newStateHistory.set(key, state.turnCount);

  return {
    state: { ...state, stateHistory: newStateHistory },
    pruned: false,
  };
}
