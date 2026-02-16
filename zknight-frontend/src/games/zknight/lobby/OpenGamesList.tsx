import { useState, useCallback, useEffect } from 'react';
import type { Game } from '../bindings';
import type { ZknightService } from '../zknightService';

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

      // Join the game (service will simulate first and handle expiry if needed)
      console.log('[OpenGamesList] Joining game:', gameId);
      await service.joinGame(gameId, wallet.publicKey, signer);

      console.log('[OpenGamesList] Successfully joined game:', gameId);
      onJoinSuccess(gameId);
    } catch (err: any) {
      console.error('[OpenGamesList] Error joining game:', err);
      onError(err.message || 'Failed to join game');
    } finally {
      setJoiningGameId(null);
    }
  }, [wallet, service, onJoinSuccess, onError]);

  const formatTimeSince = (timestamp: number): string => {
    const diff = currentTime - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  const formatTimeRemaining = (timestamp: number): string | null => {
    const expiresAt = timestamp + 3600; // 1 hour = 3600 seconds
    const remaining = expiresAt - currentTime;

    if (remaining <= 0) return 'Expired';
    if (remaining < 60) return `< 1 min`;
    if (remaining < 3600) return `${Math.floor(remaining / 60)} min`;
    return null; // > 1 hour, don't show countdown
  };

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isExpiringSoon = (timestamp: number): boolean => {
    const expiresAt = timestamp + 3600;
    const remaining = expiresAt - currentTime;
    return remaining > 0 && remaining < 600; // < 10 minutes remaining
  };

  const isExpired = (timestamp: number): boolean => {
    const expiresAt = timestamp + 3600;
    return currentTime >= expiresAt;
  };

  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      background: '#f9f9f9',
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Open Games</h3>

      {loading && games.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          No open games — create one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {games.map((game) => {
            const isOwnGame = currentPlayer === game.player1;
            const gameExpired = isExpired(Number(game.created_at));
            const gameExpiringSoon = isExpiringSoon(Number(game.created_at));
            const timeRemaining = formatTimeRemaining(Number(game.created_at));

            return (
              <div
                key={game.id}
                style={{
                  padding: '1rem',
                  background: '#fff',
                  border: gameExpired
                    ? '1px solid #ccc'
                    : gameExpiringSoon
                    ? '1px solid #fcc'
                    : '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: gameExpired ? 0.6 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    color: isOwnGame ? '#28a745' : '#333',
                    fontWeight: isOwnGame ? 'bold' : 'normal',
                  }}>
                    {shortenAddress(game.player1)}
                    {isOwnGame && ' (You)'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    Game #{game.id} • {formatTimeSince(Number(game.created_at))}
                    {timeRemaining && (
                      <span style={{
                        color: gameExpired ? '#999' : gameExpiringSoon ? '#c00' : '#666',
                        marginLeft: '0.5rem',
                        fontWeight: gameExpiringSoon ? 'bold' : 'normal',
                      }}>
                        {gameExpired ? '⏱️' : '⏰'} Expires in {timeRemaining}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleJoinGame(game.id)}
                  disabled={gameExpired || isOwnGame || !wallet.isConnected || joiningGameId !== null}
                  style={{
                    padding: '0.5rem 1rem',
                    background: gameExpired || isOwnGame || !wallet.isConnected ? '#ccc' : '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: gameExpired || isOwnGame || !wallet.isConnected || joiningGameId !== null
                      ? 'not-allowed'
                      : 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {joiningGameId === game.id
                    ? 'Joining...'
                    : gameExpired
                    ? 'Expired'
                    : isOwnGame
                    ? 'Your game'
                    : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
