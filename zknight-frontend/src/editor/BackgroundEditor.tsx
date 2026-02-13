import {ScaledContainer} from '@/components/ScaledContainer';
import {BackgroundEditorGrid} from './BackgroundEditorGrid';
import {BackgroundEditorToolbar} from './BackgroundEditorToolbar';
import {useBackgroundEditorState} from './useBackgroundEditorState';
import styles from './editorStyles.module.css';

interface BackgroundEditorProps {
    onBack: () => void;
}

export function BackgroundEditor({onBack}: BackgroundEditorProps) {
    const {
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
    } = useBackgroundEditorState();

    return (
        <>
            <ScaledContainer>
                <BackgroundEditorGrid
                    treePositions={treePositions}
                    bushPositions={bushPositions}
                    decoItems={decoItems}
                    activeTool={activeTool}
                    activeDecoAsset={activeDecoAsset}
                    hoveredCell={hoveredCell}
                    onCellClick={clickCell}
                    onCellHover={setHoveredCell}
                />
            </ScaledContainer>

            <BackgroundEditorToolbar
                activeTool={activeTool}
                activeDecoAsset={activeDecoAsset}
                treeCount={treePositions.length}
                bushCount={bushPositions.length}
                decoCount={decoItems.length}
                onSetTool={setActiveTool}
                onSetDecoAsset={setActiveDecoAsset}
                onLoadCurrent={loadCurrent}
                onReset={reset}
                onExport={exportAsTypeScript}
            />

            <button className={styles.backButton} onClick={onBack}>
                Back
            </button>
        </>
    );
}
