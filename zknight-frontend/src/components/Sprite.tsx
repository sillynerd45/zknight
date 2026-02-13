import { SPRITE_MAP, type SpriteKey, type SpriteAnimation } from '@/sprites/spriteMap';
import { useAnimatedSprite } from '@/hooks/useAnimatedSprite';
import { TILE_SIZE } from '@/game/constants';

interface SpriteProps {
    spriteKey: SpriteKey;
    animation: string;
    x: number;
    y: number;
    zIndex: number;
    active?: boolean;
    onComplete?: () => void;
}

export function Sprite({ spriteKey, animation, x, y, zIndex, active, onComplete }: SpriteProps) {
    const sheet = SPRITE_MAP[spriteKey];
    const anim = (sheet.animations as Record<string, SpriteAnimation>)[animation];
    const frameIndex = useAnimatedSprite(anim, { active, onComplete });

    const bgX = -(anim.startCol + frameIndex) * sheet.frameWidth;
    const bgY = -anim.row * sheet.frameHeight;

    // Offset so the 64×64 visible sprite centers on the tile
    const offsetX = (sheet.frameWidth - TILE_SIZE) / 2;
    const offsetY = (sheet.frameHeight - TILE_SIZE) / 2;
    const posX = x * TILE_SIZE - offsetX;
    const posY = y * TILE_SIZE - offsetY;

    return (
        <div
            style={{
                position: 'absolute',
                width: sheet.frameWidth,
                height: sheet.frameHeight,
                left: posX,
                top: posY,
                backgroundImage: `url('${sheet.src}')`,
                backgroundPosition: `${bgX}px ${bgY}px`,
                backgroundSize: `${sheet.cols * sheet.frameWidth}px ${sheet.rows * sheet.frameHeight}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                transform: anim.mirror ? 'scaleX(-1)' : undefined,
                transition: 'left 0.15s ease, top 0.15s ease',
                zIndex,
                pointerEvents: 'none',
            }}
        />
    );
}
