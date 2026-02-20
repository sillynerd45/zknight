import type {Puzzle} from '../game/types';

const puzzle_09: Puzzle = {
    id: 'puzzle_09',
    name: 'The Parallel Pursuit',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 1, y: 6},
    knightB: {x: 10, y: 5},

    goalA: {x: 6, y: 6},
    goalB: {x: 3, y: 6},

    walls: [
        {x: 0, y: 0},
        {x: 4, y: 0},
        {x: 7, y: 1},
        {x: 8, y: 1},
        {x: 9, y: 1},
        {x: 0, y: 2},
        {x: 4, y: 2},
        {x: 5, y: 3},
        {x: 6, y: 3},
        {x: 3, y: 4},
        {x: 4, y: 4},
        {x: 9, y: 4},
        {x: 10, y: 4},
        {x: 0, y: 5},
        {x: 3, y: 5},
        {x: 5, y: 5},
        {x: 0, y: 6},
        {x: 4, y: 6},
        {x: 5, y: 6},
        {x: 7, y: 6},
    ],

    staticTNT: [
        {x: 2, y: 0},
        {x: 8, y: 2},
        {x: 10, y: 2},
        {x: 3, y: 3},
        {x: 10, y: 6},
    ],

    movingTNT: [],
};

export default puzzle_09;
