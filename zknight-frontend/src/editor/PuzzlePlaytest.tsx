import {useState, useEffect, useCallback} from 'react';
import {ScaledContainer} from '@/components/ScaledContainer';
import {GameScene} from '@/components/GameScene';
import {GameProvider, useGameContext} from '@/context/GameContext';
import {useKeyboardInput} from '@/hooks/useKeyboardInput';
import {MoveCounter} from '@/components/MoveCounter';
import {RaceTimer} from '@/components/RaceTimer';
import {WinOverlay, ExplosionOverlay} from '@/components/GameOverlays';
// CycleNotice removed - cycle detection disabled
import type {Puzzle} from '@/game/types';
import styles from './editorStyles.module.css';

interface PuzzlePlaytestProps {
    puzzle: Puzzle;
    onBack: () => void;
}

function PlaytestInner({onBack}: {onBack: () => void}) {
    const {state, dispatch, puzzle} = useGameContext();
    const [showExplosionOverlay, setShowExplosionOverlay] = useState(false);

    useKeyboardInput();

    useEffect(() => {
        dispatch({type: 'START'});
    }, [dispatch]);

    useEffect(() => {
        if (state.gameStatus !== 'exploded') {
            setShowExplosionOverlay(false);
        }
    }, [state.gameStatus]);

    const handleExplosionComplete = useCallback(() => {
        setShowExplosionOverlay(true);
    }, []);

    const handleReset = useCallback(() => {
        dispatch({type: 'RESET'});
        dispatch({type: 'START'});
    }, [dispatch]);

    const elapsed = state.startTime ? Date.now() - state.startTime : 0;

    return (
        <ScaledContainer>
            <div style={{position: 'relative', width: '100%', height: '100%'}}>
                <GameScene
                    puzzle={puzzle}
                    knightA={state.knightA}
                    knightB={state.knightB}
                    barrels={state.barrels}
                    gameStatus={state.gameStatus}
                    lastDirection={state.lastDirection}
                    explodedKnights={state.explodedKnights}
                    destroyedStaticTNT={state.destroyedStaticTNT}
                    onExplosionComplete={handleExplosionComplete}
                />
                <MoveCounter />
                <RaceTimer />
                {/* CycleNotice removed - cycle detection disabled */}
                {state.gameStatus === 'won' && (
                    <WinOverlay turnCount={state.turnCount} elapsed={elapsed} />
                )}
                {state.gameStatus === 'exploded' && showExplosionOverlay && (
                    <ExplosionOverlay onReset={handleReset} />
                )}
            </div>
            <button className={styles.backButton} onClick={onBack}>
                Back to Editor
            </button>
        </ScaledContainer>
    );
}

export function PuzzlePlaytest({puzzle, onBack}: PuzzlePlaytestProps) {
    return (
        <GameProvider puzzle={puzzle}>
            <PlaytestInner onBack={onBack} />
        </GameProvider>
    );
}
