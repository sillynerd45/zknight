import { useState, useCallback } from 'react';
import type { ZknightService } from '../zknightService';
import { retryWithBackoff } from './utils';
import styles from './lobbyStyles.module.css';

interface JoinGamePanelProps {
  service: ZknightService;
  wallet: {
    publicKey: string | null;
    isConnected: boolean;
    getContractSigner: () => any;
  };
  onJoinSuccess: (gameId: number) => void;
  onError: (message: string) => void;
}

export function JoinGamePanel({
  service,
  wallet,
  onJoinSuccess,
  onError,
}: JoinGamePanelProps) {
  const [gameIdInput, setGameIdInput] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoinById = useCallback(async () => {
    const gameId = parseInt(gameIdInput, 10);

    if (isNaN(gameId) || gameId < 0) {
      onError('Please enter a valid game ID');
      return;
    }

    if (!wallet.isConnected || !wallet.publicKey) {
      onError('Please connect your wallet first');
      return;
    }

    setJoining(true);
    onError(''); // Clear previous errors

    try {
      const signer = wallet.getContractSigner();

      // Join the game with retry logic
      console.log('[JoinGamePanel] Joining game:', gameId);
      await retryWithBackoff(
        () => service.joinGame(gameId, wallet.publicKey!, signer),
        2,
        500,
        3000
      );

      console.log('[JoinGamePanel] Successfully joined game:', gameId);
      onJoinSuccess(gameId);
      setGameIdInput(''); // Clear input on success
    } catch (err: any) {
      console.error('[JoinGamePanel] Error joining game:', err);

      // Handle specific errors
      if (err.message?.includes('GameExpired')) {
        onError('This game has expired (>1 hour old)');
      } else if (err.message?.includes('GameNotFound')) {
        onError('Game not found. Check the ID and try again.');
      } else if (err.message?.includes('GameFull')) {
        onError('This game is already full');
      } else if (err.message?.includes('AlreadyHasActiveGame')) {
        onError('You already have an active game. Finish it first.');
      } else if (err.message?.includes('CannotPlaySelf')) {
        onError('You cannot play against yourself');
      } else {
        onError(err.message || 'Failed to join game');
      }
    } finally {
      setJoining(false);
    }
  }, [gameIdInput, wallet, service, onJoinSuccess, onError]);

  return (
    <div>
      <p className={styles.panelDescription}>
        Enter a Game ID to join directly
      </p>

      <div className={styles.joinRow}>
        <input
          type="number"
          value={gameIdInput}
          onChange={(e) => setGameIdInput(e.target.value)}
          placeholder="Enter Game ID..."
          disabled={joining}
          className={styles.joinInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !joining && gameIdInput) {
              handleJoinById();
            }
          }}
        />
        <button
          className={styles.joinBtn}
          onClick={handleJoinById}
          disabled={!wallet.isConnected || joining || !gameIdInput}
        >
          {joining ? 'JOINING...' : 'JOIN'}
        </button>
      </div>

      {!wallet.isConnected && (
        <p className={styles.hint}>Connect your wallet to join a game</p>
      )}
    </div>
  );
}
