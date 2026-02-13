import {useState, useCallback} from 'react';
import styles from './editorStyles.module.css';

interface PuzzleExportModalProps {
    code: string | null;
    errors: string[] | null;
    onClose: () => void;
}

export function PuzzleExportModal({code, errors, onClose}: PuzzleExportModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: user can manually select and copy
        }
    }, [code]);

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>Export Puzzle</h3>

                {errors && errors.length > 0 && (
                    <div style={{marginBottom: 12}}>
                        <p className={styles.sectionLabel}>Validation Errors</p>
                        {errors.map((err, i) => (
                            <p key={i} className={styles.modalError}>{err}</p>
                        ))}
                    </div>
                )}

                {code && (
                    <div className={styles.exportPanel}>
                        <textarea
                            className={styles.exportTextarea}
                            value={code}
                            readOnly
                            onFocus={e => e.target.select()}
                            style={{minHeight: 300}}
                        />
                        <button className={styles.primaryButton} onClick={handleCopy}>
                            {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <p className={styles.infoText}>
                            Paste into src/puzzles/puzzle_XX.ts, then add to PUZZLES array in index.ts.
                        </p>
                    </div>
                )}

                <button
                    className={styles.actionButton}
                    style={{marginTop: 12}}
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
