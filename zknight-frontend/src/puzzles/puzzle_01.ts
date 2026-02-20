import type {Puzzle} from '../game/types';

const puzzle_01: Puzzle = {
    id: 'puzzle_01',
    name: 'The Broken Mirror',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 0, y: 6},
    knightB: {x: 4, y: 3},

    goalA: {x: 0, y: 3},
    goalB: {x: 4, y: 6},

    walls: [
        {x: 1, y: 3},
        {x: 2, y: 3},
        {x: 4, y: 4},
        {x: 0, y: 5},
        {x: 2, y: 5},
        {x: 2, y: 6},
        {x: 3, y: 6},
    ],

    staticTNT: [],

    movingTNT: [],
};

export default puzzle_01;
