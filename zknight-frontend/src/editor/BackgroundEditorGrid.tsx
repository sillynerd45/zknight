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
import {getAutoGroundTileKey, GROUND_TILE_MAP} from '@/sprites/groundTiles';
import {
    isValidDecoCell,
    isGroundCell,
    CANVAS_TILE_X_MIN,
    CANVAS_TILE_X_MAX,
    CANVAS_TILE_Y_MIN,
    CANVAS_TILE_Y_MAX,
} from './useBackgroundEditorState';
import {getDecoSize} from './decoSizes';
import styles from './editorStyles.module.css';

// ── Deco item renderer ──────────────────────────────────────────

function DecoItem({src, x, y, zIndex, opacity}: {src: string; x: number; y: number; zIndex: number; opacity?: number}) {
    const size = getDecoSize(src);
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

// ── Ground tile overlays ────────────────────────────────────────

function ErasedGroundOverlay({x, y}: {x: number; y: number}) {
    return (
        <div
            style={{
                position: 'absolute',
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                background: 'repeating-linear-gradient(45deg, rgba(204,51,51,0.25) 0px, rgba(204,51,51,0.25) 4px, transparent 4px, transparent 8px)',
                border: '1px dashed rgba(204,51,51,0.5)',
                pointerEvents: 'none',
                zIndex: 3,
            }}
        />
    );
}

function VariantGroundOverlay({x, y}: {x: number; y: number}) {
    return (
        <div
            style={{
                position: 'absolute',
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                outline: '2px solid rgba(68, 200, 68, 0.7)',
                outlineOffset: '-2px',
                pointerEvents: 'none',
                zIndex: 3,
            }}
        />
    );
}

// ── Props ───────────────────────────────────────────────────────

interface BackgroundEditorGridProps {
    treePositions: Position[];
    bushPositions: Position[];
    decoItems: BgDecoItem[];
    shortTree1Positions: Position[];
    shortTree2Positions: Position[];
    waterFoamPositions: Position[];
    groundOverrides: Map<string, {col: number; row: number} | null>;
    activeTool: BgTool;
    activeDecoAsset: string;
    activeGroundVariant: {col: number; row: number};
    hoveredCell: Position | null;
    onCellClick: (pos: Position) => void;
    onCellHover: (pos: Position | null) => void;
}

// ── Helpers ─────────────────────────────────────────────────────

function posKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
}

const isGroundTool = (t: BgTool) =>
    t === 'groundPaint' || t === 'groundErase' || t === 'groundVariant';

const isDecoTool = (t: BgTool) => !isGroundTool(t);

// ── Component ───────────────────────────────────────────────────

export function BackgroundEditorGrid({
    treePositions,
    bushPositions,
    decoItems,
    shortTree1Positions,
    shortTree2Positions,
    waterFoamPositions,
    groundOverrides,
    activeTool,
    activeDecoAsset,
    activeGroundVariant,
    hoveredCell,
    onCellClick,
    onCellHover,
}: BackgroundEditorGridProps) {
    const playOriginX = (BASE_WIDTH - PLAY_GRID_W * TILE_SIZE) / 2;
    const playOriginY = (BASE_HEIGHT - PLAY_GRID_H * TILE_SIZE) / 2;
    const groundOriginX = playOriginX - BG_PADDING_TILES * TILE_SIZE;
    const groundOriginY = playOriginY - BG_PADDING_TILES * TILE_SIZE;

    // ── Ground tiles ──────────────────────────────────────────

    const groundTiles: React.ReactNode[] = [];
    const groundOverlays: React.ReactNode[] = [];

    // Default BG grid (15×11) — every cell has auto-assigned ground unless overridden
    for (let y = 0; y < BG_GRID_H; y++) {
        for (let x = 0; x < BG_GRID_W; x++) {
            const key = posKey({x, y});
            const override = groundOverrides.get(key);

            if (override === null) {
                groundOverlays.push(<ErasedGroundOverlay key={`erased-${x}-${y}`} x={x} y={y} />);
            } else if (override !== undefined) {
                groundTiles.push(
                    <GroundTile key={`g-${x}-${y}`} col={override.col} row={override.row} x={x} y={y} />
                );
                if (isGroundTool(activeTool)) {
                    groundOverlays.push(<VariantGroundOverlay key={`vo-${x}-${y}`} x={x} y={y} />);
                }
            } else {
                groundTiles.push(
                    <GroundTile key={`g-${x}-${y}`} tileKey={getAutoGroundTileKey(x, y)} x={x} y={y} />
                );
            }
        }
    }

    // Extra ground tiles painted outside the default BG grid
    for (const [key, val] of groundOverrides) {
        if (val === null) continue;
        const [x, y] = key.split(',').map(Number);
        if (x < 0 || x >= BG_GRID_W || y < 0 || y >= BG_GRID_H) {
            groundTiles.push(
                <GroundTile key={`g-${x}-${y}`} col={val.col} row={val.row} x={x} y={y} />
            );
            if (isGroundTool(activeTool)) {
                groundOverlays.push(<VariantGroundOverlay key={`vo-${x}-${y}`} x={x} y={y} />);
            }
        }
    }

    // ── Clickable cells (full canvas range) ───────────────────

    const cells: React.ReactNode[] = [];

    for (let y = CANVAS_TILE_Y_MIN; y <= CANVAS_TILE_Y_MAX; y++) {
        for (let x = CANVAS_TILE_X_MIN; x <= CANVAS_TILE_X_MAX; x++) {
            const pos = {x, y};
            const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

            let valid: boolean;
            if (isGroundTool(activeTool)) {
                valid = isGroundCell(pos);
                if (valid && activeTool === 'groundVariant') {
                    const override = groundOverrides.get(posKey(pos));
                    // Invalid if: explicitly erased (null) OR outside BG grid with no tile yet (undefined)
                    const inBg = x >= 0 && x < BG_GRID_W && y >= 0 && y < BG_GRID_H;
                    if (override === null || (!inBg && override === undefined)) valid = false;
                }
                if (valid && activeTool === 'groundPaint') {
                    const override = groundOverrides.get(posKey(pos));
                    // Already has ground — painting does nothing
                    if (override !== null && override !== undefined) valid = false;
                    // BG grid with no override already has auto-assigned ground
                    const inBg = x >= 0 && x < BG_GRID_W && y >= 0 && y < BG_GRID_H;
                    if (inBg && override === undefined) valid = false;
                }
            } else {
                valid = isValidDecoCell(pos);
            }

            let bg = 'transparent';
            if (isHovered) {
                bg = valid ? 'rgba(255, 255, 255, 0.12)' : 'rgba(204, 51, 51, 0.2)';
            }

            cells.push(
                <div
                    key={`cell-${x}-${y}`}
                    className={valid ? styles.gridCell : styles.gridCellInvalid}
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

    // ── Hover preview ─────────────────────────────────────────

    const hx = hoveredCell?.x ?? 0;
    const hy = hoveredCell?.y ?? 0;
    const hoveredIsValidDeco = hoveredCell !== null && isValidDecoCell({x: hx, y: hy});

    const showGroundPreview = (() => {
        if (hoveredCell === null || activeTool !== 'groundVariant') return false;
        if (!isGroundCell({x: hx, y: hy})) return false;
        const override = groundOverrides.get(posKey({x: hx, y: hy}));
        if (override === null) return false; // explicitly erased
        const inBg = hx >= 0 && hx < BG_GRID_W && hy >= 0 && hy < BG_GRID_H;
        if (!inBg && override === undefined) return false; // outside BG grid, no tile yet
        return true;
    })();

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
                {groundOverlays}
                {showGroundPreview && (
                    <div
                        style={{
                            position: 'absolute',
                            left: hx * TILE_SIZE,
                            top: hy * TILE_SIZE,
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                            opacity: 0.6,
                            pointerEvents: 'none',
                            zIndex: 4,
                        }}
                    >
                        <GroundTile col={activeGroundVariant.col} row={activeGroundVariant.row} x={0} y={0} />
                    </div>
                )}
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

            {/* Water foam — below ground tiles (zIndex 1, between WaterLayer:0 and ground:2) */}
            <div
                style={{
                    position: 'absolute',
                    left: groundOriginX,
                    top: groundOriginY,
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            >
                {waterFoamPositions.map((pos, i) => (
                    <Sprite key={`wf-${i}`} spriteKey="waterFoam" animation="idle" x={pos.x} y={pos.y} zIndex={Math.max(0, pos.y)} />
                ))}
                {hoveredIsValidDeco && activeTool === 'waterFoam' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite spriteKey="waterFoam" animation="idle" x={hx} y={hy} zIndex={100} />
                    </div>
                )}
            </div>

            {/* All other decorations — above ground tiles (zIndex 5) */}
            <div
                style={{
                    position: 'absolute',
                    left: groundOriginX,
                    top: groundOriginY,
                    zIndex: 5,
                    pointerEvents: 'none',
                }}
            >
                {treePositions.map((pos, i) => (
                    <Sprite key={`tree-${i}`} spriteKey="tree" animation="idle" x={pos.x} y={pos.y} zIndex={Math.max(0, pos.y)} />
                ))}
                {bushPositions.map((pos, i) => (
                    <Sprite key={`bush-${i}`} spriteKey="bush" animation="idle" x={pos.x} y={pos.y} zIndex={Math.max(0, pos.y)} />
                ))}
                {shortTree1Positions.map((pos, i) => (
                    <Sprite key={`st1-${i}`} spriteKey="shortTree1" animation="idle" x={pos.x} y={pos.y} zIndex={Math.max(0, pos.y)} />
                ))}
                {shortTree2Positions.map((pos, i) => (
                    <Sprite key={`st2-${i}`} spriteKey="shortTree2" animation="idle" x={pos.x} y={pos.y} zIndex={Math.max(0, pos.y)} />
                ))}
                {decoItems.map((item, i) => (
                    <DecoItem key={`deco-${i}`} src={item.asset} x={item.pos.x} y={item.pos.y} zIndex={Math.max(0, item.pos.y)} />
                ))}

                {/* Hover previews */}
                {hoveredIsValidDeco && isDecoTool(activeTool) && activeTool === 'tree' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite spriteKey="tree" animation="idle" x={hx} y={hy} zIndex={100} />
                    </div>
                )}
                {hoveredIsValidDeco && activeTool === 'bush' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite spriteKey="bush" animation="idle" x={hx} y={hy} zIndex={100} />
                    </div>
                )}
                {hoveredIsValidDeco && activeTool === 'shortTree1' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite spriteKey="shortTree1" animation="idle" x={hx} y={hy} zIndex={100} />
                    </div>
                )}
                {hoveredIsValidDeco && activeTool === 'shortTree2' && (
                    <div style={{opacity: 0.4, pointerEvents: 'none'}}>
                        <Sprite spriteKey="shortTree2" animation="idle" x={hx} y={hy} zIndex={100} />
                    </div>
                )}
                {hoveredIsValidDeco && activeTool === 'deco' && (
                    <DecoItem src={activeDecoAsset} x={hx} y={hy} zIndex={100} opacity={0.4} />
                )}
            </div>

            {/* Clickable grid — cells can overflow outside their container into the full canvas */}
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
