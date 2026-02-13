import type {Position} from '@/game/types';
import {Sprite} from '@/components/Sprite';
import {isSamePosition} from '@/game/position';

interface StaticBarrelsProps {
    data: Position[];
    knightA: Position;
    knightB: Position;
    destroyedStaticTNT: Position[];
    playOriginX: number;
    playOriginY: number;
}

const isNearby = (a: Position, b: Position): boolean =>
    Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1 && !(a.x === b.x && a.y === b.y);

export function StaticBarrels({data, knightA, knightB, destroyedStaticTNT, playOriginX, playOriginY}: StaticBarrelsProps) {
    // Filter out destroyed TNT
    const activeTNT = data.filter(
        tnt => !destroyedStaticTNT.some(destroyed => isSamePosition(tnt, destroyed))
    );

    return (
        <div
            style={{
                position: 'absolute',
                left: playOriginX,
                top: playOriginY,
                zIndex: 2,
            }}
        >
            {activeTNT.map((pos, i) => {
                const reactive = isNearby(pos, knightA) || isNearby(pos, knightB);
                return (
                    <Sprite
                        key={`static-tnt-${i}`}
                        spriteKey="barrelStatic"
                        animation={reactive ? 'reactive' : 'staticIdle'}
                        x={pos.x}
                        y={pos.y}
                        zIndex={pos.y}
                    />
                );
            })}
        </div>
    );
}
