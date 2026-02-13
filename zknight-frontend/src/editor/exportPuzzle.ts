import type {Puzzle, Position} from '@/game/types';
import {PLAY_GRID_W, PLAY_GRID_H} from '@/game/constants';
import type {PuzzleEditorState} from './types';

interface ExportResult {
    valid: boolean;
    puzzle?: Puzzle;
    code?: string;
    errors?: string[];
}

function fmtPos(p: Position): string {
    return `{x: ${p.x}, y: ${p.y}}`;
}

function fmtPosArray(arr: Position[], indent: string): string {
    if (arr.length === 0) return '[]';
    return `[\n${arr.map(p => `${indent}    ${fmtPos(p)},`).join('\n')}\n${indent}]`;
}

/** Build a Puzzle from editor state. Returns errors if invalid. */
export function buildPuzzleFromEditor(state: PuzzleEditorState): ExportResult {
    const errors: string[] = [];

    if (!state.knightA) errors.push('Knight A is not placed.');
    if (!state.knightB) errors.push('Knight B is not placed.');

    for (let i = 0; i < 2; i++) {
        const path = state.barrelPaths[i];
        if (path.length === 1) {
            errors.push(`Barrel ${i} path has only 1 step (need 0 or 2+).`);
        }
    }

    if (errors.length > 0) return {valid: false, errors};

    const walls: Position[] = [];
    const staticTNT: Position[] = [];

    for (let y = 0; y < PLAY_GRID_H; y++) {
        for (let x = 0; x < PLAY_GRID_W; x++) {
            const cell = state.grid[y][x];
            if (cell.type === 'wall') walls.push({x, y});
            if (cell.type === 'staticTNT') staticTNT.push({x, y});
        }
    }

    const movingTNT = state.barrelPaths
        .map((path, i) => ({
            id: `barrel_${i}`,
            path: [...path],
            loop: true,
        }))
        .filter(b => b.path.length >= 2);

    const puzzle: Puzzle = {
        id: state.metadata.id || 'unnamed',
        name: state.metadata.name || 'Unnamed Puzzle',
        gridWidth: PLAY_GRID_W,
        gridHeight: PLAY_GRID_H,
        knightA: state.knightA!,
        knightB: state.knightB!,
        goalA: state.knightB!,  // A's goal is B's start
        goalB: state.knightA!,  // B's goal is A's start
        walls,
        staticTNT,
        movingTNT,
    };

    return {valid: true, puzzle};
}

/** Export puzzle as formatted TypeScript source code. */
export function exportPuzzleAsTypeScript(state: PuzzleEditorState): ExportResult {
    const result = buildPuzzleFromEditor(state);
    if (!result.valid) return result;

    const p = result.puzzle!;
    const indent = '    ';

    const movingTntStr = p.movingTNT.length === 0
        ? '[]'
        : `[\n${p.movingTNT.map(b => {
            const pathStr = fmtPosArray(b.path, `${indent}${indent}`);
            return `${indent}    {\n` +
                `${indent}        id: '${b.id}',\n` +
                `${indent}        path: ${pathStr},\n` +
                `${indent}        loop: ${b.loop},\n` +
                `${indent}    },`;
        }).join('\n')}\n${indent}]`;

    const varName = p.id.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

    const code = `import type {Puzzle} from '../game/types';

const ${varName}: Puzzle = {
    id: '${p.id}',
    name: '${p.name}',
    gridWidth: ${p.gridWidth},
    gridHeight: ${p.gridHeight},

    knightA: ${fmtPos(p.knightA)},
    knightB: ${fmtPos(p.knightB)},

    goalA: ${fmtPos(p.goalA)},
    goalB: ${fmtPos(p.goalB)},

    walls: ${fmtPosArray(p.walls, indent)},

    staticTNT: ${fmtPosArray(p.staticTNT, indent)},

    movingTNT: ${movingTntStr},
};

export default ${varName};
`;

    return {valid: true, puzzle: p, code};
}
