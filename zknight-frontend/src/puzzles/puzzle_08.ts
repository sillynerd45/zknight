import type {Puzzle} from '../game/types';

const puzzle_08: Puzzle = {
    id: 'puzzle_08',
    name: 'The Divided Dungeon',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 3, y: 1},
    knightB: {x: 7, y: 1},

    goalA: {x: 8, y: 3},
    goalB: {x: 2, y: 3},

    walls: [
        {x: 3, y: 0},
        {x: 7, y: 0},
        {x: 2, y: 1},
        {x: 4, y: 1},
        {x: 6, y: 1},
        {x: 8, y: 1},
        {x: 1, y: 2},
        {x: 5, y: 2},
        {x: 9, y: 2},
        {x: 1, y: 3},
        {x: 5, y: 3},
        {x: 9, y: 3},
        {x: 2, y: 4},
        {x: 3, y: 4},
        {x: 7, y: 4},
        {x: 8, y: 4},
        {x: 3, y: 5},
        {x: 7, y: 5},
    ],

    staticTNT: [
        {x: 3, y: 6},
        {x: 7, y: 6},
    ],

    movingTNT: [],
};

export default puzzle_08;
