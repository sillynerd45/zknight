import { useState, useEffect, useCallback } from 'react';
import { ScaledContainer } from '@/components/ScaledContainer';
import { GameScene } from '@/components/GameScene';
import { GameProvider, useGameContext } from '@/context/GameContext';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { MoveCounter } from '@/components/MoveCounter';
import { RaceTimer } from '@/components/RaceTimer';
import { WinOverlay, ExplosionOverlay } from '@/components/GameOverlays';
// CycleNotice removed - cycle detection disabled
import puzzle01 from '@/puzzles/puzzle_01';
import { EditorSelector, BackgroundEditor, PuzzleEditor } from '@/editor';

type GameView = 'lobby' | 'game' | 'editor';

function GamePlayView({ onBack }: { onBack: () => void }) {
  const { state, dispatch, puzzle } = useGameContext();
  const [showExplosionOverlay, setShowExplosionOverlay] = useState(false);

  useKeyboardInput();

  // Start game on mount
  useEffect(() => {
    dispatch({ type: 'START' });
  }, [dispatch]);

  // Reset showExplosionOverlay when game resets
  useEffect(() => {
    if (state.gameStatus !== 'exploded') {
      setShowExplosionOverlay(false);
    }
  }, [state.gameStatus]);

  const handleExplosionComplete = useCallback(() => {
    setShowExplosionOverlay(true);
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'START' });
  }, [dispatch]);

  // Compute elapsed time for win overlay
  const elapsed = state.startTime ? Date.now() - state.startTime : 0;

  return (
    <ScaledContainer>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <GameScene
          puzzle={puzzle}
          knightA={state.knightA}
          knightB={state.knightB}
          barrels={state.barrels}
          gameStatus={state.gameStatus}
          lastDirection={state.lastDirection}
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
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 9999,
          background: '#fff',
          color: '#000',
          border: 'none',
          padding: '4px 12px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        Back to Lobby
      </button>
    </ScaledContainer>
  );
}

export function ZknightGame() {
  const [view, setView] = useState<GameView>('lobby');
  const [editorSubView, setEditorSubView] = useState<'background' | 'puzzle' | null>(null);

  const handleLeaveEditor = useCallback(() => {
    setEditorSubView(null);
    setView('lobby');
  }, []);

  switch (view) {
    case 'lobby':
      return (
        <div style={{ padding: '2rem', fontFamily: 'var(--font-body)' }}>
          <h2>ZKnight Lobby</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Matchmaking will be implemented in a later step.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setView('game')}>
              Start Game (placeholder)
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={() => { setEditorSubView(null); setView('editor'); }}
                style={{ background: '#666', color: '#fff', border: '1px solid #444' }}
              >
                Dev Editors
              </button>
            )}
          </div>
        </div>
      );

    case 'game':
      return (
        <GameProvider puzzle={puzzle01}>
          <GamePlayView onBack={() => setView('lobby')} />
        </GameProvider>
      );

    case 'editor':
      if (editorSubView === 'background') {
        return <BackgroundEditor onBack={() => setEditorSubView(null)} />;
      }
      if (editorSubView === 'puzzle') {
        return <PuzzleEditor onBack={() => setEditorSubView(null)} />;
      }
      return (
        <EditorSelector
          onSelect={setEditorSubView}
          onBack={handleLeaveEditor}
        />
      );
  }
}
