import styles from './editorStyles.module.css';

interface EditorSelectorProps {
    onSelect: (editor: 'background' | 'puzzle') => void;
    onBack: () => void;
}

export function EditorSelector({onSelect, onBack}: EditorSelectorProps) {
    return (
        <div className={styles.selectorContainer}>
            <h2 className={styles.selectorTitle}>Dev Editors</h2>
            <p className={styles.selectorSubtitle}>
                Design tools for ZKnight. Dev-only — not included in production builds.
            </p>

            <div className={styles.selectorCards}>
                <button
                    className={styles.selectorCard}
                    onClick={() => onSelect('background')}
                >
                    <p className={styles.selectorCardTitle}>Background Editor</p>
                    <p className={styles.selectorCardDesc}>
                        Place trees and bushes around the island border.
                        Exports to backgroundLayout.ts.
                    </p>
                </button>

                <button
                    className={styles.selectorCard}
                    onClick={() => onSelect('puzzle')}
                >
                    <p className={styles.selectorCardTitle}>Puzzle Editor</p>
                    <p className={styles.selectorCardDesc}>
                        Design puzzles with walls, TNT, knights, and barrel paths.
                        Includes integrated playtesting.
                    </p>
                </button>
            </div>

            <button
                className={styles.actionButton}
                style={{marginTop: 24, width: 'auto'}}
                onClick={onBack}
            >
                Back to Lobby
            </button>
        </div>
    );
}
