import {useState, useCallback} from 'react';
import type {Position, Puzzle} from '@/game/types';
import {PLAY_GRID_W, PLAY_GRID_H} from '@/game/constants';
import {ROCK_ASSETS} from '@/sprites/staticAssets';
import type {EditorCell, EditorTool, PuzzleMetadata, PuzzleEditorState} from './types';

function createEmptyGrid(): EditorCell[][] {
    return Array.from({length: PLAY_GRID_H}, () =>
        Array.from({length: PLAY_GRID_W}, () => ({type: 'floor' as const, wallAsset: null}))
    );
}

function isSamePos(a: Position, b: Position): boolean {
    return a.x === b.x && a.y === b.y;
}

const defaultMetadata: PuzzleMetadata = {
    id: '',
    name: '',
    minMoves: null,
    maxMoves: null,
};

export function usePuzzleEditorState() {
    const [grid, setGrid] = useState<EditorCell[][]>(createEmptyGrid);
    const [knightA, setKnightA] = useState<Position | null>(null);
    const [knightB, setKnightB] = useState<Position | null>(null);
    const [barrelPaths, setBarrelPaths] = useState<[Position[], Position[]]>([[], []]);
    const [activeTool, setActiveTool] = useState<EditorTool>('wall');
    const [activeWallAsset, setActiveWallAsset] = useState<string>(ROCK_ASSETS[0]);
    const [metadata, setMetadata] = useState<PuzzleMetadata>({...defaultMetadata});
    const [isPlaytesting, setIsPlaytesting] = useState(false);

    const removeFromBarrelPaths = useCallback((pos: Position) => {
        setBarrelPaths(prev => [
            prev[0].filter(p => !isSamePos(p, pos)),
            prev[1].filter(p => !isSamePos(p, pos)),
        ]);
    }, []);

    const clickCell = useCallback((pos: Position) => {
        const {x, y} = pos;
        if (x < 0 || x >= PLAY_GRID_W || y < 0 || y >= PLAY_GRID_H) return;

        switch (activeTool) {
            case 'wall':
                // Remove knight/barrel at this position if present
                if (knightA && isSamePos(knightA, pos)) setKnightA(null);
                if (knightB && isSamePos(knightB, pos)) setKnightB(null);
                removeFromBarrelPaths(pos);
                setGrid(prev => {
                    const next = prev.map(row => [...row]);
                    next[y][x] = {type: 'wall', wallAsset: activeWallAsset};
                    return next;
                });
                break;

            case 'staticTNT':
                if (knightA && isSamePos(knightA, pos)) setKnightA(null);
                if (knightB && isSamePos(knightB, pos)) setKnightB(null);
                removeFromBarrelPaths(pos);
                setGrid(prev => {
                    const next = prev.map(row => [...row]);
                    next[y][x] = {type: 'staticTNT', wallAsset: null};
                    return next;
                });
                break;

            case 'knightA':
                // Cell becomes floor underneath the knight
                setGrid(prev => {
                    const next = prev.map(row => [...row]);
                    next[y][x] = {type: 'floor', wallAsset: null};
                    return next;
                });
                removeFromBarrelPaths(pos);
                if (knightB && isSamePos(knightB, pos)) setKnightB(null);
                setKnightA(pos);
                break;

            case 'knightB':
                setGrid(prev => {
                    const next = prev.map(row => [...row]);
                    next[y][x] = {type: 'floor', wallAsset: null};
                    return next;
                });
                removeFromBarrelPaths(pos);
                if (knightA && isSamePos(knightA, pos)) setKnightA(null);
                setKnightB(pos);
                break;

            case 'barrelPath0':
            case 'barrelPath1': {
                const idx = activeTool === 'barrelPath0' ? 0 : 1;
                setBarrelPaths(prev => {
                    const path = [...prev[idx]];
                    const existingIdx = path.findIndex(p => isSamePos(p, pos));
                    if (existingIdx >= 0) {
                        path.splice(existingIdx, 1);
                    } else {
                        path.push(pos);
                    }
                    const next: [Position[], Position[]] = [...prev];
                    next[idx] = path;
                    return next;
                });
                // Clear cell to floor if it was a wall/TNT
                if (grid[y][x].type !== 'floor') {
                    setGrid(prev => {
                        const next = prev.map(row => [...row]);
                        next[y][x] = {type: 'floor', wallAsset: null};
                        return next;
                    });
                }
                if (knightA && isSamePos(knightA, pos)) setKnightA(null);
                if (knightB && isSamePos(knightB, pos)) setKnightB(null);
                break;
            }

            case 'erase':
                setGrid(prev => {
                    const next = prev.map(row => [...row]);
                    next[y][x] = {type: 'floor', wallAsset: null};
                    return next;
                });
                if (knightA && isSamePos(knightA, pos)) setKnightA(null);
                if (knightB && isSamePos(knightB, pos)) setKnightB(null);
                removeFromBarrelPaths(pos);
                break;
        }
    }, [activeTool, activeWallAsset, knightA, knightB, grid, removeFromBarrelPaths]);

    const clearGrid = useCallback(() => {
        setGrid(createEmptyGrid());
        setKnightA(null);
        setKnightB(null);
        setBarrelPaths([[], []]);
    }, []);

    const clearBarrelPath = useCallback((index: 0 | 1) => {
        setBarrelPaths(prev => {
            const next: [Position[], Position[]] = [...prev];
            next[index] = [];
            return next;
        });
    }, []);

    const updateMetadata = useCallback((partial: Partial<PuzzleMetadata>) => {
        setMetadata(prev => ({...prev, ...partial}));
    }, []);

    const togglePlaytest = useCallback(() => {
        setIsPlaytesting(prev => !prev);
    }, []);

    const loadPuzzle = useCallback((puzzle: Puzzle) => {
        // Build grid from puzzle data
        const newGrid = createEmptyGrid();
        for (const wall of puzzle.walls) {
            const rockIdx = (wall.x * 7 + wall.y * 13) % ROCK_ASSETS.length;
            newGrid[wall.y][wall.x] = {type: 'wall', wallAsset: ROCK_ASSETS[rockIdx]};
        }
        for (const tnt of puzzle.staticTNT) {
            newGrid[tnt.y][tnt.x] = {type: 'staticTNT', wallAsset: null};
        }
        setGrid(newGrid);

        // Set knight positions
        setKnightA(puzzle.knightA);
        setKnightB(puzzle.knightB);

        // Extract barrel paths
        const paths: [Position[], Position[]] = [[], []];
        puzzle.movingTNT.forEach((barrel, i) => {
            if (i < 2) paths[i] = [...barrel.path];
        });
        setBarrelPaths(paths);

        // Set metadata
        setMetadata({
            id: puzzle.id,
            name: puzzle.name,
            minMoves: null,
            maxMoves: null,
        });

        setIsPlaytesting(false);
    }, []);

    const state: PuzzleEditorState = {
        grid,
        knightA,
        knightB,
        barrelPaths,
        activeTool,
        activeWallAsset,
        metadata,
        isPlaytesting,
    };

    return {
        state,
        clickCell,
        setActiveTool,
        setActiveWallAsset,
        clearGrid,
        clearBarrelPath,
        updateMetadata,
        togglePlaytest,
        loadPuzzle,
    };
}
