import { useState } from 'react';
import { ScaledContainer } from '@/components/ScaledContainer';
import { SpriteTestPage } from '@/components/SpriteTestPage';

type GameView = 'lobby' | 'game' | 'editor';

export function ZknightGame() {
  const [view, setView] = useState<GameView>('lobby');
  const [gameId, setGameId] = useState<string | null>(null);

  switch (view) {
    case 'lobby':
      return (
        <div style={{ padding: '2rem', fontFamily: 'var(--font-body)' }}>
          <h2>ZKnight Lobby</h2>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Matchmaking will be implemented in a later step.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setGameId('test');
                setView('game');
              }}
            >
              Start Game (placeholder)
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={() => setView('editor')}
                style={{ background: '#666', color: '#fff', border: '1px solid #444' }}
              >
                Puzzle Editor
              </button>
            )}
          </div>
        </div>
      );

    case 'game':
      return (
        <ScaledContainer>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1a3a5c',
              color: '#fff',
              fontFamily: 'var(--font-body)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2>Game {gameId}</h2>
              <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
                Game board will be implemented in later steps.
              </p>
              <button
                onClick={() => setView('lobby')}
                style={{ marginTop: '1rem', background: '#fff', color: '#1a3a5c' }}
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </ScaledContainer>
      );

    case 'editor':
      return (
        <ScaledContainer>
          <SpriteTestPage />
          <button
            onClick={() => setView('lobby')}
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
}
