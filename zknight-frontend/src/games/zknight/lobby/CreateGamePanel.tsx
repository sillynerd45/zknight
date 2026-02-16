import { useState, useCallback, useEffect } from 'react';
import type { ZknightService } from '../zknightService';
import type { Game } from '../bindings';

interface CreateGamePanelProps {
  service: ZknightService;
  wallet: {
    publicKey: string | null;
    isConnected: boolean;
    getContractSigner: () => any;
  };
  activeGameId: number | null;
  onGameCreated: (gameId: number) => void;
  onGameCancelled: () => void;
  onGameStart: (game: Game) => void;
  onError: (message: string) => void;
}

export function CreateGamePanel({
  service,
  wallet,
  activeGameId,
  onGameCreated,
  onGameCancelled,
  onGameStart,
  onError,
}: CreateGamePanelProps) {
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Poll for opponent joining (when activeGameId is set)
  useEffect(() => {
    if (activeGameId === null) return;

    let cancelled = false;

    const pollForOpponent = async () => {
      try {
        const game = await service.getGame(activeGameId);

        if (!cancelled && game) {
          // Check if game has transitioned to Active status (opponent joined)
          if (game.status.tag === 'Active' || game.status.tag === 'Committing') {
            console.log('[CreateGamePanel] Opponent joined! Starting game...');
            onGameStart(game);
          }
        }
      } catch (err) {
        console.error('[CreateGamePanel] Error polling game:', err);
      }
    };

    // Poll immediately, then every 3 seconds
    pollForOpponent();
    const interval = setInterval(pollForOpponent, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeGameId, service, onGameStart]);

  const handleCreateGame = useCallback(async () => {
    if (!wallet.isConnected || !wallet.publicKey) {
      onError('Please connect your wallet first');
      return;
    }

    setCreating(true);
    onError(''); // Clear previous errors

    try {
      const signer = wallet.getContractSigner();
      const gameId = await service.createGame(wallet.publicKey, signer);

      console.log('[CreateGamePanel] Game created:', gameId);
      onGameCreated(gameId);
    } catch (err: any) {
      console.error('[CreateGamePanel] Error creating game:', err);

      if (err.message?.includes('AlreadyHasActiveGame')) {
        onError('You already have an active game. Cancel it first or wait for it to finish.');
      } else {
        onError(err.message || 'Failed to create game');
      }
    } finally {
      setCreating(false);
    }
  }, [wallet, service, onGameCreated, onError]);

  const handleCancelGame = useCallback(async () => {
    if (!wallet.isConnected || !wallet.publicKey || activeGameId === null) {
      return;
    }

    setCancelling(true);
    onError(''); // Clear previous errors

    try {
      const signer = wallet.getContractSigner();
      await service.cancelGame(activeGameId, wallet.publicKey, signer);

      console.log('[CreateGamePanel] Game cancelled:', activeGameId);
      onGameCancelled();
    } catch (err: any) {
      console.error('[CreateGamePanel] Error cancelling game:', err);
      onError(err.message || 'Failed to cancel game');
    } finally {
      setCancelling(false);
    }
  }, [wallet, service, activeGameId, onGameCancelled, onError]);

  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      background: '#f9f9f9',
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Create Game</h3>

      {activeGameId === null ? (
        // Create game button
        <div>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
            Create a new game and wait for an opponent to join
          </p>
          <button
            onClick={handleCreateGame}
            disabled={!wallet.isConnected || creating}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: wallet.isConnected ? '#28a745' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: wallet.isConnected && !creating ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
          {!wallet.isConnected && (
            <p style={{
              margin: '0.5rem 0 0 0',
              fontSize: '0.85rem',
              color: '#999',
            }}>
              Connect your wallet to create a game
            </p>
          )}
        </div>
      ) : (
        // Waiting for opponent
        <div>
          <div style={{
            padding: '1rem',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#333' }}>
              Game ID: {activeGameId}
            </p>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
              Waiting for an opponent to join...
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#28a745',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              Waiting for player 2...
            </span>
          </div>

          <button
            onClick={handleCancelGame}
            disabled={cancelling}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Game'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
