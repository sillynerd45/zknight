import type {Puzzle} from '../game/types';

const puzzle_07: Puzzle = {
    id: 'puzzle_07',
    name: 'The Binary Bridge',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 6},
    knightB: {x: 9, y: 6},

    goalA: {x: 3, y: 0},
    goalB: {x: 6, y: 1},

    walls: [
        {x: 5, y: 1},
        {x: 7, y: 1},
        {x: 10, y: 1},
        {x: 2, y: 2},
        {x: 3, y: 2},
        {x: 5, y: 2},
        {x: 6, y: 2},
        {x: 0, y: 3},
        {x: 4, y: 3},
        {x: 7, y: 3},
        {x: 5, y: 4},
        {x: 2, y: 5},
        {x: 5, y: 5},
        {x: 5, y: 6},
        {x: 8, y: 6},
        {x: 10, y: 6},
    ],

    staticTNT: [
        {x: 2, y: 0},
        {x: 0, y: 2},
        {x: 3, y: 3},
        {x: 9, y: 3},
        {x: 10, y: 3},
    ],

    movingTNT: [],
};

export default puzzle_07;
