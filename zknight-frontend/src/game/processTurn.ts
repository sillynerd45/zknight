import type { DirectionVector, GameState, Puzzle, Position } from './types';
import { getBarrelPositions } from './barrels';
import { isWall, isStaticTNT, isBarrel } from './collision';
import { isSamePosition, isInBounds } from './position';

export function processTurn(
  state: GameState,
  dir: DirectionVector,
  puzzle: Puzzle,
): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Note: Barrels are advanced independently by a timer now (via ADVANCE_BARRELS action)
  // We check collision against the current barrel state

  // Step 1: Calculate intended next positions
  const nextA = { x: state.knightA.x + dir.ax, y: state.knightA.y + dir.ay };
  const nextB = { x: state.knightB.x + dir.bx, y: state.knightB.y + dir.by };

  // Step 2: Boundary check — out-of-bounds treated like walls (knight stays)
  const boundedA = isInBounds(nextA, puzzle.gridWidth, puzzle.gridHeight)
    ? nextA
    : state.knightA;
  const boundedB = isInBounds(nextB, puzzle.gridWidth, puzzle.gridHeight)
    ? nextB
    : state.knightB;

  // Step 3: Wall check — if blocked, knight stays
  const resolvedA = isWall(boundedA, puzzle.walls) ? state.knightA : boundedA;
  const resolvedB = isWall(boundedB, puzzle.walls) ? state.knightB : boundedB;

  // Step 4: Check each knight separately for collisions
  const barrelPositions = getBarrelPositions(state.barrels);

  // Filter out already destroyed static TNT
  const activeStaticTNT = puzzle.staticTNT.filter(
    tnt => !state.destroyedStaticTNT.some(destroyed => isSamePosition(tnt, destroyed))
  );

  // Check knight-knight collision (both explode if they collide)
  const knightsCollided = isSamePosition(resolvedA, resolvedB);

  // Check if knights are crossing (swapping positions)
  const knightsCrossing =
    !knightsCollided &&
    isSamePosition(state.knightA, resolvedB) &&
    isSamePosition(state.knightB, resolvedA);

  // Calculate midpoint position for crossing explosion
  const crossingExplosionPos = knightsCrossing
    ? {
        x: (state.knightA.x + state.knightB.x) / 2,
        y: (state.knightA.y + state.knightB.y) / 2,
      }
    : null;

  // Check Knight A collisions
  const knightAHitStaticTNT = isStaticTNT(resolvedA, activeStaticTNT);
  const knightAHitBarrel = isBarrel(resolvedA, barrelPositions);
  const knightAExploded = knightsCollided || knightsCrossing || knightAHitStaticTNT || knightAHitBarrel;

  // Check Knight B collisions
  const knightBHitStaticTNT = isStaticTNT(resolvedB, activeStaticTNT);
  const knightBHitBarrel = isBarrel(resolvedB, barrelPositions);
  const knightBExploded = knightsCollided || knightsCrossing || knightBHitStaticTNT || knightBHitBarrel;

  const anyExplosion = knightAExploded || knightBExploded;

  if (anyExplosion) {
    // Track destroyed obstacles
    const newDestroyedStaticTNT = [...state.destroyedStaticTNT];
    if (knightAHitStaticTNT) {
      const hitTNT = activeStaticTNT.find(tnt => isSamePosition(resolvedA, tnt));
      if (hitTNT) newDestroyedStaticTNT.push(hitTNT);
    }
    if (knightBHitStaticTNT) {
      const hitTNT = activeStaticTNT.find(tnt => isSamePosition(resolvedB, tnt));
      if (hitTNT && !newDestroyedStaticTNT.some(d => isSamePosition(d, hitTNT))) {
        newDestroyedStaticTNT.push(hitTNT);
      }
    }

    // Remove destroyed moving barrels
    const newBarrels = state.barrels.filter(barrel => {
      const barrelPos = barrel.path[barrel.step];
      const hitByA = knightAHitBarrel && isSamePosition(resolvedA, barrelPos);
      const hitByB = knightBHitBarrel && isSamePosition(resolvedB, barrelPos);
      return !(hitByA || hitByB);
    });

    return {
      ...state,
      // If crossing, keep knights at original positions (they disappear immediately)
      // Otherwise, move to resolved positions
      knightA: knightsCrossing ? state.knightA : resolvedA,
      knightB: knightsCrossing ? state.knightB : resolvedB,
      barrels: newBarrels,
      moveHistory: [...state.moveHistory, dir],
      turnCount: state.turnCount + 1,
      gameStatus: 'exploded',
      explodedKnights: { knightA: knightAExploded, knightB: knightBExploded },
      destroyedStaticTNT: newDestroyedStaticTNT,
      crossingExplosionPos,
    };
  }

  // Step 5: Check win condition
  const won =
    isSamePosition(resolvedA, puzzle.goalA) &&
    isSamePosition(resolvedB, puzzle.goalB);

  return {
    ...state,
    knightA: resolvedA,
    knightB: resolvedB,
    moveHistory: [...state.moveHistory, dir],
    turnCount: state.turnCount + 1,
    gameStatus: won ? 'won' : 'playing',
    crossingExplosionPos: null,
  };
}
