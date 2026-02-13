import {useState, useCallback} from 'react';
import type {BgTool} from './types';
import {DECO_ASSETS} from '@/sprites/staticAssets';
import {getDecoSize} from './decoSizes';
import styles from './editorStyles.module.css';

interface BackgroundEditorToolbarProps {
    activeTool: BgTool;
    activeDecoAsset: string;
    treeCount: number;
    bushCount: number;
    decoCount: number;
    onSetTool: (tool: BgTool) => void;
    onSetDecoAsset: (asset: string) => void;
    onLoadCurrent: () => void;
    onReset: () => void;
    onExport: () => string;
}

const TOOLS: {key: BgTool; label: string}[] = [
    {key: 'tree', label: 'Tree'},
    {key: 'bush', label: 'Bush'},
    {key: 'deco', label: 'Deco'},
    {key: 'erase', label: 'Erase'},
];

export function BackgroundEditorToolbar({
    activeTool,
    activeDecoAsset,
    treeCount,
    bushCount,
    decoCount,
    onSetTool,
    onSetDecoAsset,
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
        if (confirm('Clear all decorations?')) {
            onReset();
        }
    }, [onReset]);

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

            {/* Deco asset picker — shown when deco tool is active */}
            {activeTool === 'deco' && (
                <>
                    <p className={styles.sectionLabel}>Deco Asset</p>
                    <div className={styles.decoGrid}>
                        {DECO_ASSETS.map((asset) => {
                            const size = getDecoSize(asset);
                            const label = asset.split('/').pop()?.replace('.png', '') ?? '';
                            // Show actual dimensions in tooltip for non-standard sizes
                            const tooltip = size.width === 64 && size.height === 64
                                ? label
                                : `${label} (${size.width}x${size.height})`;
                            return (
                                <div
                                    key={asset}
                                    className={
                                        asset === activeDecoAsset
                                            ? styles.assetThumbActive
                                            : styles.assetThumb
                                    }
                                    style={{backgroundImage: `url('${asset}')`}}
                                    onClick={() => onSetDecoAsset(asset)}
                                    title={tooltip}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {/* Counts */}
            <p className={styles.sectionLabel}>Counts</p>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                <span className={styles.countBadge}>Trees: {treeCount}</span>
                <span className={styles.countBadge}>Bushes: {bushCount}</span>
                <span className={styles.countBadge}>Deco: {decoCount}</span>
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
