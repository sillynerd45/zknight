import type {Puzzle} from '../game/types';

const puzzle_01: Puzzle = {
    id: 'puzzle_01',
    name: 'The Broken Mirror',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 3, y: 3},
    knightB: {x: 8, y: 6},

    goalA: {x: 9, y: 6},
    goalB: {x: 1, y: 5},

    walls: [
        {x: 4, y: 0},
        {x: 5, y: 0},
        {x: 6, y: 0},
        {x: 3, y: 1},
        {x: 7, y: 1},
        {x: 2, y: 2},
        {x: 3, y: 2},
        {x: 7, y: 2},
        {x: 8, y: 2},
        {x: 5, y: 3},
        {x: 1, y: 4},
        {x: 2, y: 4},
        {x: 4, y: 4},
        {x: 6, y: 4},
        {x: 8, y: 4},
        {x: 9, y: 4},
        {x: 0, y: 5},
        {x: 4, y: 5},
        {x: 6, y: 5},
        {x: 0, y: 6},
        {x: 4, y: 6},
        {x: 6, y: 6},
        {x: 10, y: 6},
    ],

    staticTNT: [
        {x: 0, y: 0},
        {x: 10, y: 0},
        {x: 1, y: 3},
        {x: 9, y: 3},
        {x: 9, y: 5},
        {x: 3, y: 6},
    ],

    movingTNT: [],
};

export default puzzle_01;
