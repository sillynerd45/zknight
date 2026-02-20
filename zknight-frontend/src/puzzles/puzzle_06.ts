import type {Puzzle} from '../game/types';

const puzzle_06: Puzzle = {
    id: 'puzzle_06',
    name: 'The Dual Gambit',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 6},
    knightB: {x: 10, y: 6},

    goalA: {x: 6, y: 5},
    goalB: {x: 0, y: 2},

    walls: [
        {x: 9, y: 0},
        {x: 0, y: 1},
        {x: 2, y: 1},
        {x: 3, y: 1},
        {x: 5, y: 1},
        {x: 6, y: 1},
        {x: 1, y: 2},
        {x: 4, y: 2},
        {x: 7, y: 3},
        {x: 8, y: 3},
        {x: 1, y: 4},
        {x: 4, y: 4},
        {x: 6, y: 4},
        {x: 7, y: 4},
        {x: 0, y: 5},
        {x: 5, y: 5},
        {x: 5, y: 6},
    ],

    staticTNT: [
        {x: 8, y: 1},
        {x: 2, y: 2},
        {x: 6, y: 3},
    ],

    movingTNT: [],
};

export default puzzle_06;
