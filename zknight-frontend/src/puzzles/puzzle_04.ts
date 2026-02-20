import type {Puzzle} from '../game/types';

const puzzle_04: Puzzle = {
    id: 'puzzle_04',
    name: 'The Twin Traps',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 6},
    knightB: {x: 10, y: 6},

    goalA: {x: 0, y: 3},
    goalB: {x: 10, y: 0},

    walls: [
        {x: 5, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 1},
        {x: 5, y: 1},
        {x: 7, y: 1},
        {x: 10, y: 1},
        {x: 0, y: 2},
        {x: 9, y: 2},
        {x: 10, y: 2},
        {x: 3, y: 3},
        {x: 4, y: 3},
        {x: 5, y: 3},
        {x: 8, y: 3},
        {x: 0, y: 4},
        {x: 0, y: 5},
        {x: 5, y: 5},
        {x: 7, y: 5},
        {x: 10, y: 5},
        {x: 3, y: 6},
        {x: 5, y: 6},
    ],

    staticTNT: [
        {x: 2, y: 2},
    ],

    movingTNT: [],
};

export default puzzle_04;
