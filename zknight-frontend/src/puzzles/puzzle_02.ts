import type {Puzzle} from '../game/types';

/**
 * Puzzle 02 — "The Broken Mirror"
 *
 * Teaches asymmetric wall anchoring — knights can desync.
 *
 * Layout (11 wide × 7 tall):
 *
 *   0 1 2 3 4 5 6 7 8 9 10
 * 0 . . . . . . . . . . .
 * 1 . . █ . . X . . . . .    X = static TNT
 * 2 . . . . █ . . . █ . .    █ = wall
 * 3 A . . █ . . . . . . B    A/B = knights
 * 4 . . . . . . . █ . . .
 * 5 . █ . . . X . . . █ .
 * 6 . . . . . . . . . . .
 */
const puzzle02: Puzzle = {
    id: 'puzzle_02',
    name: 'The Broken Mirror',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 3},
    knightB: {x: 10, y: 3},

    goalA: {x: 10, y: 3}, // where A needs to reach (B's start)
    goalB: {x: 0, y: 3}, // where B needs to reach (A's start)

    walls: [
        {x: 2, y: 1},
        {x: 4, y: 2},
        {x: 3, y: 3},
        {x: 8, y: 2},
        {x: 7, y: 4},
        {x: 1, y: 5},
        {x: 9, y: 5},
    ],

    staticTNT: [
        {x: 5, y: 1},
        {x: 5, y: 5},
    ],

    movingTNT: [],
};

export default puzzle02;
