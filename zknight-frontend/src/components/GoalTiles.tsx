import type {Position} from '@/game/types';
import {StaticSprite} from '@/components/StaticSprite';
import {TARGET_TILES} from '@/sprites/staticAssets';

interface GoalTilesProps {
    goalA: Position;
    goalB: Position;
    playOriginX: number;
    playOriginY: number;
}

export function GoalTiles({goalA, goalB, playOriginX, playOriginY}: GoalTilesProps) {
    return (
        <div
            style={{
                position: 'absolute',
                left: playOriginX,
                top: playOriginY,
                zIndex: 2,
            }}
        >
            <StaticSprite src={TARGET_TILES.knightA} x={goalA.x} y={goalA.y} zIndex={goalA.y}/>
            <StaticSprite src={TARGET_TILES.knightB} x={goalB.x} y={goalB.y} zIndex={goalB.y}/>
        </div>
    );
}
