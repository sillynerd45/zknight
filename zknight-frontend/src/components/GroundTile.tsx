import { GROUND_TILE_MAP, type GroundTileKey } from '@/sprites/groundTiles';

interface GroundTileProps {
    /** Named tile key (auto-assigns col/row from GROUND_TILE_MAP). */
    tileKey?: GroundTileKey;
    /** Direct column index in ground_tile_map.png (overrides tileKey). */
    col?: number;
    /** Direct row index in ground_tile_map.png (overrides tileKey). */
    row?: number;
    x: number;
    y: number;
}

export function GroundTile({ tileKey, col, row, x, y }: GroundTileProps) {
    const { src, cols, rows, tileSize } = GROUND_TILE_MAP;

    const tileCol = col ?? (tileKey ? GROUND_TILE_MAP.tiles[tileKey].col : 1);
    const tileRow = row ?? (tileKey ? GROUND_TILE_MAP.tiles[tileKey].row : 1);

    const bgX = -tileCol * tileSize;
    const bgY = -tileRow * tileSize;

    return (
        <div
            style={{
                position: 'absolute',
                width: tileSize,
                height: tileSize,
                left: x * tileSize,
                top: y * tileSize,
                backgroundImage: `url('${src}')`,
                backgroundPosition: `${bgX}px ${bgY}px`,
                backgroundSize: `${cols * tileSize}px ${rows * tileSize}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
            }}
        />
    );
}
