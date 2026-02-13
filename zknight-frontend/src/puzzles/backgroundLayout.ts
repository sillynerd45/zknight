import type {Position} from '@/game/types';

export interface BgDecoItem {
    pos: Position;
    asset: string;
}

export const TREE_POSITIONS: Position[] = [
    {x: 0, y: 10},
    {x: 14, y: 10},
    {x: 14, y: 2},
    {x: 0, y: 2},
];

export const BUSH_POSITIONS: Position[] = [
    {x: 13, y: 1},
    {x: 1, y: 1},
    {x: 13, y: 7},
    {x: 1, y: 7},
];

export const DECO_POSITIONS: BgDecoItem[] = [
    {pos: {x: 12, y: 9}, asset: '/sprites/deco/13.png'},
    {pos: {x: 2, y: 9}, asset: '/sprites/deco/13.png'},
    {pos: {x: 7, y: 9}, asset: '/sprites/deco/04.png'},
    {pos: {x: 9, y: 9}, asset: '/sprites/deco/06.png'},
    {pos: {x: 5, y: 9}, asset: '/sprites/deco/06.png'},
    {pos: {x: 8, y: 9}, asset: '/sprites/deco/10.png'},
    {pos: {x: 6, y: 9}, asset: '/sprites/deco/10.png'},
    {pos: {x: 4, y: 9}, asset: '/sprites/deco/01.png'},
    {pos: {x: 10, y: 9}, asset: '/sprites/deco/01.png'},
    {pos: {x: 11, y: 9}, asset: '/sprites/deco/04.png'},
    {pos: {x: 3, y: 9}, asset: '/sprites/deco/04.png'},
    {pos: {x: 13, y: 5}, asset: '/sprites/deco/08.png'},
    {pos: {x: 1, y: 5}, asset: '/sprites/deco/08.png'},
    {pos: {x: 13, y: 3}, asset: '/sprites/deco/12.png'},
    {pos: {x: 1, y: 3}, asset: '/sprites/deco/12.png'},
    {pos: {x: 4, y: 1}, asset: '/sprites/deco/14.png'},
    {pos: {x: 10, y: 1}, asset: '/sprites/deco/14.png'},
    {pos: {x: 9, y: 1}, asset: '/sprites/deco/10.png'},
    {pos: {x: 5, y: 1}, asset: '/sprites/deco/10.png'},
    {pos: {x: 2, y: 1}, asset: '/sprites/deco/05.png'},
    {pos: {x: 12, y: 1}, asset: '/sprites/deco/05.png'},
    {pos: {x: 13, y: 4}, asset: '/sprites/deco/05.png'},
    {pos: {x: 1, y: 6}, asset: '/sprites/deco/05.png'},
    {pos: {x: 13, y: 6}, asset: '/sprites/deco/04.png'},
    {pos: {x: 1, y: 4}, asset: '/sprites/deco/04.png'},
    {pos: {x: 7, y: 1}, asset: '/sprites/deco/18.png'},
    {pos: {x: 13, y: 9}, asset: '/sprites/deco/16.png'},
    {pos: {x: 1, y: 9}, asset: '/sprites/deco/16.png'},
    {pos: {x: 6, y: 1}, asset: '/sprites/deco/03.png'},
    {pos: {x: 8, y: 1}, asset: '/sprites/deco/03.png'},
    {pos: {x: 11, y: 1}, asset: '/sprites/deco/07.png'},
    {pos: {x: 3, y: 1}, asset: '/sprites/deco/07.png'},
];
