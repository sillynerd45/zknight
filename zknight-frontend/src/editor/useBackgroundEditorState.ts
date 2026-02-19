import {useState, useCallback} from 'react';
import type {Position} from '@/game/types';
import type {BgTool, BgDecoItem, SheepItem} from './types';
import {
    TILE_SIZE,
    BASE_WIDTH,
    BASE_HEIGHT,
    BG_GRID_W,
    BG_GRID_H,
    BG_PADDING_TILES,
    PLAY_GRID_W,
    PLAY_GRID_H,
} from '@/game/constants';
import {DECO_ASSETS} from '@/sprites/staticAssets';
import {
    TREE_POSITIONS as SAVED_TREES,
    BUSH_POSITIONS as SAVED_BUSHES,
    DECO_POSITIONS as SAVED_DECOS,
    SHORT_TREE_1_POSITIONS as SAVED_ST1,
    SHORT_TREE_2_POSITIONS as SAVED_ST2,
    WATER_FOAM_POSITIONS as SAVED_WF,
    GOLD_POSITIONS as SAVED_GOLD,
    SHEEP_POSITIONS as SAVED_SHEEP, // SheepItem[]
    WATER_ROCK_POSITIONS as SAVED_WR,
    GROUND_TILE_REMOVED as SAVED_GTR,
    GROUND_TILE_VARIANTS as SAVED_GTV,
} from '@/puzzles/backgroundLayout';

// ── Full-canvas tile bounds (BG-grid-relative coordinates) ─────
// groundOriginX = (1600 - 11*64)/2 - 2*64 = 320  →  exactly 5 tiles from canvas left
// groundOriginY = (900  -  7*64)/2 - 2*64 = 98   →  1.53 tiles from canvas top (not whole)
const _groundOriginX = (BASE_WIDTH  - PLAY_GRID_W * TILE_SIZE) / 2 - BG_PADDING_TILES * TILE_SIZE;
const _groundOriginY = (BASE_HEIGHT - PLAY_GRID_H * TILE_SIZE) / 2 - BG_PADDING_TILES * TILE_SIZE;

export const CANVAS_TILE_X_MIN = -Math.ceil(_groundOriginX / TILE_SIZE);              // -5
export const CANVAS_TILE_X_MAX = Math.ceil((BASE_WIDTH  - _groundOriginX) / TILE_SIZE) - 1; // 19
export const CANVAS_TILE_Y_MIN = -Math.ceil(_groundOriginY / TILE_SIZE);              // -2
export const CANVAS_TILE_Y_MAX = Math.ceil((BASE_HEIGHT - _groundOriginY) / TILE_SIZE) - 1; // 12

// ── Helper functions ────────────────────────────────────────────

const PLAY_AREA_X_MIN = BG_PADDING_TILES;
const PLAY_AREA_X_MAX = BG_PADDING_TILES + PLAY_GRID_W - 1;
const PLAY_AREA_Y_MIN = BG_PADDING_TILES;
const PLAY_AREA_Y_MAX = BG_PADDING_TILES + PLAY_GRID_H - 1;

function isPlayArea(pos: Position): boolean {
    return pos.x >= PLAY_AREA_X_MIN && pos.x <= PLAY_AREA_X_MAX
        && pos.y >= PLAY_AREA_Y_MIN && pos.y <= PLAY_AREA_Y_MAX;
}

/** Any canvas tile that isn't the play area is valid for decoration. */
export function isValidDecoCell(pos: Position): boolean {
    if (pos.x < CANVAS_TILE_X_MIN || pos.x > CANVAS_TILE_X_MAX) return false;
    if (pos.y < CANVAS_TILE_Y_MIN || pos.y > CANVAS_TILE_Y_MAX) return false;
    return !isPlayArea(pos);
}

/** Any canvas tile is valid for ground tile editing. */
export function isGroundCell(pos: Position): boolean {
    return pos.x >= CANVAS_TILE_X_MIN && pos.x <= CANVAS_TILE_X_MAX
        && pos.y >= CANVAS_TILE_Y_MIN && pos.y <= CANVAS_TILE_Y_MAX;
}

/** True if position is within the default ground area (15×11 BG grid). */
function isInBgGrid(pos: Position): boolean {
    return pos.x >= 0 && pos.x < BG_GRID_W && pos.y >= 0 && pos.y < BG_GRID_H;
}

function isSamePos(a: Position, b: Position): boolean {
    return a.x === b.x && a.y === b.y;
}

function removePos(arr: Position[], pos: Position): Position[] {
    return arr.filter(p => !isSamePos(p, pos));
}

function hasPos(arr: Position[], pos: Position): boolean {
    return arr.some(p => isSamePos(p, pos));
}

function removeDecoAt(arr: BgDecoItem[], pos: Position): BgDecoItem[] {
    return arr.filter(d => !isSamePos(d.pos, pos));
}

function hasDecoAt(arr: BgDecoItem[], pos: Position): boolean {
    return arr.some(d => isSamePos(d.pos, pos));
}

function removeSheepAt(arr: SheepItem[], pos: Position): SheepItem[] {
    return arr.filter(d => !isSamePos(d.pos, pos));
}

function hasSheepAt(arr: SheepItem[], pos: Position): boolean {
    return arr.some(d => isSamePos(d.pos, pos));
}

function posKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
}

// ── Export formatter ────────────────────────────────────────────

function fmtPosArr(name: string, arr: Position[]): string {
    if (arr.length === 0) return `export const ${name}: Position[] = [];`;
    const items = arr.map(p => `    {x: ${p.x}, y: ${p.y}},`).join('\n');
    return `export const ${name}: Position[] = [\n${items}\n];`;
}

function fmtDecoArr(name: string, arr: BgDecoItem[]): string {
    if (arr.length === 0) return `export const ${name}: BgDecoItem[] = [];`;
    const items = arr.map(d =>
        `    {pos: {x: ${d.pos.x}, y: ${d.pos.y}}, asset: '${d.asset}'},`
    ).join('\n');
    return `export const ${name}: BgDecoItem[] = [\n${items}\n];`;
}

function fmtSheepArr(name: string, arr: SheepItem[]): string {
    if (arr.length === 0) return `export const ${name}: SheepItem[] = [];`;
    const items = arr.map(d =>
        `    {pos: {x: ${d.pos.x}, y: ${d.pos.y}}, mirror: ${d.mirror}},`
    ).join('\n');
    return `export const ${name}: SheepItem[] = [\n${items}\n];`;
}

function fmtGroundVariants(
    removed: Position[],
    variants: {pos: Position; col: number; row: number}[]
): string {
    const removedStr = removed.length === 0
        ? `export const GROUND_TILE_REMOVED: Position[] = [];`
        : `export const GROUND_TILE_REMOVED: Position[] = [\n${removed.map(p => `    {x: ${p.x}, y: ${p.y}},`).join('\n')}\n];`;

    const variantsStr = variants.length === 0
        ? `export const GROUND_TILE_VARIANTS: {pos: Position; col: number; row: number}[] = [];`
        : `export const GROUND_TILE_VARIANTS: {pos: Position; col: number; row: number}[] = [\n${variants.map(v => `    {pos: {x: ${v.pos.x}, y: ${v.pos.y}}, col: ${v.col}, row: ${v.row}},`).join('\n')}\n];`;

    return `${removedStr}\n\n${variantsStr}`;
}

function formatExport(
    trees: Position[],
    bushes: Position[],
    decos: BgDecoItem[],
    shortTree1: Position[],
    shortTree2: Position[],
    waterFoam: Position[],
    gold: Position[],
    sheep: SheepItem[],
    waterRock: Position[],
    groundOverrides: Map<string, {col: number; row: number} | null>
): string {
    const removed: Position[] = [];
    const variants: {pos: Position; col: number; row: number}[] = [];
    for (const [key, val] of groundOverrides) {
        const [x, y] = key.split(',').map(Number);
        if (val === null) {
            // null only ever set for BG-grid cells (groundErase deletes for outside-BG)
            // guard anyway so stale data never pollutes the export
            if (x >= 0 && x < BG_GRID_W && y >= 0 && y < BG_GRID_H) {
                removed.push({x, y});
            }
        } else {
            variants.push({pos: {x, y}, col: val.col, row: val.row});
        }
    }

    return `import type {Position} from '@/game/types';

export interface BgDecoItem {
    pos: Position;
    asset: string;
}

export interface SheepItem {
    pos: Position;
    mirror: boolean;
}

${fmtPosArr('TREE_POSITIONS', trees)}

${fmtPosArr('BUSH_POSITIONS', bushes)}

${fmtPosArr('SHORT_TREE_1_POSITIONS', shortTree1)}

${fmtPosArr('SHORT_TREE_2_POSITIONS', shortTree2)}

${fmtPosArr('WATER_FOAM_POSITIONS', waterFoam)}

${fmtPosArr('GOLD_POSITIONS', gold)}

${fmtSheepArr('SHEEP_POSITIONS', sheep)}

${fmtPosArr('WATER_ROCK_POSITIONS', waterRock)}

${fmtGroundVariants(removed, variants)}

${fmtDecoArr('DECO_POSITIONS', decos)}
`;
}

// ── Hook ────────────────────────────────────────────────────────

export function useBackgroundEditorState() {
    const [treePositions, setTreePositions] = useState<Position[]>([]);
    const [bushPositions, setBushPositions] = useState<Position[]>([]);
    const [decoItems, setDecoItems] = useState<BgDecoItem[]>([]);
    const [shortTree1Positions, setShortTree1Positions] = useState<Position[]>([]);
    const [shortTree2Positions, setShortTree2Positions] = useState<Position[]>([]);
    const [waterFoamPositions, setWaterFoamPositions] = useState<Position[]>([]);
    const [goldPositions, setGoldPositions] = useState<Position[]>([]);
    const [sheepPositions, setSheepPositions] = useState<SheepItem[]>([]);
    const [activeSheepMirror, setActiveSheepMirror] = useState(false);
    const [waterRockPositions, setWaterRockPositions] = useState<Position[]>([]);
    // Map key = "x,y", value = null (removed) | {col,row} (custom variant)
    const [groundOverrides, setGroundOverrides] = useState<Map<string, {col: number; row: number} | null>>(new Map());

    const [activeTool, setActiveTool] = useState<BgTool>('tree');
    const [activeDecoAsset, setActiveDecoAsset] = useState<string>(DECO_ASSETS[0]);
    const [activeGroundVariant, setActiveGroundVariant] = useState<{col: number; row: number}>({col: 0, row: 0});
    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

    /** Remove any decoration at pos (tree, bush, deco, shortTree1/2, waterFoam, gold, sheep, waterRock). Ground tiles are unaffected. */
    const clearAt = useCallback((pos: Position) => {
        setTreePositions(prev => removePos(prev, pos));
        setBushPositions(prev => removePos(prev, pos));
        setDecoItems(prev => removeDecoAt(prev, pos));
        setShortTree1Positions(prev => removePos(prev, pos));
        setShortTree2Positions(prev => removePos(prev, pos));
        setWaterFoamPositions(prev => removePos(prev, pos));
        setGoldPositions(prev => removePos(prev, pos));
        setSheepPositions(prev => removeSheepAt(prev, pos));
        setWaterRockPositions(prev => removePos(prev, pos));
    }, []);

    const clickCell = useCallback((pos: Position) => {
        switch (activeTool) {
            case 'tree':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(treePositions, pos)) {
                    setTreePositions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setTreePositions(prev => [...prev, pos]);
                }
                break;

            case 'bush':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(bushPositions, pos)) {
                    setBushPositions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setBushPositions(prev => [...prev, pos]);
                }
                break;

            case 'deco':
                if (!isValidDecoCell(pos)) return;
                if (hasDecoAt(decoItems, pos)) {
                    setDecoItems(prev => removeDecoAt(prev, pos));
                } else {
                    clearAt(pos);
                    setDecoItems(prev => [...prev, {pos, asset: activeDecoAsset}]);
                }
                break;

            case 'shortTree1':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(shortTree1Positions, pos)) {
                    setShortTree1Positions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setShortTree1Positions(prev => [...prev, pos]);
                }
                break;

            case 'shortTree2':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(shortTree2Positions, pos)) {
                    setShortTree2Positions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setShortTree2Positions(prev => [...prev, pos]);
                }
                break;

            case 'waterFoam':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(waterFoamPositions, pos)) {
                    setWaterFoamPositions(prev => removePos(prev, pos));
                } else {
                    setWaterFoamPositions(prev => [...prev, pos]);
                }
                break;

            case 'gold':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(goldPositions, pos)) {
                    setGoldPositions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setGoldPositions(prev => [...prev, pos]);
                }
                break;

            case 'sheep':
                if (!isValidDecoCell(pos)) return;
                if (hasSheepAt(sheepPositions, pos)) {
                    setSheepPositions(prev => removeSheepAt(prev, pos));
                } else {
                    clearAt(pos);
                    setSheepPositions(prev => [...prev, {pos, mirror: activeSheepMirror}]);
                }
                break;

            case 'waterRock':
                if (!isValidDecoCell(pos)) return;
                if (hasPos(waterRockPositions, pos)) {
                    setWaterRockPositions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setWaterRockPositions(prev => [...prev, pos]);
                }
                break;

            case 'groundPaint': {
                if (!isGroundCell(pos)) return;
                const key = posKey(pos);
                setGroundOverrides(prev => {
                    const current = prev.get(key);
                    // Cell already has ground (custom or auto): no-op
                    if (current !== null && current !== undefined) return prev;
                    const next = new Map(prev);
                    if (isInBgGrid(pos)) {
                        // Was explicitly erased (null) — restore to auto-assigned
                        next.delete(key);
                    } else {
                        // Outside BG grid: paint with active ground variant
                        next.set(key, {...activeGroundVariant});
                    }
                    return next;
                });
                break;
            }

            case 'groundErase': {
                if (!isGroundCell(pos)) return;
                const key = posKey(pos);
                setGroundOverrides(prev => {
                    const next = new Map(prev);
                    if (isInBgGrid(pos)) {
                        // Mark as removed from the default BG grid ground
                        next.set(key, null);
                    } else {
                        // Outside BG grid: just delete the custom tile (back to "no ground")
                        next.delete(key);
                    }
                    return next;
                });
                break;
            }

            case 'groundVariant': {
                if (!isGroundCell(pos)) return;
                const key = posKey(pos);
                setGroundOverrides(prev => {
                    // Don't paint over explicitly erased BG-grid cells (use groundPaint first)
                    if (prev.get(key) === null) return prev;
                    const next = new Map(prev);
                    next.set(key, {...activeGroundVariant});
                    return next;
                });
                break;
            }

            case 'erase':
                if (!isValidDecoCell(pos)) return;
                clearAt(pos);
                break;
        }
    }, [
        activeTool, activeDecoAsset, activeGroundVariant, activeSheepMirror,
        treePositions, bushPositions, decoItems,
        shortTree1Positions, shortTree2Positions, waterFoamPositions,
        goldPositions, sheepPositions, waterRockPositions,
        groundOverrides, clearAt,
    ]);

    const reset = useCallback(() => {
        setTreePositions([]);
        setBushPositions([]);
        setDecoItems([]);
        setShortTree1Positions([]);
        setShortTree2Positions([]);
        setWaterFoamPositions([]);
        setGoldPositions([]);
        setSheepPositions([] as SheepItem[]);
        setWaterRockPositions([]);
        setGroundOverrides(new Map());
    }, []);

    const loadCurrent = useCallback(() => {
        setTreePositions([...SAVED_TREES]);
        setBushPositions([...SAVED_BUSHES]);
        setDecoItems([...SAVED_DECOS]);
        setShortTree1Positions([...SAVED_ST1]);
        setShortTree2Positions([...SAVED_ST2]);
        setWaterFoamPositions([...SAVED_WF]);
        setGoldPositions([...SAVED_GOLD]);
        setSheepPositions(SAVED_SHEEP.map(s => ({...s})));
        setWaterRockPositions([...SAVED_WR]);

        const overrides = new Map<string, {col: number; row: number} | null>();
        for (const pos of SAVED_GTR) {
            overrides.set(posKey(pos), null);
        }
        for (const v of SAVED_GTV) {
            overrides.set(posKey(v.pos), {col: v.col, row: v.row});
        }
        setGroundOverrides(overrides);
    }, []);

    const exportAsTypeScript = useCallback(() => {
        return formatExport(
            treePositions, bushPositions, decoItems,
            shortTree1Positions, shortTree2Positions, waterFoamPositions,
            goldPositions, sheepPositions, waterRockPositions,
            groundOverrides
        );
    }, [treePositions, bushPositions, decoItems, shortTree1Positions, shortTree2Positions, waterFoamPositions, goldPositions, sheepPositions, waterRockPositions, groundOverrides]);

    return {
        treePositions,
        bushPositions,
        decoItems,
        shortTree1Positions,
        shortTree2Positions,
        waterFoamPositions,
        goldPositions,
        sheepPositions,
        waterRockPositions,
        activeSheepMirror,
        setActiveSheepMirror,
        groundOverrides,
        activeTool,
        setActiveTool,
        activeDecoAsset,
        setActiveDecoAsset,
        activeGroundVariant,
        setActiveGroundVariant,
        hoveredCell,
        setHoveredCell,
        clickCell,
        reset,
        loadCurrent,
        exportAsTypeScript,
    };
}
