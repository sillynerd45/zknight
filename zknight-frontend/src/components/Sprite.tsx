import { SPRITE_MAP, type SpriteKey, type SpriteSheetConfig, type SpriteAnimation } from '@/sprites/spriteMap';
import { useAnimatedSprite } from '@/hooks/useAnimatedSprite';
import { TILE_SIZE } from '@/game/constants';

interface SpriteProps {
    spriteKey: SpriteKey;
    animation: string;
    x: number;
    y: number;
    zIndex: number;
    active?: boolean;
    mirror?: boolean;
    transitionDuration?: number; // in milliseconds
    onComplete?: () => void;
}

export function Sprite({ spriteKey, animation, x, y, zIndex, active, mirror, transitionDuration = 600, onComplete }: SpriteProps) {
    const sheet: SpriteSheetConfig = SPRITE_MAP[spriteKey];
    const anim = (sheet.animations as Record<string, SpriteAnimation>)[animation];
    const frameIndex = useAnimatedSprite(anim, { active, onComplete });

    const bgX = -(anim.startCol + frameIndex) * sheet.frameWidth;
    const bgY = -anim.row * sheet.frameHeight;

    // Offset so the 64×64 visible content aligns on the tile
    const offsetX = sheet.contentOffsetX ?? (sheet.frameWidth - TILE_SIZE) / 2;
    const offsetY = sheet.contentOffsetY ?? (sheet.frameHeight - TILE_SIZE) / 2;
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
                transform: (anim.mirror || mirror) ? 'scaleX(-1)' : undefined,
                transition: `left ${transitionDuration / 1000}s ease, top ${transitionDuration / 1000}s ease`,
                zIndex,
                pointerEvents: 'none',
            }}
        />
    );
}
