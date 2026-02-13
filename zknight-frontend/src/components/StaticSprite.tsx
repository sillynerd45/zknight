import { TILE_SIZE } from '@/game/constants';

interface StaticSpriteProps {
    src: string;
    x: number;
    y: number;
    zIndex: number;
}

export function StaticSprite({ src, x, y, zIndex }: StaticSpriteProps) {
    return (
        <div
            style={{
                position: 'absolute',
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                backgroundImage: `url('${src}')`,
                backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                backgroundPosition: '0 0',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                zIndex,
                pointerEvents: 'none',
            }}
        />
    );
}
