import {BG_GRID_W, BG_GRID_H} from '@/game/constants';

/** Nine-slice tile positions within ground_tile_map.png (0-indexed col, row). */
export const GROUND_TILE_MAP = {
    src: '/sprites/ground_tile_map.png',
    cols: 9,
    rows: 6,
    tileSize: 64, // each cell is exactly 64×64, no padding
    tiles: {
        topLeft:      { col: 0, row: 0 },
        topCenter:    { col: 1, row: 0 },
        topRight:     { col: 2, row: 0 },
        middleLeft:   { col: 0, row: 1 },
        center:       { col: 1, row: 1 },  // ← play area floor tile
        middleRight:  { col: 2, row: 1 },
        bottomLeft:   { col: 0, row: 2 },
        bottomCenter: { col: 1, row: 2 },
        bottomRight:  { col: 2, row: 2 },
    },
} as const;

export type GroundTileKey = keyof typeof GROUND_TILE_MAP.tiles;

/** Returns the nine-slice tile key for a cell at (x, y) in the 15×11 BG grid. */
export function getAutoGroundTileKey(x: number, y: number): GroundTileKey {
    const lastX = BG_GRID_W - 1;
    const lastY = BG_GRID_H - 1;
    if (x === 0 && y === 0) return 'topLeft';
    if (x === lastX && y === 0) return 'topRight';
    if (x === 0 && y === lastY) return 'bottomLeft';
    if (x === lastX && y === lastY) return 'bottomRight';
    if (y === 0) return 'topCenter';
    if (y === lastY) return 'bottomCenter';
    if (x === 0) return 'middleLeft';
    if (x === lastX) return 'middleRight';
    return 'center';
}

/** Returns the {col, row} tilemap coordinate for a cell, using auto-assignment. */
export function getAutoGroundTileCoord(x: number, y: number): {col: number; row: number} {
    return GROUND_TILE_MAP.tiles[getAutoGroundTileKey(x, y)];
}
