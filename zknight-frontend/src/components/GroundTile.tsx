import { GROUND_TILE_MAP, type GroundTileKey } from '@/sprites/groundTiles';

interface GroundTileProps {
    tileKey: GroundTileKey;
    x: number;
    y: number;
}

export function GroundTile({ tileKey, x, y }: GroundTileProps) {
    const { src, cols, rows, tileSize } = GROUND_TILE_MAP;
    const tile = GROUND_TILE_MAP.tiles[tileKey];

    const bgX = -tile.col * tileSize;
    const bgY = -tile.row * tileSize;

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
