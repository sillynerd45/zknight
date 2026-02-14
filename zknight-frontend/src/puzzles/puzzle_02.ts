import type {Puzzle} from '../game/types';

/**
 * Puzzle 02 — "The Crosspath"
 *
 * Medium difficulty — knights must navigate vertical offset while routing
 * around scattered TNT obstacles using asymmetric walls for anchoring.
 *
 * Layout (11 wide × 7 tall):
 *
 *   0 1 2 3 4 5 6 7 8 9 10
 * 0 . . . . . . . . . . .
 * 1 . . █ . █ . . . █ . .
 * 2 A . . █ . . X . . . .    A = Knight A
 * 3 . █ . . . . . █ . █ .    B = Knight B
 * 4 . . . . X . . . █ . B    █ = wall
 * 5 . . █ . . . █ . X . .    X = static TNT
 * 6 . . . . . . . . . . .
 */
const puzzle02: Puzzle = {
    id: 'puzzle_02',
    name: 'The Crosspath',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 2},
    knightB: {x: 10, y: 4},

    goalA: {x: 10, y: 4}, // where A needs to reach (B's start)
    goalB: {x: 0, y: 2}, // where B needs to reach (A's start)

    walls: [
        {x: 2, y: 1},
        {x: 4, y: 1},
        {x: 8, y: 1},
        {x: 3, y: 2},
        {x: 1, y: 3},
        {x: 7, y: 3},
        {x: 9, y: 3},
        {x: 8, y: 4},
        {x: 2, y: 5},
        {x: 6, y: 5},
    ],

    staticTNT: [
        {x: 6, y: 2},
        {x: 4, y: 4},
        {x: 8, y: 5},
    ],

    movingTNT: [],
};

export default puzzle02;
