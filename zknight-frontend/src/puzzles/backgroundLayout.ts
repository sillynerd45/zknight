import type {Position} from '@/game/types';

/**
 * Decoration positions for the island background.
 *
 * Coordinates are relative to the GROUND GRID origin (the 13×9 nine-slice area).
 * The play area (11×7) starts at (1, 1) within this grid.
 *
 * Ground grid layout (13 wide × 9 tall):
 *
 *    0  1  2  3  4  5  6  7  8  9  10 11 12
 * 0  T  .  B  .  .  .  .  .  .  B  .  .  T     <- border row
 * 1  .  ┌──────── play area ────────┐  .  B     <- border + play row 0
 * 2  B  │                           │  .  .
 * 3  .  │                           │  .  .
 * 4  T  │         11 × 7            │  .  T
 * 5  .  │                           │  .  .
 * 6  .  │                           │  B  .
 * 7  B  └───────────────────────────┘  .  .     <- border + play row 6
 * 8  T  .  .  B  .  .  .  .  .  .  B  .  T     <- border row
 *
 * Trees (192×192) center on their tile but visually overflow — they
 * create the island canopy silhouette viewed from above the water.
 * Bushes (128×128) are smaller and fill gaps between trees.
 */

export const TREE_POSITIONS: Position[] = [
    // Corners — anchor the island shape
    {x: 0, y: 0},
    {x: 12, y: 0},
    {x: 0, y: 8},
    {x: 12, y: 8},

    // Mid-edges — break up the straight lines
    {x: 0, y: 4},   // left midpoint
    {x: 12, y: 4},  // right midpoint

    // Asymmetric extras — organic, not symmetric
    {x: 5, y: 0},   // top, slightly left of center
    {x: 8, y: 8},   // bottom, slightly right of center
];

export const BUSH_POSITIONS: Position[] = [
    // Top edge
    {x: 2, y: 0},
    {x: 9, y: 0},

    // Bottom edge
    {x: 3, y: 8},
    {x: 10, y: 8},

    // Left edge
    {x: 0, y: 2},
    {x: 0, y: 7},

    // Right edge
    {x: 12, y: 1},
    {x: 12, y: 6},
];
