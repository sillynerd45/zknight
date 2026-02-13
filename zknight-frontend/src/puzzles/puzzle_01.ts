import type {Puzzle} from '../game/types';

/**
 * Puzzle 01 — "The First Fork"
 *
 * Adapted from spec Section 6 to the fixed 11×7 grid.
 *
 * Layout (11 wide × 7 tall):
 *
 *   0 1 2 3 4 5 6 7 8 9 10
 * 0 . . . . . X . . . . .    X = static TNT
 * 1 . . . █ . . . . . . .    █ = wall
 * 2 . . . █ . . . . . . .
 * 3 A . . █ . * . █ . . B    A/B = knights, * = moving barrel zone
 * 4 . . . . . . . █ . . .
 * 5 . . . . . . . █ . . .
 * 6 . . . . . X . . . . .
 */
const puzzle01: Puzzle = {
    id: 'puzzle_01',
    name: 'The First Fork',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 3},
    knightB: {x: 10, y: 3},

    goalA: {x: 10, y: 3}, // where A needs to reach (B's start)
    goalB: {x: 0, y: 3}, // where B needs to reach (A's start)

    walls: [
        {x: 3, y: 1},
        {x: 3, y: 2},
        {x: 3, y: 3},
        {x: 7, y: 3},
        {x: 7, y: 4},
        {x: 7, y: 5},
    ],

    staticTNT: [
        {x: 5, y: 0},
        {x: 5, y: 6},
    ],

    movingTNT: [
        {
            id: 'barrel_1',
            path: [
                {x: 4, y: 3},
                {x: 5, y: 3},
                {x: 6, y: 3},
                {x: 5, y: 3},
            ],
            loop: true,
        },
    ],
};

export default puzzle01;
