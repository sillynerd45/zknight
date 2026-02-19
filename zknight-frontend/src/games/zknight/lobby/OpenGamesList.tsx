import { useState, useCallback, useEffect } from 'react';
import type { Game } from '../bindings';
import type { ZknightService } from '../zknightService';
import { retryWithBackoff, shortenAddress, formatTimeSince, formatTimeRemaining, isExpiringSoon, isExpired } from './utils';
import styles from './lobbyStyles.module.css';

interface OpenGamesListProps {
  games: Game[];
  loading: boolean;
  currentPlayer: string | null;
  service: ZknightService;
  wallet: {
    publicKey: string | null;
    isConnected: boolean;
    getContractSigner: () => any;
  };
  onJoinSuccess: (gameId: number) => void;
  onError: (message: string) => void;
}

export function OpenGamesList({
  games,
  loading,
  currentPlayer,
  service,
  wallet,
  onJoinSuccess,
  onError,
}: OpenGamesListProps) {
  const [joiningGameId, setJoiningGameId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Update current time every 10 seconds for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleJoinGame = useCallback(async (gameId: number) => {
    if (!wallet.isConnected || !wallet.publicKey) {
      onError('Please connect your wallet first');
      return;
    }

    setJoiningGameId(gameId);
    onError(''); // Clear previous errors

    try {
      const signer = wallet.getContractSigner();

      // Join the game with retry logic
      console.log('[OpenGamesList] Joining game:', gameId);
      await retryWithBackoff(
        () => service.joinGame(gameId, wallet.publicKey!, signer),
        2,
        500,
        3000
      );

      console.log('[OpenGamesList] Successfully joined game:', gameId);
      onJoinSuccess(gameId);
    } catch (err: any) {
      console.error('[OpenGamesList] Error joining game:', err);

      // Handle specific errors
      if (err.message?.includes('GameExpired')) {
        onError('This game has expired (>1 hour old)');
      } else if (err.message?.includes('AlreadyHasActiveGame')) {
        onError('You already have an active game. Finish it first.');
      } else {
        onError(err.message || 'Failed to join game');
      }
    } finally {
      setJoiningGameId(null);
    }
  }, [wallet, service, onJoinSuccess, onError]);

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>OPEN LOBBIES</h3>

      {loading && games.length === 0 ? (
        <div className={styles.spinner}>
          <div className={styles.spinnerIcon} />
          <p className={styles.spinnerText}>Loading games...</p>
        </div>
      ) : games.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No open games</p>
          <p className={styles.emptyStateSub}>Create one to start playing!</p>
        </div>
      ) : (
        <div className={styles.gameListScroll}>
          {games.map((game) => {
            const isOwnGame = currentPlayer === game.player1;
            const gameExpired = isExpired(Number(game.created_at), currentTime);
            const gameExpiringSoon = isExpiringSoon(Number(game.created_at), currentTime);
            const timeRemaining = formatTimeRemaining(Number(game.created_at), currentTime);

            const rowClass = gameExpired
              ? styles.gameRowExpired
              : gameExpiringSoon
              ? styles.gameRowExpiring
              : isOwnGame
              ? styles.gameRowOwn
              : styles.gameRow;

            return (
              <div key={game.id} className={rowClass}>
                <div className={styles.gameInfo}>
                  <div className={styles.gameCreator}>
                    {shortenAddress(game.player1)}
                    {isOwnGame && <span className={styles.tag}>YOU</span>}
                  </div>
                  <div className={styles.gameMeta}>
                    <span className={styles.gameId}>#{game.id}</span>
                    <span>|</span>
                    <span>{formatTimeSince(Number(game.created_at), currentTime)}</span>
                    {timeRemaining && (
                      <>
                        <span>|</span>
                        <span className={gameExpired ? styles.expiryRed : gameExpiringSoon ? styles.expiryRed : styles.expiryGreen}>
                          {gameExpired ? 'EXPIRED' : `${timeRemaining} left`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  className={styles.btnPrimary}
                  onClick={() => handleJoinGame(game.id)}
                  disabled={gameExpired || isOwnGame || !wallet.isConnected || joiningGameId !== null}
                >
                  {joiningGameId === game.id
                    ? 'JOINING...'
                    : gameExpired
                    ? 'EXPIRED'
                    : isOwnGame
                    ? 'YOUR GAME'
                    : 'JOIN'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
