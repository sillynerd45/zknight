import {Sprite} from '@/components/Sprite';
import {TREE_POSITIONS, BUSH_POSITIONS} from '@/puzzles/backgroundLayout';

interface BackgroundDecorationsProps {
    originX: number;
    originY: number;
}

export function BackgroundDecorations({originX, originY}: BackgroundDecorationsProps) {
    return (
        <div
            style={{
                position: 'absolute',
                left: originX,
                top: originY,
                zIndex: 5,
                pointerEvents: 'none',
            }}
        >
            {TREE_POSITIONS.map((pos, i) => (
                <Sprite
                    key={`tree-${i}`}
                    spriteKey="tree"
                    animation="idle"
                    x={pos.x}
                    y={pos.y}
                    zIndex={pos.y}
                />
            ))}
            {BUSH_POSITIONS.map((pos, i) => (
                <Sprite
                    key={`bush-${i}`}
                    spriteKey="bush"
                    animation="idle"
                    x={pos.x}
                    y={pos.y}
                    zIndex={pos.y}
                />
            ))}
        </div>
    );
}
