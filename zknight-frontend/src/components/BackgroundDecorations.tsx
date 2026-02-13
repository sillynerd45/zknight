import {Sprite} from '@/components/Sprite';
import {TILE_SIZE} from '@/game/constants';
import {TREE_POSITIONS, BUSH_POSITIONS, DECO_POSITIONS} from '@/puzzles/backgroundLayout';
import {getDecoSize} from '@/editor/decoSizes';

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
            {DECO_POSITIONS.map((item, i) => {
                const size = getDecoSize(item.asset);
                const offsetX = (size.width - TILE_SIZE) / 2;
                const offsetY = size.height - TILE_SIZE;
                return (
                    <div
                        key={`deco-${i}`}
                        style={{
                            position: 'absolute',
                            width: size.width,
                            height: size.height,
                            left: item.pos.x * TILE_SIZE - offsetX,
                            top: item.pos.y * TILE_SIZE - offsetY,
                            backgroundImage: `url('${item.asset}')`,
                            backgroundSize: `${size.width}px ${size.height}px`,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                            zIndex: item.pos.y,
                            pointerEvents: 'none',
                        }}
                    />
                );
            })}
        </div>
    );
}
