import {useState, useCallback} from 'react';
import type {BgTool} from './types';
import {DECO_ASSETS} from '@/sprites/staticAssets';
import {GROUND_TILE_MAP} from '@/sprites/groundTiles';
import {getDecoSize} from './decoSizes';
import styles from './editorStyles.module.css';

interface BackgroundEditorToolbarProps {
    activeTool: BgTool;
    activeDecoAsset: string;
    activeGroundVariant: {col: number; row: number};
    treeCount: number;
    bushCount: number;
    decoCount: number;
    shortTree1Count: number;
    shortTree2Count: number;
    waterFoamCount: number;
    goldCount: number;
    sheepCount: number;
    waterRockCount: number;
    activeSheepMirror: boolean;
    onSetTool: (tool: BgTool) => void;
    onSetSheepMirror: (v: boolean) => void;
    onSetDecoAsset: (asset: string) => void;
    onSetGroundVariant: (variant: {col: number; row: number}) => void;
    onLoadCurrent: () => void;
    onReset: () => void;
    onExport: () => string;
}

const DECORATION_TOOLS: {key: BgTool; label: string}[] = [
    {key: 'tree', label: 'Tree'},
    {key: 'bush', label: 'Bush'},
    {key: 'deco', label: 'Deco'},
    {key: 'shortTree1', label: 'Short Tree 1'},
    {key: 'shortTree2', label: 'Short Tree 2'},
    {key: 'waterFoam', label: 'Water Foam'},
    {key: 'gold', label: 'Gold'},
    {key: 'sheep', label: 'Sheep'},
    {key: 'waterRock', label: 'Water Rock'},
    {key: 'erase', label: 'Erase'},
];

const GROUND_TOOLS: {key: BgTool; label: string}[] = [
    {key: 'groundPaint', label: 'Paint Ground'},
    {key: 'groundErase', label: 'Erase Ground'},
    {key: 'groundVariant', label: 'Pick Variant'},
];

const {cols: TILEMAP_COLS, rows: TILEMAP_ROWS, tileSize: TILEMAP_TILE, src: TILEMAP_SRC} = GROUND_TILE_MAP;
const VARIANT_CELL_PX = 24; // display size of each tile in the picker

export function BackgroundEditorToolbar({
    activeTool,
    activeDecoAsset,
    activeGroundVariant,
    treeCount,
    bushCount,
    decoCount,
    shortTree1Count,
    shortTree2Count,
    waterFoamCount,
    goldCount,
    sheepCount,
    waterRockCount,
    activeSheepMirror,
    onSetTool,
    onSetSheepMirror,
    onSetDecoAsset,
    onSetGroundVariant,
    onLoadCurrent,
    onReset,
    onExport,
}: BackgroundEditorToolbarProps) {
    const [showExport, setShowExport] = useState(false);
    const [exportText, setExportText] = useState('');
    const [copied, setCopied] = useState(false);

    const handleExport = useCallback(() => {
        setExportText(onExport());
        setShowExport(true);
        setCopied(false);
    }, [onExport]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(exportText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: user can manually select and copy
        }
    }, [exportText]);

    const handleReset = useCallback(() => {
        if (confirm('Clear all decorations and ground tile overrides?')) {
            onReset();
        }
    }, [onReset]);

    return (
        <div className={styles.sidebar}>
            {/* Decoration tools */}
            <p className={styles.sectionLabel}>Decorations</p>
            <div className={styles.toolGrid}>
                {DECORATION_TOOLS.map(t => (
                    <button
                        key={t.key}
                        className={activeTool === t.key ? styles.toolButtonActive : styles.toolButton}
                        onClick={() => onSetTool(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Ground tile tools */}
            <p className={styles.sectionLabel}>Ground Tiles</p>
            <div className={styles.toolGrid}>
                {GROUND_TOOLS.map(t => (
                    <button
                        key={t.key}
                        className={activeTool === t.key ? styles.toolButtonActive : styles.toolButton}
                        onClick={() => onSetTool(t.key)}
                        title={
                            t.key === 'groundPaint' ? 'Restore erased ground tiles' :
                            t.key === 'groundErase' ? 'Remove ground tile (shows water)' :
                            'Paint custom tile variant from the tilemap'
                        }
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Deco asset picker */}
            {activeTool === 'deco' && (
                <>
                    <p className={styles.sectionLabel}>Deco Asset</p>
                    <div className={styles.decoGrid}>
                        {DECO_ASSETS.map((asset) => {
                            const size = getDecoSize(asset);
                            const label = asset.split('/').pop()?.replace('.png', '') ?? '';
                            const tooltip = size.width === 64 && size.height === 64
                                ? label
                                : `${label} (${size.width}x${size.height})`;
                            return (
                                <div
                                    key={asset}
                                    className={asset === activeDecoAsset ? styles.assetThumbActive : styles.assetThumb}
                                    style={{backgroundImage: `url('${asset}')`}}
                                    onClick={() => onSetDecoAsset(asset)}
                                    title={tooltip}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {/* Sheep mirror toggle */}
            {activeTool === 'sheep' && (
                <>
                    <p className={styles.sectionLabel}>Sheep Options</p>
                    <button
                        className={activeSheepMirror ? styles.toolButtonActive : styles.toolButton}
                        onClick={() => onSetSheepMirror(!activeSheepMirror)}
                    >
                        {activeSheepMirror ? 'Mirrored ↔' : 'Normal →'}
                    </button>
                </>
            )}

            {/* Ground tile variant picker */}
            {activeTool === 'groundVariant' && (
                <>
                    <p className={styles.sectionLabel}>Ground Tile Variant</p>
                    <div className={styles.groundVariantGrid}>
                        {Array.from({length: TILEMAP_ROWS}, (_, row) =>
                            Array.from({length: TILEMAP_COLS}, (_, col) => {
                                const isActive = activeGroundVariant.col === col && activeGroundVariant.row === row;
                                const bgX = -(col * TILEMAP_TILE) * (VARIANT_CELL_PX / TILEMAP_TILE);
                                const bgY = -(row * TILEMAP_TILE) * (VARIANT_CELL_PX / TILEMAP_TILE);
                                const bgSize = `${TILEMAP_COLS * VARIANT_CELL_PX}px ${TILEMAP_ROWS * VARIANT_CELL_PX}px`;
                                return (
                                    <div
                                        key={`${col}-${row}`}
                                        className={isActive ? styles.groundVariantCellActive : styles.groundVariantCell}
                                        style={{
                                            backgroundImage: `url('${TILEMAP_SRC}')`,
                                            backgroundPosition: `${bgX}px ${bgY}px`,
                                            backgroundSize: bgSize,
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                        onClick={() => onSetGroundVariant({col, row})}
                                        title={`col ${col}, row ${row}`}
                                    />
                                );
                            })
                        ).flat()}
                    </div>
                    <p className={styles.infoText}>
                        Click a tile, then click cells on the grid to apply variant.
                    </p>
                </>
            )}

            {/* Counts */}
            <p className={styles.sectionLabel}>Counts</p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                <span className={styles.countBadge}>Trees: {treeCount}</span>
                <span className={styles.countBadge}>Bushes: {bushCount}</span>
                <span className={styles.countBadge}>Deco: {decoCount}</span>
                <span className={styles.countBadge}>Short Tree 1: {shortTree1Count}</span>
                <span className={styles.countBadge}>Short Tree 2: {shortTree2Count}</span>
                <span className={styles.countBadge}>Water Foam: {waterFoamCount}</span>
                <span className={styles.countBadge}>Gold: {goldCount}</span>
                <span className={styles.countBadge}>Sheep: {sheepCount}</span>
                <span className={styles.countBadge}>Water Rock: {waterRockCount}</span>
            </div>

            {/* Actions */}
            <p className={styles.sectionLabel}>Actions</p>
            <button className={styles.actionButton} onClick={onLoadCurrent}>
                Load Current Layout
            </button>
            <button className={styles.dangerButton} onClick={handleReset}>
                Clear All
            </button>

            {/* Export */}
            <p className={styles.sectionLabel}>Export</p>
            {!showExport ? (
                <button className={styles.primaryButton} onClick={handleExport}>
                    Export TypeScript
                </button>
            ) : (
                <div className={styles.exportPanel}>
                    <textarea
                        className={styles.exportTextarea}
                        value={exportText}
                        readOnly
                        onFocus={e => e.target.select()}
                    />
                    <button className={styles.primaryButton} onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button className={styles.actionButton} onClick={() => setShowExport(false)}>
                        Close
                    </button>
                    <p className={styles.infoText}>
                        Paste into src/puzzles/backgroundLayout.ts
                    </p>
                </div>
            )}
        </div>
    );
}
