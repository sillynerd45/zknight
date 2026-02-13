import {useState, useCallback} from 'react';
import {ScaledContainer} from '@/components/ScaledContainer';
import {PuzzleEditorGrid} from './PuzzleEditorGrid';
import {PuzzleEditorToolbar} from './PuzzleEditorToolbar';
import {PuzzleExportModal} from './PuzzleExportModal';
import {PuzzlePlaytest} from './PuzzlePlaytest';
import {usePuzzleEditorState} from './usePuzzleEditorState';
import {buildPuzzleFromEditor, exportPuzzleAsTypeScript} from './exportPuzzle';
import styles from './editorStyles.module.css';

interface PuzzleEditorProps {
    onBack: () => void;
}

export function PuzzleEditor({onBack}: PuzzleEditorProps) {
    const {
        state,
        clickCell,
        setActiveTool,
        setActiveWallAsset,
        clearGrid,
        clearBarrelPath,
        updateMetadata,
        togglePlaytest,
    } = usePuzzleEditorState();

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportCode, setExportCode] = useState<string | null>(null);
    const [exportErrors, setExportErrors] = useState<string[] | null>(null);

    const handleExport = useCallback(() => {
        const result = exportPuzzleAsTypeScript(state);
        if (result.valid) {
            setExportCode(result.code!);
            setExportErrors(null);
        } else {
            setExportCode(null);
            setExportErrors(result.errors!);
        }
        setShowExportModal(true);
    }, [state]);

    const handlePlaytest = useCallback(() => {
        const result = buildPuzzleFromEditor(state);
        if (!result.valid) {
            setExportCode(null);
            setExportErrors(result.errors!);
            setShowExportModal(true);
            return;
        }
        togglePlaytest();
    }, [state, togglePlaytest]);

    // Playtest mode
    if (state.isPlaytesting) {
        const result = buildPuzzleFromEditor(state);
        if (result.valid && result.puzzle) {
            return (
                <PuzzlePlaytest
                    puzzle={result.puzzle}
                    onBack={togglePlaytest}
                />
            );
        }
    }

    return (
        <>
            <ScaledContainer>
                <PuzzleEditorGrid
                    state={state}
                    onCellClick={clickCell}
                />
            </ScaledContainer>

            <PuzzleEditorToolbar
                activeTool={state.activeTool}
                activeWallAsset={state.activeWallAsset}
                metadata={state.metadata}
                barrelPathLengths={[state.barrelPaths[0].length, state.barrelPaths[1].length]}
                onSetTool={setActiveTool}
                onSetWallAsset={setActiveWallAsset}
                onUpdateMetadata={updateMetadata}
                onClearGrid={clearGrid}
                onClearBarrelPath={clearBarrelPath}
                onPlaytest={handlePlaytest}
                onExport={handleExport}
            />

            {showExportModal && (
                <PuzzleExportModal
                    code={exportCode}
                    errors={exportErrors}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            <button className={styles.backButton} onClick={onBack}>
                Back
            </button>
        </>
    );
}
