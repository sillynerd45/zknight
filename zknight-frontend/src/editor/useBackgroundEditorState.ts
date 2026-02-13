import {useState, useCallback} from 'react';
import type {Position} from '@/game/types';
import type {BgTool, BgDecoItem} from './types';
import {
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
} from '@/puzzles/backgroundLayout';

/** Check if a position is in the border zone (outside the 11x7 play area). */
export function isBorderCell(pos: Position): boolean {
    const playMinX = BG_PADDING_TILES;
    const playMaxX = BG_PADDING_TILES + PLAY_GRID_W - 1;
    const playMinY = BG_PADDING_TILES;
    const playMaxY = BG_PADDING_TILES + PLAY_GRID_H - 1;

    if (pos.x >= playMinX && pos.x <= playMaxX && pos.y >= playMinY && pos.y <= playMaxY) {
        return false;
    }
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

/** Format as TypeScript source for backgroundLayout.ts. */
function formatExport(trees: Position[], bushes: Position[], decos: BgDecoItem[]): string {
    const fmtPosArr = (name: string, arr: Position[]): string => {
        if (arr.length === 0) return `export const ${name}: Position[] = [];`;
        const items = arr.map(p => `    {x: ${p.x}, y: ${p.y}},`).join('\n');
        return `export const ${name}: Position[] = [\n${items}\n];`;
    };

    const fmtDecoArr = (name: string, arr: BgDecoItem[]): string => {
        if (arr.length === 0) return `export const ${name}: BgDecoItem[] = [];`;
        const items = arr.map(d =>
            `    {pos: {x: ${d.pos.x}, y: ${d.pos.y}}, asset: '${d.asset}'},`
        ).join('\n');
        return `export const ${name}: BgDecoItem[] = [\n${items}\n];`;
    };

    return `import type {Position} from '@/game/types';

export interface BgDecoItem {
    pos: Position;
    asset: string;
}

${fmtPosArr('TREE_POSITIONS', trees)}

${fmtPosArr('BUSH_POSITIONS', bushes)}

${fmtDecoArr('DECO_POSITIONS', decos)}
`;
}

export function useBackgroundEditorState() {
    const [treePositions, setTreePositions] = useState<Position[]>([]);
    const [bushPositions, setBushPositions] = useState<Position[]>([]);
    const [decoItems, setDecoItems] = useState<BgDecoItem[]>([]);
    const [activeTool, setActiveTool] = useState<BgTool>('tree');
    const [activeDecoAsset, setActiveDecoAsset] = useState<string>(DECO_ASSETS[0]);
    const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

    /** Remove any decoration at pos (tree, bush, or deco). */
    const clearAt = useCallback((pos: Position) => {
        setTreePositions(prev => removePos(prev, pos));
        setBushPositions(prev => removePos(prev, pos));
        setDecoItems(prev => removeDecoAt(prev, pos));
    }, []);

    const clickCell = useCallback((pos: Position) => {
        if (!isBorderCell(pos)) return;

        switch (activeTool) {
            case 'tree':
                if (hasPos(treePositions, pos)) {
                    setTreePositions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setTreePositions(prev => [...prev, pos]);
                }
                break;
            case 'bush':
                if (hasPos(bushPositions, pos)) {
                    setBushPositions(prev => removePos(prev, pos));
                } else {
                    clearAt(pos);
                    setBushPositions(prev => [...prev, pos]);
                }
                break;
            case 'deco':
                if (hasDecoAt(decoItems, pos)) {
                    setDecoItems(prev => removeDecoAt(prev, pos));
                } else {
                    clearAt(pos);
                    setDecoItems(prev => [...prev, {pos, asset: activeDecoAsset}]);
                }
                break;
            case 'erase':
                clearAt(pos);
                break;
        }
    }, [activeTool, activeDecoAsset, treePositions, bushPositions, decoItems, clearAt]);

    const reset = useCallback(() => {
        setTreePositions([]);
        setBushPositions([]);
        setDecoItems([]);
    }, []);

    const loadCurrent = useCallback(() => {
        setTreePositions([...SAVED_TREES]);
        setBushPositions([...SAVED_BUSHES]);
        setDecoItems([...SAVED_DECOS]);
    }, []);

    const exportAsTypeScript = useCallback(() => {
        return formatExport(treePositions, bushPositions, decoItems);
    }, [treePositions, bushPositions, decoItems]);

    return {
        treePositions,
        bushPositions,
        decoItems,
        activeTool,
        setActiveTool,
        activeDecoAsset,
        setActiveDecoAsset,
        hoveredCell,
        setHoveredCell,
        clickCell,
        reset,
        loadCurrent,
        exportAsTypeScript,
    };
}
