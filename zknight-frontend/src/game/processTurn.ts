import type { DirectionVector, GameState, Puzzle, Position, MovingBarrel } from './types';
import { getBarrelPositions } from './barrels';
import { isWall, isStaticTNT, isBarrel } from './collision';
import { isSamePosition, isInBounds } from './position';

export function processTurn(
  state: GameState,
  dir: DirectionVector | null,  // null = NoOp (knights don't move)
  puzzle: Puzzle,
  barrelOverride?: MovingBarrel[],  // If provided, use these barrels instead of state.barrels
): GameState {
  if (state.gameStatus !== 'playing') return state;

  // Use override barrels if provided (for tick-based model where barrels are pre-advanced)
  // Otherwise use state barrels (for backward compatibility with tests)
  const barrels = barrelOverride ?? state.barrels;
  const barrelPositions = getBarrelPositions(barrels);

  // Filter out already destroyed static TNT
  const activeStaticTNT = puzzle.staticTNT.filter(
    tnt => !state.destroyedStaticTNT.some(destroyed => isSamePosition(tnt, destroyed))
  );

  // If NoOp (no player input), knights don't move — but check barrel-into-knight collision
  if (dir === null) {
    const knightAHitBarrel = isBarrel(state.knightA, barrelPositions);
    const knightBHitBarrel = isBarrel(state.knightB, barrelPositions);
    const anyExplosion = knightAHitBarrel || knightBHitBarrel;

    if (anyExplosion) {
      // Remove destroyed moving barrels
      const newBarrels = barrels.filter(barrel => {
        const barrelPos = barrel.path[barrel.step];
        const hitByA = knightAHitBarrel && isSamePosition(state.knightA, barrelPos);
        const hitByB = knightBHitBarrel && isSamePosition(state.knightB, barrelPos);
        return !(hitByA || hitByB);
      });

      return {
        ...state,
        barrels: newBarrels,
        gameStatus: 'exploded',
        explodedKnights: { knightA: knightAHitBarrel, knightB: knightBHitBarrel },
      };
    }
    return state; // No movement, no collision
  }

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
  // (barrelPositions and activeStaticTNT already computed above)

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
    const newBarrels = barrels.filter(barrel => {
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
      turnCount: state.turnCount + 1,  // Increment turn count (actual moves, not ticks)
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

  if (won) {
    // Debug: export tick history for ZK circuit testing
    // The current tick's move value will be added by the TICK reducer
    console.log('[ZK DEBUG] Puzzle solved!');
    console.log('[ZK DEBUG] Tick count:', state.tickCount + 1);
    console.log('[ZK DEBUG] Turn count (actual moves):', state.turnCount + 1);
    console.log('[ZK DEBUG] Tick history:', JSON.stringify(state.tickHistory));
    console.log('[ZK DEBUG] Note: Current tick not yet in history (added by reducer)');
  }

  return {
    ...state,
    knightA: resolvedA,
    knightB: resolvedB,
    turnCount: state.turnCount + 1,  // Increment turn count (actual moves only)
    gameStatus: won ? 'won' : 'playing',
    crossingExplosionPos: null,
  };
}
