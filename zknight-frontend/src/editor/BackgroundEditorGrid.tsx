import {
    BASE_WIDTH,
    BASE_HEIGHT,
    TILE_SIZE,
    PLAY_GRID_W,
    PLAY_GRID_H,
    BG_GRID_W,
    BG_GRID_H,
    BG_PADDING_TILES,
} from '@/game/constants';
import type {Position} from '@/game/types';
import type {BgTool, BgDecoItem} from './types';
import {WaterLayer} from '@/components/WaterLayer';
import {GroundTile} from '@/components/GroundTile';
import {Sprite} from '@/components/Sprite';
import type {GroundTileKey} from '@/sprites/groundTiles';
import {isBorderCell} from './useBackgroundEditorState';
import {getDecoSize, type DecoSize} from './decoSizes';
import styles from './editorStyles.module.css';

/** Render a deco asset at the correct native size with proper offset. */
function DecoItem({src, x, y, zIndex, opacity}: {src: string; x: number; y: number; zIndex: number; opacity?: number}) {
    const size = getDecoSize(src);
    // Offset so the bottom-center of the sprite aligns with the tile
    const offsetX = (size.width - TILE_SIZE) / 2;
    const offsetY = size.height - TILE_SIZE;

    return (
        <div
            style={{
                position: 'absolute',
                width: size.width,
                height: size.height,
                left: x * TILE_SIZE - offsetX,
                top: y * TILE_SIZE - offsetY,
                backgroundImage: `url('${src}')`,
                backgroundSize: `${size.width}px ${size.height}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                zIndex,
                pointerEvents: 'none',
                opacity: opacity ?? 1,
            }}
        />
    );
}

interface BackgroundEditorGridProps {
    treePositions: Position[];
    bushPositions: Position[];
    decoItems: BgDecoItem[];
    activeTool: BgTool;
    activeDecoAsset: string;
    hoveredCell: Position | null;
    onCellClick: (pos: Position) => void;
    onCellHover: (pos: Position | null) => void;
}

function getGroundTileKey(x: number, y: number): GroundTileKey {
    const lastX = BG_GRID_W - 1;
    const lastY = BG_GRID_H - 1;
    if (x === 0 && y === 0) return 'topLeft';
    if (x === lastX && y === 0) return 'topRight';
    if (x === 0 && y === lastY) return 'bottomLeft';
    if (x === lastX && y === lastY) return 'bottomRight';
    if (y === 0) return 'topCenter';
    if (y === lastY) return 'bottomCenter';
    if (x === 0) return 'middleLeft';
    if (x === lastX) return 'middleRight';
    return 'center';
}

export function BackgroundEditorGrid({
    treePositions,
    bushPositions,
    decoItems,
    activeTool,
    activeDecoAsset,
    hoveredCell,
    onCellClick,
    onCellHover,
}: BackgroundEditorGridProps) {
    const playOriginX = (BASE_WIDTH - PLAY_GRID_W * TILE_SIZE) / 2;
    const playOriginY = (BASE_HEIGHT - PLAY_GRID_H * TILE_SIZE) / 2;
    const groundOriginX = playOriginX - BG_PADDING_TILES * TILE_SIZE;
    const groundOriginY = playOriginY - BG_PADDING_TILES * TILE_SIZE;

    // Ground tiles
    const groundTiles: React.ReactNode[] = [];
    for (let y = 0; y < BG_GRID_H; y++) {
        for (let x = 0; x < BG_GRID_W; x++) {
            groundTiles.push(
                <GroundTile
                    key={`g-${x}-${y}`}
                    tileKey={getGroundTileKey(x, y)}
                    x={x}
                    y={y}
                />
            );
        }
    }

    // Clickable cell overlays
    const cells: React.ReactNode[] = [];
    for (let y = 0; y < BG_GRID_H; y++) {
        for (let x = 0; x < BG_GRID_W; x++) {
            const pos = {x, y};
            const border = isBorderCell(pos);
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

            let bg = 'transparent';
            if (isHovered && !border && activeTool !== 'erase') {
                bg = 'rgba(204, 51, 51, 0.2)';
            } else if (isHovered && border) {
                bg = 'rgba(255, 255, 255, 0.12)';
            }

            cells.push(
                <div
                    key={`cell-${x}-${y}`}
                    className={border ? styles.gridCell : styles.gridCellInvalid}
                    style={{
                        left: x * TILE_SIZE,
                        top: y * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        background: bg,
                    }}
                    onClick={() => onCellClick(pos)}
                    onMouseEnter={() => onCellHover(pos)}
                    onMouseLeave={() => onCellHover(null)}
                />
            );
        }
    }

    // Hover preview
    const canPreview = hoveredCell && isBorderCell(hoveredCell) && activeTool !== 'erase';

    return (
        <div
            style={{
                position: 'relative',
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
            }}
        >
            <WaterLayer />

            {/* Ground tiles */}
            <div
                style={{
                    position: 'absolute',
                    left: groundOriginX,
                    top: groundOriginY,
                    width: BG_GRID_W * TILE_SIZE,
                    height: BG_GRID_H * TILE_SIZE,
                    zIndex: 2,
                }}
            >
                {groundTiles}
            </div>

            {/* Play area boundary */}
            <div
                style={{
                    position: 'absolute',
                    left: playOriginX,
                    top: playOriginY,
                    width: PLAY_GRID_W * TILE_SIZE,
                    height: PLAY_GRID_H * TILE_SIZE,
                    border: '2px dashed rgba(220, 50, 50, 0.7)',
                    zIndex: 3,
                    pointerEvents: 'none',
                }}
            />

            {/* Decorations layer */}
            <div
                style={{
                    position: 'absolute',
                    left: groundOriginX,
                    top: groundOriginY,
                    zIndex: 5,
                    pointerEvents: 'none',
                }}
            >
                {/* Trees */}
                {treePositions.map((pos, i) => (
                    <Sprite
                        key={`tree-${i}`}
                        spriteKey="tree"
                        animation="idle"
                        x={pos.x}
                        y={pos.y}
                        zIndex={pos.y}
                    />
                ))}

                {/* Bushes */}
                {bushPositions.map((pos, i) => (
                    <Sprite
                        key={`bush-${i}`}
                        spriteKey="bush"
                        animation="idle"
                        x={pos.x}
                        y={pos.y}
                        zIndex={pos.y}
                    />
                ))}

                {/* Deco items (native sizes) */}
                {decoItems.map((item, i) => (
                    <DecoItem
                        key={`deco-${i}`}
                        src={item.asset}
                        x={item.pos.x}
                        y={item.pos.y}
                        zIndex={item.pos.y}
                    />
                ))}

                {/* Hover preview */}
                {canPreview && activeTool === 'tree' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite
                            spriteKey="tree"
                            animation="idle"
                            x={hoveredCell!.x}
                            y={hoveredCell!.y}
                            zIndex={100}
                        />
                    </div>
                )}
                {canPreview && activeTool === 'bush' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite
                            spriteKey="bush"
                            animation="idle"
                            x={hoveredCell!.x}
                            y={hoveredCell!.y}
                            zIndex={100}
                        />
                    </div>
                )}
                {canPreview && activeTool === 'deco' && (
                    <DecoItem
                        src={activeDecoAsset}
                        x={hoveredCell!.x}
                        y={hoveredCell!.y}
                        zIndex={100}
                        opacity={0.4}
                    />
                )}
            </div>

            {/* Clickable grid overlay */}
            <div
                style={{
                    position: 'absolute',
                    left: groundOriginX,
                    top: groundOriginY,
                    width: BG_GRID_W * TILE_SIZE,
                    height: BG_GRID_H * TILE_SIZE,
                    zIndex: 10,
                }}
            >
                {cells}
            </div>
        </div>
    );
}
