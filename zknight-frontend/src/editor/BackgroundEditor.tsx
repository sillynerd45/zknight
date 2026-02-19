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
        shortTree1Positions,
        shortTree2Positions,
        waterFoamPositions,
        groundOverrides,
        activeTool,
        setActiveTool,
        activeDecoAsset,
        setActiveDecoAsset,
        activeGroundVariant,
        setActiveGroundVariant,
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
                    shortTree1Positions={shortTree1Positions}
                    shortTree2Positions={shortTree2Positions}
                    waterFoamPositions={waterFoamPositions}
                    groundOverrides={groundOverrides}
                    activeTool={activeTool}
                    activeDecoAsset={activeDecoAsset}
                    activeGroundVariant={activeGroundVariant}
                    hoveredCell={hoveredCell}
                    onCellClick={clickCell}
                    onCellHover={setHoveredCell}
                />
            </ScaledContainer>

            <BackgroundEditorToolbar
                activeTool={activeTool}
                activeDecoAsset={activeDecoAsset}
                activeGroundVariant={activeGroundVariant}
                treeCount={treePositions.length}
                bushCount={bushPositions.length}
                decoCount={decoItems.length}
                shortTree1Count={shortTree1Positions.length}
                shortTree2Count={shortTree2Positions.length}
                waterFoamCount={waterFoamPositions.length}
                onSetTool={setActiveTool}
                onSetDecoAsset={setActiveDecoAsset}
                onSetGroundVariant={setActiveGroundVariant}
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
