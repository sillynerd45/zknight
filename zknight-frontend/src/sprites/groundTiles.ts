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
