import {useState, useCallback} from 'react';
import {
    BASE_WIDTH,
    BASE_HEIGHT,
    TILE_SIZE,
    PLAY_GRID_W,
    PLAY_GRID_H,
    BG_PADDING_TILES,
} from '@/game/constants';
import type {Position} from '@/game/types';
import {WaterLayer} from '@/components/WaterLayer';
import {BackgroundDecorations} from '@/components/BackgroundDecorations';
import {BoardGrid} from '@/components/BoardGrid';
import {Sprite} from '@/components/Sprite';
import {StaticSprite} from '@/components/StaticSprite';
import {TARGET_TILES} from '@/sprites/staticAssets';
import type {PuzzleEditorState} from './types';
import {getDecoSize} from './decoSizes';
import styles from './editorStyles.module.css';

interface PuzzleEditorGridProps {
    state: PuzzleEditorState;
    onCellClick: (pos: Position) => void;
}

/** Dummy puzzle with no elements — just for rendering the ground grid. */
const EMPTY_PUZZLE = {
    id: '_editor',
    name: '',
    gridWidth: PLAY_GRID_W,
    gridHeight: PLAY_GRID_H,
    knightA: {x: -1, y: -1},
    knightB: {x: -1, y: -1},
    goalA: {x: -1, y: -1},
    goalB: {x: -1, y: -1},
    walls: [] as Position[],
    staticTNT: [] as Position[],
    movingTNT: [],
};

const BARREL_COLORS = ['rgba(68, 136, 204, 0.85)', 'rgba(220, 140, 40, 0.85)'];

export function PuzzleEditorGrid({state, onCellClick}: PuzzleEditorGridProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

    const playOriginX = (BASE_WIDTH - PLAY_GRID_W * TILE_SIZE) / 2;
    const playOriginY = (BASE_HEIGHT - PLAY_GRID_H * TILE_SIZE) / 2;
    const groundOriginX = playOriginX - BG_PADDING_TILES * TILE_SIZE;
    const groundOriginY = playOriginY - BG_PADDING_TILES * TILE_SIZE;

    const handleMouseDown = useCallback((pos: Position) => {
        setIsDragging(true);
        onCellClick(pos);
    }, [onCellClick]);

    const handleMouseEnter = useCallback((pos: Position) => {
        setHoveredCell(pos);
        if (!isDragging) return;
        const tool = state.activeTool;
        if (tool === 'wall' || tool === 'staticTNT' || tool === 'erase') {
            onCellClick(pos);
        }
    }, [isDragging, state.activeTool, onCellClick]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeaveGrid = useCallback(() => {
        setIsDragging(false);
        setHoveredCell(null);
    }, []);

    // Cell sprites for walls and staticTNT
    const cellSprites: React.ReactNode[] = [];
    for (let y = 0; y < PLAY_GRID_H; y++) {
        for (let x = 0; x < PLAY_GRID_W; x++) {
            const cell = state.grid[y][x];
            if (cell.type === 'wall' && cell.wallAsset) {
                const isDecoAsset = cell.wallAsset.startsWith('/sprites/deco/');
                if (isDecoAsset) {
                    const size = getDecoSize(cell.wallAsset);
                    const offsetX = (size.width - TILE_SIZE) / 2;
                    const offsetY = size.height - TILE_SIZE;
                    cellSprites.push(
                        <div
                            key={`wall-${x}-${y}`}
                            style={{
                                position: 'absolute',
                                width: size.width,
                                height: size.height,
                                left: x * TILE_SIZE - offsetX,
                                top: y * TILE_SIZE - offsetY,
                                backgroundImage: `url('${cell.wallAsset}')`,
                                backgroundSize: `${size.width}px ${size.height}px`,
                                backgroundRepeat: 'no-repeat',
                                imageRendering: 'pixelated',
                                zIndex: y,
                                pointerEvents: 'none',
                            }}
                        />
                    );
                } else {
                    cellSprites.push(
                        <StaticSprite
                            key={`wall-${x}-${y}`}
                            src={cell.wallAsset}
                            x={x}
                            y={y}
                            zIndex={y}
                        />
                    );
                }
            } else if (cell.type === 'staticTNT') {
                cellSprites.push(
                    <Sprite
                        key={`tnt-${x}-${y}`}
                        spriteKey="barrelStatic"
                        animation="staticIdle"
                        x={x}
                        y={y}
                        zIndex={y}
                    />
                );
            }
        }
    }

    // Goal tiles — only show when BOTH knights are placed
    const bothKnightsPlaced = state.knightA !== null && state.knightB !== null;

    // Barrel path overlays
    const barrelPathOverlays = state.barrelPaths.map((path, barrelIdx) => {
        if (path.length === 0) return null;
        const color = BARREL_COLORS[barrelIdx];

        return (
            <g key={`barrel-path-${barrelIdx}`}>
                {path.map((pos, i) => {
                    if (i === 0) return null;
                    const prev = path[i - 1];
                    return (
                        <line
                            key={`line-${barrelIdx}-${i}`}
                            x1={prev.x * TILE_SIZE + TILE_SIZE / 2}
                            y1={prev.y * TILE_SIZE + TILE_SIZE / 2}
                            x2={pos.x * TILE_SIZE + TILE_SIZE / 2}
                            y2={pos.y * TILE_SIZE + TILE_SIZE / 2}
                            stroke={color}
                            strokeWidth={2}
                            strokeDasharray="6 3"
                        />
                    );
                })}
                {path.map((pos, i) => (
                    <g key={`step-${barrelIdx}-${i}`}>
                        <circle
                            cx={pos.x * TILE_SIZE + TILE_SIZE / 2}
                            cy={pos.y * TILE_SIZE + TILE_SIZE / 2}
                            r={12}
                            fill={color}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={1}
                        />
                        <text
                            x={pos.x * TILE_SIZE + TILE_SIZE / 2}
                            y={pos.y * TILE_SIZE + TILE_SIZE / 2 + 4}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize={11}
                            fontFamily="monospace"
                            fontWeight="bold"
                        >
                            {i + 1}
                        </text>
                    </g>
                ))}
            </g>
        );
    });

    // Hover preview
    const renderHoverPreview = () => {
        if (!hoveredCell || isDragging) return null;
        const {x, y} = hoveredCell;
        const tool = state.activeTool;

        const wrapOpacity = (child: React.ReactNode) => (
            <div key="hover-preview" style={{opacity: 0.4, pointerEvents: 'none'}}>
                {child}
            </div>
        );

        switch (tool) {
            case 'wall': {
                const isDecoHover = state.activeWallAsset.startsWith('/sprites/deco/');
                if (isDecoHover) {
                    const size = getDecoSize(state.activeWallAsset);
                    const offsetX = (size.width - TILE_SIZE) / 2;
                    const offsetY = size.height - TILE_SIZE;
                    return wrapOpacity(
                        <div style={{
                            position: 'absolute',
                            width: size.width,
                            height: size.height,
                            left: x * TILE_SIZE - offsetX,
                            top: y * TILE_SIZE - offsetY,
                            backgroundImage: `url('${state.activeWallAsset}')`,
                            backgroundSize: `${size.width}px ${size.height}px`,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                            zIndex: 100,
                            pointerEvents: 'none',
                        }} />
                    );
                }
                return wrapOpacity(
                    <StaticSprite src={state.activeWallAsset} x={x} y={y} zIndex={100} />
                );
            }
            case 'staticTNT':
                return wrapOpacity(
                    <Sprite spriteKey="barrelStatic" animation="staticIdle" x={x} y={y} zIndex={100} />
                );
            case 'knightA':
                return wrapOpacity(
                    <Sprite spriteKey="knightA" animation="idle" x={x} y={y} zIndex={100} />
                );
            case 'knightB':
                return wrapOpacity(
                    <Sprite spriteKey="knightB" animation="idle" x={x} y={y} zIndex={100} mirror />
                );
            default:
                return null;
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                overflow: 'hidden',
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeaveGrid}
        >
            <WaterLayer />
            <BackgroundDecorations originX={groundOriginX} originY={groundOriginY} />
            <BoardGrid
                puzzle={EMPTY_PUZZLE}
                groundOriginX={groundOriginX}
                groundOriginY={groundOriginY}
                playOriginX={playOriginX}
                playOriginY={playOriginY}
            />

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

            {/* Play area elements container */}
            <div
                style={{
                    position: 'absolute',
                    left: playOriginX,
                    top: playOriginY,
                    zIndex: 5,
                    pointerEvents: 'none',
                }}
            >
                {/* Goal tiles — only when both knights are placed */}
                {bothKnightsPlaced && (
                    <>
                        {/* goalA = where Knight A needs to go = Knight B's start */}
                        <StaticSprite src={TARGET_TILES.knightA} x={state.knightB!.x} y={state.knightB!.y} zIndex={state.knightB!.y} />
                        {/* goalB = where Knight B needs to go = Knight A's start */}
                        <StaticSprite src={TARGET_TILES.knightB} x={state.knightA!.x} y={state.knightA!.y} zIndex={state.knightA!.y} />
                    </>
                )}

                {/* Walls and static TNT */}
                {cellSprites}

                {/* Knights */}
                {state.knightA && (
                    <Sprite
                        spriteKey="knightA"
                        animation="idle"
                        x={state.knightA.x}
                        y={state.knightA.y}
                        zIndex={30 + state.knightA.y}
                    />
                )}
                {state.knightB && (
                    <Sprite
                        spriteKey="knightB"
                        animation="idle"
                        x={state.knightB.x}
                        y={state.knightB.y}
                        zIndex={30 + state.knightB.y}
                        mirror
                    />
                )}

                {/* Hover preview */}
                {renderHoverPreview()}

                {/* Barrel path SVG overlay */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: PLAY_GRID_W * TILE_SIZE,
                        height: PLAY_GRID_H * TILE_SIZE,
                        pointerEvents: 'none',
                        zIndex: 50,
                    }}
                >
                    {barrelPathOverlays}
                </svg>
            </div>

            {/* Clickable cell overlay grid */}
            <div
                style={{
                    position: 'absolute',
                    left: playOriginX,
                    top: playOriginY,
                    width: PLAY_GRID_W * TILE_SIZE,
                    height: PLAY_GRID_H * TILE_SIZE,
                    zIndex: 60,
                }}
            >
                {Array.from({length: PLAY_GRID_H}, (_, y) =>
                    Array.from({length: PLAY_GRID_W}, (_, x) => (
                        <div
                            key={`cell-${x}-${y}`}
                            className={styles.gridCell}
                            style={{
                                left: x * TILE_SIZE,
                                top: y * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                            }}
                            onMouseDown={() => handleMouseDown({x, y})}
                            onMouseEnter={() => handleMouseEnter({x, y})}
                            onMouseLeave={() => setHoveredCell(null)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
