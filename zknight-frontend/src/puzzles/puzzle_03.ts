import type {Puzzle} from '../game/types';

/**
 * Puzzle 03 — "The Clockwork Corridor"
 *
 * First puzzle with moving TNT barrel. Teaches timing mechanic.
 * Forces vertical traversal through all three zones with wall corridor.
 *
 * Layout (11 wide × 7 tall):
 *
 *   0 1 2 3 4 5 6 7 8 9 10
 * 0 . . █ . . X . . █ . .
 * 1 A . . . █ . █ . . . .    A = Knight A
 * 2 . . █ . . . . . █ . .    B = Knight B
 * 3 . . █ * * * * * █ . .    █ = wall
 * 4 . . █ . . . . . █ . .    X = static TNT
 * 5 . . . . █ . █ . . . B    * = barrel patrol (row 3, x: 3→7→3 loop)
 * 6 . . █ . . X . . █ . .
 */
const puzzle03: Puzzle = {
    id: 'puzzle_03',
    name: 'The Clockwork Corridor',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 1},
    knightB: {x: 10, y: 5},

    goalA: {x: 10, y: 5}, // where A needs to reach (B's start)
    goalB: {x: 0, y: 1}, // where B needs to reach (A's start)

    walls: [
        // Row 0 (edge barriers)
        {x: 2, y: 0},
        {x: 8, y: 0},
        // Row 1 (top gates)
        {x: 4, y: 1},
        {x: 6, y: 1},
        // Corridor walls (rows 2-4)
        {x: 2, y: 2},
        {x: 8, y: 2},
        {x: 2, y: 3},
        {x: 8, y: 3},
        {x: 2, y: 4},
        {x: 8, y: 4},
        // Row 5 (bottom gates)
        {x: 4, y: 5},
        {x: 6, y: 5},
        // Row 6 (edge barriers)
        {x: 2, y: 6},
        {x: 8, y: 6},
    ],

    staticTNT: [
        {x: 5, y: 0}, // top center
        {x: 5, y: 6}, // bottom center
    ],

    movingTNT: [
        {
            id: 'barrel_1',
            path: [
                {x: 3, y: 3},
                {x: 4, y: 3},
                {x: 5, y: 3},
                {x: 6, y: 3},
                {x: 7, y: 3},
                {x: 6, y: 3},
                {x: 5, y: 3},
                {x: 4, y: 3},
            ],
            loop: true,
        },
    ],
};

export default puzzle03;
