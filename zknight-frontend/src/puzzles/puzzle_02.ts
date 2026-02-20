import type {Puzzle} from '../game/types';

const puzzle_02: Puzzle = {
    id: 'puzzle_02',
    name: 'The Crosspath',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 2, y: 5},
    knightB: {x: 9, y: 5},

    goalA: {x: 4, y: 1},
    goalB: {x: 2, y: 1},

    walls: [
        {x: 2, y: 0},
        {x: 3, y: 0},
        {x: 3, y: 1},
        {x: 2, y: 2},
        {x: 3, y: 2},
        {x: 4, y: 2},
        {x: 6, y: 2},
        {x: 8, y: 2},
        {x: 9, y: 2},
        {x: 10, y: 2},
        {x: 5, y: 3},
        {x: 10, y: 3},
        {x: 0, y: 4},
        {x: 3, y: 4},
        {x: 1, y: 5},
        {x: 10, y: 5},
        {x: 2, y: 6},
        {x: 3, y: 6},
        {x: 4, y: 6},
        {x: 8, y: 6},
        {x: 9, y: 6},
    ],

    staticTNT: [
        {x: 4, y: 0},
        {x: 2, y: 4},
        {x: 9, y: 4},
        {x: 5, y: 5},
        {x: 6, y: 5},
        {x: 7, y: 5},
    ],

    movingTNT: [],
};

export default puzzle_02;
