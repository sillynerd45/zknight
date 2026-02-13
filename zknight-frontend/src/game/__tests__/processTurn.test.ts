import { describe, it, expect } from 'vitest';
import { processTurn } from '../processTurn';
import { initGameState } from '../initGameState';
import { advanceBarrels, getBarrelPositions } from '../barrels';
import { encodeState, detectAndPruneCycle } from '../cycleDetection';
import type { Puzzle, GameState } from '../types';
import { DIRECTION_MAP } from '../directionMap';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RIGHT = DIRECTION_MAP.ArrowRight; // A: +x, B: -x
const LEFT = DIRECTION_MAP.ArrowLeft; // A: -x, B: +x
const UP = DIRECTION_MAP.ArrowUp; // A: -y, B: +y
const DOWN = DIRECTION_MAP.ArrowDown; // A: +y, B: -y

/** Base puzzle: 5×5, no hazards, no walls */
const basePuzzle: Puzzle = {
  id: 'test',
  name: 'Test',
  gridWidth: 5,
  gridHeight: 5,
  knightA: { x: 0, y: 2 },
  knightB: { x: 4, y: 2 },
  goalA: { x: 4, y: 2 },
  goalB: { x: 0, y: 2 },
  walls: [],
  staticTNT: [],
  movingTNT: [],
};

function makePuzzle(overrides: Partial<Puzzle>): Puzzle {
  return { ...basePuzzle, ...overrides };
}

/** Create a GameState in 'playing' status from a puzzle */
function playingState(puzzle: Puzzle): GameState {
  return { ...initGameState(puzzle), gameStatus: 'playing' };
}

// ---------------------------------------------------------------------------
// processTurn
// ---------------------------------------------------------------------------

describe('processTurn', () => {
  it('moves both knights correctly on ArrowRight', () => {
    const state = playingState(basePuzzle);
    const next = processTurn(state, RIGHT, basePuzzle);

    // A moves right: (0,2) → (1,2)
    expect(next.knightA).toEqual({ x: 1, y: 2 });
    // B moves left: (4,2) → (3,2)
    expect(next.knightB).toEqual({ x: 3, y: 2 });
    expect(next.turnCount).toBe(1);
    expect(next.gameStatus).toBe('playing');
    expect(next.moveHistory).toHaveLength(1);
  });

  it('blocks knight A with wall while knight B still moves', () => {
    // Wall directly to A's right — A is blocked, B is free
    const puzzle = makePuzzle({ walls: [{ x: 1, y: 2 }] });
    const state = playingState(puzzle);
    const next = processTurn(state, RIGHT, puzzle);

    // A tries (1,2) = wall → stays at (0,2)
    expect(next.knightA).toEqual({ x: 0, y: 2 });
    // B moves left: (4,2) → (3,2)
    expect(next.knightB).toEqual({ x: 3, y: 2 });
    expect(next.gameStatus).toBe('playing');
  });

  it('detects knight collision → exploded', () => {
    // 3×1 grid: A at (0,0), B at (2,0). Press RIGHT → both land on (1,0)
    const puzzle = makePuzzle({
      gridWidth: 3,
      gridHeight: 1,
      knightA: { x: 0, y: 0 },
      knightB: { x: 2, y: 0 },
      goalA: { x: 2, y: 0 },
      goalB: { x: 0, y: 0 },
    });
    const state = playingState(puzzle);
    const next = processTurn(state, RIGHT, puzzle);

    // A → (1,0), B → (1,0) — collision
    expect(next.knightA).toEqual({ x: 1, y: 0 });
    expect(next.knightB).toEqual({ x: 1, y: 0 });
    expect(next.gameStatus).toBe('exploded');
  });

  it('detects knight hitting static TNT → exploded', () => {
    // TNT at (1,2) — A moves right into it
    const puzzle = makePuzzle({ staticTNT: [{ x: 1, y: 2 }] });
    const state = playingState(puzzle);
    const next = processTurn(state, RIGHT, puzzle);

    // A moves to (1,2) = static TNT
    expect(next.knightA).toEqual({ x: 1, y: 2 });
    expect(next.gameStatus).toBe('exploded');
  });

  it('detects knight hitting moving barrel → exploded', () => {
    // Barrel is at (1,2). Knight A moves right to (1,2) and hits it.
    const puzzle = makePuzzle({
      movingTNT: [
        {
          id: 'b1',
          path: [
            { x: 1, y: 2 },
            { x: 2, y: 2 },
          ],
          loop: true,
        },
      ],
    });
    const state = playingState(puzzle);
    // Barrel is at step 0 (position 1,2)
    const next = processTurn(state, RIGHT, puzzle);

    // A moves to (1,2) — hits barrel at current position
    expect(next.knightA).toEqual({ x: 1, y: 2 });
    expect(next.gameStatus).toBe('exploded');
  });

  it('triggers win condition when both knights reach goals', () => {
    // A one step from goalA, B one step from goalB
    const puzzle = makePuzzle({
      knightA: { x: 3, y: 2 },
      knightB: { x: 1, y: 2 },
    });
    const state = playingState(puzzle);
    const next = processTurn(state, RIGHT, puzzle);

    // A → (4,2) = goalA, B → (0,2) = goalB
    expect(next.knightA).toEqual({ x: 4, y: 2 });
    expect(next.knightB).toEqual({ x: 0, y: 2 });
    expect(next.gameStatus).toBe('won');
  });

  it('does not process turns when game is not playing', () => {
    const state = initGameState(basePuzzle); // gameStatus = 'idle'
    const next = processTurn(state, RIGHT, basePuzzle);

    expect(next).toBe(state); // exact same reference — no change
  });
});

// ---------------------------------------------------------------------------
// Barrel advancement
// ---------------------------------------------------------------------------

describe('advanceBarrels', () => {
  it('advances barrel one step per turn and loops', () => {
    const barrels = [
      {
        id: 'b1',
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        loop: true,
        step: 0,
      },
    ];

    const after1 = advanceBarrels(barrels);
    expect(after1[0].step).toBe(1);
    expect(getBarrelPositions(after1)).toEqual([{ x: 1, y: 0 }]);

    const after2 = advanceBarrels(after1);
    expect(after2[0].step).toBe(2);
    expect(getBarrelPositions(after2)).toEqual([{ x: 2, y: 0 }]);

    // Wraps back to 0
    const after3 = advanceBarrels(after2);
    expect(after3[0].step).toBe(0);
    expect(getBarrelPositions(after3)).toEqual([{ x: 0, y: 0 }]);
  });

  it('does not move non-looping barrels', () => {
    const barrels = [
      {
        id: 'b1',
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        loop: false,
        step: 0,
      },
    ];

    const after = advanceBarrels(barrels);
    expect(after[0].step).toBe(0);
  });

  it('does not mutate the input array', () => {
    const barrels = [
      {
        id: 'b1',
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        loop: true,
        step: 0,
      },
    ];

    const after = advanceBarrels(barrels);
    expect(barrels[0].step).toBe(0); // original unchanged
    expect(after[0].step).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Cycle detection
// ---------------------------------------------------------------------------

describe('cycleDetection', () => {
  it('encodes state correctly', () => {
    const key = encodeState(
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      [{ id: 'b1', path: [{ x: 0, y: 0 }], loop: true, step: 5 }],
    );
    expect(key).toBe('1,2|3,4|5');
  });

  it('detects and prunes a cycle', () => {
    const puzzle = makePuzzle({
      knightA: { x: 1, y: 2 },
      knightB: { x: 3, y: 2 },
    });
    let state = playingState(puzzle);

    // Record initial state
    const { state: s0 } = detectAndPruneCycle(state);
    state = s0;

    // Move right: A→(2,2), B→(2,2) — wait, they'd collide.
    // Let's use UP then DOWN to create a position cycle on a no-barrier puzzle.
    // UP: A goes (1,1), B goes (3,3)
    state = processTurn(state, UP, puzzle);
    const { state: s1 } = detectAndPruneCycle(state);
    state = s1;

    // DOWN: A goes (1,2), B goes (3,2) — back to start!
    state = processTurn(state, DOWN, puzzle);
    const { state: s2, pruned } = detectAndPruneCycle(state);

    expect(pruned).toBe(true);
    expect(s2.turnCount).toBe(0);
    expect(s2.moveHistory).toHaveLength(0);
  });

  it('does not prune when no cycle exists', () => {
    const puzzle = makePuzzle({});
    let state = playingState(puzzle);

    const { state: s0 } = detectAndPruneCycle(state);
    state = s0;

    state = processTurn(state, RIGHT, puzzle);
    const { state: s1, pruned } = detectAndPruneCycle(state);

    expect(pruned).toBe(false);
    expect(s1.turnCount).toBe(1);
    expect(s1.moveHistory).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Grid boundary
// ---------------------------------------------------------------------------

describe('grid boundary', () => {
  it('treats out-of-bounds like a wall — knight stays', () => {
    // A at left edge (0,2), press LEFT → A tries (-1,2), stays at (0,2)
    const state = playingState(basePuzzle);
    const next = processTurn(state, LEFT, basePuzzle);

    // A stays (out of bounds)
    expect(next.knightA).toEqual({ x: 0, y: 2 });
    // B at right edge (4,2), B direction on LEFT is +x → (5,2) out of bounds, stays
    expect(next.knightB).toEqual({ x: 4, y: 2 });
  });
});
