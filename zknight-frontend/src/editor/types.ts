import type {Position} from '@/game/types';

// ── Background Editor ──────────────────────────────────────────────

export interface SheepItem {
    pos: Position;
    mirror: boolean;
}

export type BgTool =
    | 'tree' | 'bush' | 'deco' | 'erase'
    | 'shortTree1' | 'shortTree2' | 'waterFoam'
    | 'gold' | 'sheep' | 'waterRock'
    | 'groundPaint' | 'groundErase' | 'groundVariant';

export interface BgDecoItem {
    pos: Position;
    asset: string;
}

export interface BackgroundEditorState {
    treePositions: Position[];
    bushPositions: Position[];
    decoItems: BgDecoItem[];
    activeTool: BgTool;
    activeDecoAsset: string;
    hoveredCell: Position | null;
}

// ── Puzzle Editor ──────────────────────────────────────────────────

export type CellType = 'floor' | 'wall' | 'staticTNT';

export type EditorTool =
    | 'wall'
    | 'staticTNT'
    | 'knightA'
    | 'knightB'
    | 'barrelPath0'
    | 'barrelPath1'
    | 'erase';

export interface EditorCell {
    type: CellType;
    wallAsset: string | null;
}

export interface PuzzleMetadata {
    id: string;
    name: string;
    minMoves: number | null;
    maxMoves: number | null;
}

export interface PuzzleEditorState {
    grid: EditorCell[][];
    knightA: Position | null;
    knightB: Position | null;
    barrelPaths: [Position[], Position[]];
    activeTool: EditorTool;
    activeWallAsset: string;
    metadata: PuzzleMetadata;
    isPlaytesting: boolean;
}
