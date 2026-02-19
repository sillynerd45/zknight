import { useState, useCallback, useEffect } from 'react';
import type { ZknightService } from '../zknightService';
import type { Game } from '../bindings';
import styles from './lobbyStyles.module.css';

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
  const [copied, setCopied] = useState(false);

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

  const handleCopyGameId = useCallback(() => {
    if (activeGameId === null) return;

    navigator.clipboard.writeText(String(activeGameId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeGameId]);

  return (
    <div>
      {activeGameId === null ? (
        // Create game button
        <div>
          <p className={styles.panelDescription}>
            Create a new game and wait for an opponent to join
          </p>
          <button
            className={styles.btnCreate}
            onClick={handleCreateGame}
            disabled={!wallet.isConnected || creating}
          >
            {creating ? 'CREATING...' : 'CREATE GAME'}
          </button>
          {!wallet.isConnected && (
            <p className={styles.hint}>Connect your wallet to create a game</p>
          )}
        </div>
      ) : (
        // Waiting for opponent
        <div>
          <div className={styles.waitingBox}>
            <p className={styles.waitingLabel}>Game Created</p>
            <div className={styles.waitingIdRow}>
              <p className={styles.waitingGameId}>#{activeGameId}</p>
              <button
                className={copied ? styles.btnCopied : styles.btnCopy}
                onClick={handleCopyGameId}
              >
                {copied ? 'COPIED!' : 'COPY ID'}
              </button>
            </div>
            <p className={styles.waitingHint}>Share this ID with your opponent</p>
          </div>

          <div className={styles.waitingPulse}>
            <div className={styles.waitingDot} />
            <span>Waiting for opponent...</span>
          </div>

          <button
            className={styles.btnDanger}
            onClick={handleCancelGame}
            disabled={cancelling}
            style={{ width: '100%' }}
          >
            {cancelling ? 'CANCELLING...' : 'CANCEL GAME'}
          </button>
        </div>
      )}
    </div>
  );
}
