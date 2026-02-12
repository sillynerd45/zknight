import type { DirectionVector, GameState, Puzzle } from './types';
import { advanceBarrels, getBarrelPositions } from './barrels';
import { isWall, isDeadly } from './collision';
import { isSamePosition, isInBounds } from './position';

export function processTurn(
  state: GameState,
  dir: DirectionVector,
  puzzle: Puzzle,
): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Step 1: Advance all moving barrels
  const newBarrels = advanceBarrels(state.barrels);

  // Step 2: Calculate intended next positions
  const nextA = { x: state.knightA.x + dir.ax, y: state.knightA.y + dir.ay };
  const nextB = { x: state.knightB.x + dir.bx, y: state.knightB.y + dir.by };

  // Step 3: Boundary check — out-of-bounds treated like walls (knight stays)
  const boundedA = isInBounds(nextA, puzzle.gridWidth, puzzle.gridHeight)
    ? nextA
    : state.knightA;
  const boundedB = isInBounds(nextB, puzzle.gridWidth, puzzle.gridHeight)
    ? nextB
    : state.knightB;

  // Step 4: Wall check — if blocked, knight stays
  const resolvedA = isWall(boundedA, puzzle.walls) ? state.knightA : boundedA;
  const resolvedB = isWall(boundedB, puzzle.walls) ? state.knightB : boundedB;

  // Step 5: Collision checks
  const barrelPositions = getBarrelPositions(newBarrels);
  const exploded =
    isSamePosition(resolvedA, resolvedB) ||
    isDeadly(resolvedA, puzzle.staticTNT, barrelPositions) ||
    isDeadly(resolvedB, puzzle.staticTNT, barrelPositions);

  if (exploded) {
    return {
      ...state,
      knightA: resolvedA,
      knightB: resolvedB,
      barrels: newBarrels,
      moveHistory: [...state.moveHistory, dir],
      turnCount: state.turnCount + 1,
      gameStatus: 'exploded',
    };
  }

  // Step 6: Check win condition
  const won =
    isSamePosition(resolvedA, puzzle.goalA) &&
    isSamePosition(resolvedB, puzzle.goalB);

  return {
    ...state,
    knightA: resolvedA,
    knightB: resolvedB,
    barrels: newBarrels,
    moveHistory: [...state.moveHistory, dir],
    turnCount: state.turnCount + 1,
    gameStatus: won ? 'won' : 'playing',
  };
}
