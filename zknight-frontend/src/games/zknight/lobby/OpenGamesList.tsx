import { useState, useCallback, useEffect } from 'react';
import type { Game } from '../bindings';
import type { ZknightService } from '../zknightService';
import { retryWithBackoff, shortenAddress, formatTimeSince, formatTimeRemaining, isExpiringSoon, isExpired } from './utils';

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
    <div style={{
      padding: '2rem',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(46, 110, 130, 0.1)',
    }}>
      <h3 style={{
        margin: '0 0 1.5rem 0',
        fontSize: '1.4rem',
        color: '#2e6e82',
        fontWeight: '600',
      }}>
        Open Games
      </h3>

      {loading && games.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#999',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2e6e82',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading games...</p>
        </div>
      ) : games.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#999',
          background: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <p style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: '500',
          }}>
            No open games
          </p>
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.9rem',
            color: '#aaa',
          }}>
            Create one to start playing!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '0.25rem',
        }}>
          {games.map((game) => {
            const isOwnGame = currentPlayer === game.player1;
            const gameExpired = isExpired(Number(game.created_at), currentTime);
            const gameExpiringSoon = isExpiringSoon(Number(game.created_at), currentTime);
            const timeRemaining = formatTimeRemaining(Number(game.created_at), currentTime);

            return (
              <div
                key={game.id}
                style={{
                  padding: '1.25rem',
                  background: gameExpired
                    ? '#f5f5f5'
                    : gameExpiringSoon
                    ? '#fff3cd'
                    : isOwnGame
                    ? 'linear-gradient(135deg, #e8f5f7 0%, #d4ebf0 100%)'
                    : '#fff',
                  border: gameExpired
                    ? '2px solid #ddd'
                    : gameExpiringSoon
                    ? '2px solid #ffc107'
                    : isOwnGame
                    ? '2px solid #b8dce2'
                    : '2px solid #e9ecef',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: gameExpired ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!gameExpired) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1rem',
                    fontFamily: 'monospace',
                    color: isOwnGame ? '#1a5166' : '#333',
                    fontWeight: isOwnGame ? 'bold' : '600',
                    marginBottom: '0.5rem',
                  }}>
                    {shortenAddress(game.player1)}
                    {isOwnGame && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        background: '#2e6e82',
                        color: '#fff',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        You
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      color: '#999',
                      fontWeight: '500',
                    }}>
                      #{game.id}
                    </span>
                    <span>•</span>
                    <span>{formatTimeSince(Number(game.created_at), currentTime)}</span>
                    {timeRemaining && (
                      <>
                        <span>•</span>
                        <span style={{
                          color: gameExpired ? '#999' : gameExpiringSoon ? '#856404' : '#666',
                          fontWeight: gameExpiringSoon ? 'bold' : 'normal',
                        }}>
                          {gameExpired ? '⏱️ Expired' : `⏰ ${timeRemaining} left`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleJoinGame(game.id)}
                  disabled={gameExpired || isOwnGame || !wallet.isConnected || joiningGameId !== null}
                  style={{
                    padding: '0.625rem 1.5rem',
                    background: gameExpired || isOwnGame || !wallet.isConnected
                      ? '#e9ecef'
                      : joiningGameId === game.id
                      ? '#6c99aa'
                      : '#2e6e82',
                    color: gameExpired || isOwnGame || !wallet.isConnected ? '#999' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: gameExpired || isOwnGame || !wallet.isConnected || joiningGameId !== null
                      ? 'not-allowed'
                      : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: (!gameExpired && !isOwnGame && wallet.isConnected)
                      ? '0 2px 6px rgba(46, 110, 130, 0.2)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!gameExpired && !isOwnGame && wallet.isConnected && joiningGameId === null) {
                      e.currentTarget.style.background = '#255a6d';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(46, 110, 130, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!gameExpired && !isOwnGame && wallet.isConnected && joiningGameId === null) {
                      e.currentTarget.style.background = '#2e6e82';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(46, 110, 130, 0.2)';
                    }
                  }}
                >
                  {joiningGameId === game.id
                    ? '⏳ Joining...'
                    : gameExpired
                    ? '⏱️ Expired'
                    : isOwnGame
                    ? '👤 Your game'
                    : '➜ Join'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Custom scrollbar styling */
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #b8dce2;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #2e6e82;
        }
      `}</style>
    </div>
  );
}
