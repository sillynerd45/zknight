import type {Puzzle} from '../game/types';

const puzzle_05: Puzzle = {
    id: 'puzzle_05',
    name: 'The Split Vanguard',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 6},
    knightB: {x: 10, y: 6},

    goalA: {x: 3, y: 0},
    goalB: {x: 10, y: 1},

    walls: [
        {x: 2, y: 0},
        {x: 5, y: 0},
        {x: 7, y: 0},
        {x: 0, y: 1},
        {x: 5, y: 1},
        {x: 5, y: 2},
        {x: 9, y: 2},
        {x: 0, y: 3},
        {x: 2, y: 3},
        {x: 4, y: 3},
        {x: 8, y: 3},
        {x: 3, y: 4},
        {x: 0, y: 5},
        {x: 1, y: 5},
        {x: 4, y: 5},
        {x: 7, y: 5},
        {x: 9, y: 5},
        {x: 4, y: 6},
        {x: 7, y: 6},
    ],

    staticTNT: [
        {x: 6, y: 0},
        {x: 0, y: 4},
    ],

    movingTNT: [],
};

export default puzzle_05;
