import type {Puzzle} from '@/game/types';
import {PUZZLES} from '@/puzzles';
import type {EditorTool, PuzzleMetadata} from './types';
import {WallAssetPicker} from './WallAssetPicker';
import styles from './editorStyles.module.css';

interface PuzzleEditorToolbarProps {
    activeTool: EditorTool;
    activeWallAsset: string;
    metadata: PuzzleMetadata;
    barrelPathLengths: [number, number];
    onSetTool: (tool: EditorTool) => void;
    onSetWallAsset: (asset: string) => void;
    onUpdateMetadata: (partial: Partial<PuzzleMetadata>) => void;
    onClearGrid: () => void;
    onClearBarrelPath: (index: 0 | 1) => void;
    onPlaytest: () => void;
    onExport: () => void;
    onLoadPuzzle: (puzzle: Puzzle) => void;
}

const TOOLS: {key: EditorTool; label: string}[] = [
    {key: 'wall', label: 'Wall'},
    {key: 'staticTNT', label: 'TNT'},
    {key: 'knightA', label: 'Knight A'},
    {key: 'knightB', label: 'Knight B'},
    {key: 'barrelPath0', label: 'Barrel 0'},
    {key: 'barrelPath1', label: 'Barrel 1'},
    {key: 'erase', label: 'Erase'},
];

export function PuzzleEditorToolbar({
    activeTool,
    activeWallAsset,
    metadata,
    barrelPathLengths,
    onSetTool,
    onSetWallAsset,
    onUpdateMetadata,
    onClearGrid,
    onClearBarrelPath,
    onPlaytest,
    onExport,
    onLoadPuzzle,
}: PuzzleEditorToolbarProps) {
    const handleClearGrid = () => {
        if (confirm('Clear the entire grid?')) onClearGrid();
    };

    const handleNameChange = (name: string) => {
        onUpdateMetadata({name});
        // Auto-suggest ID from name
        if (!metadata.id || metadata.id === slugify(metadata.name)) {
            onUpdateMetadata({name, id: slugify(name)});
        }
    };

    return (
        <div className={styles.sidebar}>
            {/* Tools */}
            <p className={styles.sectionLabel}>Tools</p>
            <div className={styles.toolGrid}>
                {TOOLS.map(t => (
                    <button
                        key={t.key}
                        className={activeTool === t.key ? styles.toolButtonActive : styles.toolButton}
                        onClick={() => onSetTool(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Load puzzle */}
            <p className={styles.sectionLabel}>Load Puzzle</p>
            <select
                className={styles.textInput}
                defaultValue=""
                onChange={e => {
                    const puzzle = PUZZLES.find(p => p.id === e.target.value);
                    if (puzzle) {
                        onLoadPuzzle(puzzle);
                        e.target.value = '';
                    }
                }}
            >
                <option value="" disabled>Select a puzzle...</option>
                {PUZZLES.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                    </option>
                ))}
            </select>

            {/* Wall asset picker */}
            {activeTool === 'wall' && (
                <>
                    <p className={styles.sectionLabel}>Wall Asset</p>
                    <WallAssetPicker activeAsset={activeWallAsset} onSelect={onSetWallAsset} />
                </>
            )}

            {/* Barrel info */}
            <p className={styles.sectionLabel}>Barrel Paths</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span className={styles.countBadge}>B0: {barrelPathLengths[0]} steps</span>
                    {barrelPathLengths[0] > 0 && (
                        <button className={styles.toolButton} onClick={() => onClearBarrelPath(0)}>
                            Clear
                        </button>
                    )}
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span className={styles.countBadge}>B1: {barrelPathLengths[1]} steps</span>
                    {barrelPathLengths[1] > 0 && (
                        <button className={styles.toolButton} onClick={() => onClearBarrelPath(1)}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <p className={styles.sectionLabel}>Puzzle Metadata</p>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Name</label>
                <input
                    className={styles.textInput}
                    value={metadata.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="The First Fork"
                />
            </div>
            <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>ID</label>
                <input
                    className={styles.textInput}
                    value={metadata.id}
                    onChange={e => onUpdateMetadata({id: e.target.value})}
                    placeholder="puzzle_01"
                />
            </div>
            <div style={{display: 'flex', gap: 8}}>
                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Min moves</label>
                    <input
                        className={styles.numberInput}
                        type="number"
                        value={metadata.minMoves ?? ''}
                        onChange={e => onUpdateMetadata({minMoves: e.target.value ? Number(e.target.value) : null})}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Max moves</label>
                    <input
                        className={styles.numberInput}
                        type="number"
                        value={metadata.maxMoves ?? ''}
                        onChange={e => onUpdateMetadata({maxMoves: e.target.value ? Number(e.target.value) : null})}
                    />
                </div>
            </div>

            {/* Actions */}
            <p className={styles.sectionLabel}>Actions</p>
            <button className={styles.primaryButton} onClick={onPlaytest}>
                Playtest
            </button>
            <button className={styles.primaryButton} onClick={onExport}>
                Export TypeScript
            </button>
            <button className={styles.dangerButton} onClick={handleClearGrid}>
                Clear Grid
            </button>
        </div>
    );
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}
