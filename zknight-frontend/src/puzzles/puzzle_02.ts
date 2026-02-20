import type {Puzzle} from '../game/types';

const puzzle_02: Puzzle = {
    id: 'puzzle_02',
    name: 'The Crosspath',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 1, y: 4},
    knightB: {x: 0, y: 2},

    goalA: {x: 9, y: 4},
    goalB: {x: 10, y: 2},

    walls: [
        {x: 1, y: 2},
        {x: 2, y: 2},
        {x: 3, y: 2},
        {x: 4, y: 2},
        {x: 5, y: 2},
        {x: 6, y: 2},
        {x: 7, y: 2},
        {x: 9, y: 2},
        {x: 0, y: 3},
        {x: 1, y: 3},
        {x: 2, y: 3},
        {x: 3, y: 3},
        {x: 4, y: 3},
        {x: 6, y: 3},
        {x: 7, y: 3},
        {x: 8, y: 3},
        {x: 9, y: 3},
        {x: 10, y: 3},
        {x: 0, y: 4},
        {x: 2, y: 4},
        {x: 3, y: 4},
        {x: 4, y: 4},
        {x: 5, y: 4},
        {x: 6, y: 4},
        {x: 8, y: 4},
        {x: 10, y: 4},
    ],

    staticTNT: [],

    movingTNT: [],
};

export default puzzle_02;
