import type {Position} from '@/game/types';

export interface BgDecoItem {
    pos: Position;
    asset: string;
}

export interface SheepItem {
    pos: Position;
    mirror: boolean;
}

export const TREE_POSITIONS: Position[] = [
    {x: 13, y: 1},
];

export const BUSH_POSITIONS: Position[] = [
    {x: 14, y: 9},
    {x: 13, y: 10},
    {x: 2, y: 10},
    {x: 1, y: 7},
];

export const SHORT_TREE_1_POSITIONS: Position[] = [
    {x: 0, y: 1},
    {x: 14, y: 6},
];

export const SHORT_TREE_2_POSITIONS: Position[] = [
    {x: -2, y: 8},
];

export const WATER_FOAM_POSITIONS: Position[] = [
    {x: 1, y: 8},
    {x: 1, y: 9},
    {x: 1, y: 10},
    {x: 3, y: 10},
    {x: 4, y: 10},
    {x: 4, y: 9},
    {x: 6, y: 10},
    {x: 8, y: 10},
    {x: 10, y: 9},
    {x: 12, y: 10},
    {x: 14, y: 8},
    {x: 15, y: 7},
    {x: 15, y: 6},
    {x: 13, y: 5},
    {x: 13, y: 4},
    {x: 14, y: 3},
    {x: 15, y: 3},
    {x: 14, y: 2},
    {x: 14, y: 1},
    {x: 12, y: 0},
    {x: 11, y: 0},
    {x: 10, y: 0},
    {x: 9, y: 0},
    {x: 8, y: 0},
    {x: 6, y: 0},
    {x: 9, y: 1},
    {x: 4, y: 1},
    {x: 3, y: 1},
    {x: 2, y: 0},
    {x: 1, y: 0},
    {x: 0, y: 0},
    {x: -1, y: 1},
    {x: -1, y: 2},
    {x: 0, y: 3},
    {x: 0, y: 4},
    {x: -1, y: 6},
    {x: -2, y: 7},
    {x: -3, y: 8},
    {x: -1, y: 8},
];

export const GOLD_POSITIONS: Position[] = [
    {x: 7, y: 10},
];

export const SHEEP_POSITIONS: SheepItem[] = [
    {pos: {x: 1, y: 1}, mirror: false},
    {pos: {x: 10, y: 1}, mirror: true},
    {pos: {x: 0, y: 6}, mirror: true},
    {pos: {x: 13, y: 7}, mirror: false},
];

export const WATER_ROCK_POSITIONS: Position[] = [
    {x: -2, y: 0},
    {x: 15, y: 11},
    {x: 15, y: 2},
    {x: -3, y: 6},
    {x: -1, y: 10},
];

export const GROUND_TILE_REMOVED: Position[] = [
    {x: 14, y: 10},
    {x: 14, y: 5},
    {x: 14, y: 4},
    {x: 14, y: 0},
    {x: 13, y: 0},
    {x: 6, y: 9},
    {x: 7, y: 9},
    {x: 8, y: 9},
    {x: 5, y: 10},
    {x: 5, y: 9},
    {x: 9, y: 9},
    {x: 9, y: 10},
    {x: 10, y: 10},
    {x: 0, y: 9},
    {x: 0, y: 8},
    {x: 0, y: 10},
    {x: 3, y: 0},
    {x: 4, y: 0},
    {x: 5, y: 0},
    {x: 5, y: 1},
    {x: 6, y: 1},
    {x: 7, y: 1},
    {x: 8, y: 1},
];

export const GROUND_TILE_VARIANTS: { pos: Position; col: number; row: number }[] = [
    {pos: {x: 13, y: 10}, col: 2, row: 2},
    {pos: {x: 14, y: 9}, col: 2, row: 2},
    {pos: {x: 14, y: 8}, col: 2, row: 1},
    {pos: {x: 15, y: 7}, col: 2, row: 2},
    {pos: {x: 14, y: 7}, col: 1, row: 1},
    {pos: {x: 15, y: 6}, col: 2, row: 0},
    {pos: {x: 15, y: 3}, col: 2, row: 3},
    {pos: {x: 14, y: 6}, col: 1, row: 0},
    {pos: {x: 14, y: 3}, col: 1, row: 2},
    {pos: {x: 14, y: 1}, col: 2, row: 0},
    {pos: {x: 13, y: 1}, col: 1, row: 0},
    {pos: {x: 12, y: 0}, col: 2, row: 0},
    {pos: {x: 10, y: 9}, col: 0, row: 2},
    {pos: {x: 9, y: 8}, col: 1, row: 2},
    {pos: {x: 8, y: 8}, col: 1, row: 2},
    {pos: {x: 7, y: 8}, col: 1, row: 2},
    {pos: {x: 6, y: 8}, col: 1, row: 2},
    {pos: {x: 5, y: 8}, col: 1, row: 2},
    {pos: {x: 4, y: 9}, col: 2, row: 1},
    {pos: {x: 4, y: 10}, col: 2, row: 2},
    {pos: {x: 6, y: 10}, col: 0, row: 3},
    {pos: {x: 8, y: 10}, col: 2, row: 3},
    {pos: {x: 7, y: 10}, col: 1, row: 3},
    {pos: {x: 11, y: 10}, col: 0, row: 2},
    {pos: {x: -1, y: 8}, col: 2, row: 2},
    {pos: {x: -1, y: 7}, col: 1, row: 1},
    {pos: {x: -1, y: 6}, col: 0, row: 0},
    {pos: {x: -2, y: 7}, col: 0, row: 0},
    {pos: {x: -2, y: 8}, col: 1, row: 2},
    {pos: {x: -3, y: 8}, col: 0, row: 3},
    {pos: {x: -1, y: 2}, col: 0, row: 2},
    {pos: {x: -1, y: 1}, col: 0, row: 0},
    {pos: {x: 0, y: 7}, col: 1, row: 2},
    {pos: {x: 0, y: 6}, col: 1, row: 1},
    {pos: {x: 1, y: 10}, col: 0, row: 2},
    {pos: {x: 1, y: 9}, col: 0, row: 1},
    {pos: {x: 0, y: 1}, col: 1, row: 1},
    {pos: {x: 0, y: 2}, col: 1, row: 1},
    {pos: {x: 1, y: 8}, col: 0, row: 1},
    {pos: {x: 13, y: 4}, col: 2, row: 1},
    {pos: {x: 13, y: 5}, col: 2, row: 1},
    {pos: {x: 2, y: 0}, col: 2, row: 0},
    {pos: {x: 6, y: 0}, col: 0, row: 3},
    {pos: {x: 4, y: 1}, col: 2, row: 0},
    {pos: {x: 3, y: 1}, col: 1, row: 0},
    {pos: {x: 7, y: 0}, col: 1, row: 3},
    {pos: {x: 8, y: 0}, col: 1, row: 3},
    {pos: {x: 9, y: 1}, col: 0, row: 1},
    {pos: {x: 5, y: 2}, col: 1, row: 0},
    {pos: {x: 6, y: 2}, col: 1, row: 0},
    {pos: {x: 7, y: 2}, col: 1, row: 0},
    {pos: {x: 8, y: 2}, col: 1, row: 0},
];

export const DECO_POSITIONS: BgDecoItem[] = [
    {pos: {x: 7, y: 0}, asset: '/sprites/deco/18.png'},
    {pos: {x: 11, y: 10}, asset: '/sprites/deco/04.png'},
    {pos: {x: 12, y: 9}, asset: '/sprites/deco/13.png'},
    {pos: {x: 13, y: 3}, asset: '/sprites/deco/08.png'},
    {pos: {x: 11, y: 1}, asset: '/sprites/deco/17.png'},
    {pos: {x: 0, y: 2}, asset: '/sprites/deco/13.png'},
    {pos: {x: 3, y: 9}, asset: '/sprites/deco/14.png'},
    {pos: {x: -1, y: 7}, asset: '/sprites/deco/02.png'},
    {pos: {x: 1, y: 5}, asset: '/sprites/deco/05.png'},
    {pos: {x: 1, y: 4}, asset: '/sprites/deco/16.png'},
];
