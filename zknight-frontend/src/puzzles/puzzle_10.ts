import type {Puzzle} from '../game/types';

const puzzle_10: Puzzle = {
    id: 'puzzle_10',
    name: 'The Two-Faced Fortress',
    gridWidth: 11,
    gridHeight: 7,

    knightA: {x: 9, y: 1},
    knightB: {x: 0, y: 6},

    goalA: {x: 1, y: 6},
    goalB: {x: 2, y: 0},

    walls: [
        {x: 1, y: 0},
        {x: 2, y: 1},
        {x: 3, y: 1},
        {x: 5, y: 1},
        {x: 10, y: 1},
        {x: 1, y: 2},
        {x: 3, y: 2},
        {x: 5, y: 2},
        {x: 10, y: 2},
        {x: 0, y: 3},
        {x: 5, y: 3},
        {x: 9, y: 3},
        {x: 6, y: 4},
        {x: 8, y: 4},
        {x: 9, y: 5},
        {x: 2, y: 6},
        {x: 4, y: 6},
        {x: 6, y: 6},
    ],

    staticTNT: [
        {x: 1, y: 3},
        {x: 0, y: 4},
    ],

    movingTNT: [
        {
            id: 'barrel_0',
            path: [
                {x: 3, y: 0},
                {x: 4, y: 0},
                {x: 5, y: 0},
                {x: 6, y: 0},
                {x: 7, y: 0},
                {x: 8, y: 0},
                {x: 7, y: 0},
                {x: 6, y: 0},
                {x: 5, y: 0},
                {x: 4, y: 0},
            ],
            loop: true,
        },
    ],
};

export default puzzle_10;
