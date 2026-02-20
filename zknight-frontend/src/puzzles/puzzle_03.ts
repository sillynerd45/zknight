import type {Puzzle} from '../game/types';

const puzzle_03: Puzzle = {
    id: 'puzzle_03',
    name: 'The Clockwork Corridor',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 4, y: 6},
    knightB: {x: 6, y: 6},

    goalA: {x: 7, y: 6},
    goalB: {x: 3, y: 6},

    walls: [
        {x: 2, y: 1},
        {x: 3, y: 1},
        {x: 7, y: 1},
        {x: 8, y: 1},
        {x: 4, y: 2},
        {x: 6, y: 2},
        {x: 0, y: 3},
        {x: 4, y: 3},
        {x: 6, y: 3},
        {x: 10, y: 3},
        {x: 1, y: 4},
        {x: 5, y: 4},
        {x: 9, y: 4},
        {x: 2, y: 5},
        {x: 4, y: 5},
        {x: 5, y: 5},
        {x: 6, y: 5},
        {x: 8, y: 5},
        {x: 2, y: 6},
        {x: 8, y: 6},
    ],

    staticTNT: [
        {x: 5, y: 2},
    ],

    movingTNT: [],
};

export default puzzle_03;
