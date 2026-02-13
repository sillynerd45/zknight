import type {MovingBarrel} from '@/game/types';
import {Sprite} from '@/components/Sprite';

interface MovingBarrelsProps {
    barrels: MovingBarrel[];
    playOriginX: number;
    playOriginY: number;
}

export function MovingBarrels({barrels, playOriginX, playOriginY}: MovingBarrelsProps) {
    return (
        <div
            style={{
                position: 'absolute',
                left: playOriginX,
                top: playOriginY,
                zIndex: 2,
            }}
        >
            {barrels.map((barrel) => {
                const pos = barrel.path[barrel.step];

                // Determine barrel facing direction based on where it came from
                // Compare current position with previous position in the path
                const prevStep = (barrel.step - 1 + barrel.path.length) % barrel.path.length;
                const prevPos = barrel.path[prevStep];
                const dx = pos.x - prevPos.x;

                // Mirror when it moved left to get here (dx < 0), face right when it moved right (dx > 0)
                const shouldMirror = dx < 0;

                return (
                    <Sprite
                        key={barrel.id}
                        spriteKey="barrelMove"
                        animation="movingRoll"
                        x={pos.x}
                        y={pos.y}
                        zIndex={pos.y}
                        transitionDuration={1200}
                        mirror={shouldMirror}
                    />
                );
            })}
        </div>
    );
}
