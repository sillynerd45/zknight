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
                return (
                    <Sprite
                        key={barrel.id}
                        spriteKey="barrelMove"
                        animation="movingRoll"
                        x={pos.x}
                        y={pos.y}
                        zIndex={pos.y}
                    />
                );
            })}
        </div>
    );
}
