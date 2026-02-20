import type {Puzzle} from '../game/types';

const puzzle_03: Puzzle = {
    id: 'puzzle_03',
    name: 'The Clockwork Corridor',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 5, y: 6},
    knightB: {x: 5, y: 0},

    goalA: {x: 5, y: 2},
    goalB: {x: 5, y: 4},

    walls: [
        {x: 3, y: 0},
        {x: 4, y: 0},
        {x: 6, y: 0},
        {x: 7, y: 0},
        {x: 2, y: 1},
        {x: 8, y: 1},
        {x: 2, y: 2},
        {x: 4, y: 2},
        {x: 6, y: 2},
        {x: 7, y: 2},
        {x: 2, y: 3},
        {x: 4, y: 3},
        {x: 6, y: 3},
        {x: 2, y: 4},
        {x: 6, y: 4},
        {x: 3, y: 5},
        {x: 4, y: 5},
        {x: 6, y: 5},
        {x: 4, y: 6},
        {x: 6, y: 6},
    ],

    staticTNT: [],

    movingTNT: [],
};

export default puzzle_03;
