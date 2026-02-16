import { useState, useEffect, useCallback } from 'react';
import { useWalletStandalone } from '@/hooks/useWalletStandalone';
import { ZknightService } from '../zknightService';
import { networks } from '../bindings';
import type { Game } from '../bindings';
import { CreateGamePanel } from './CreateGamePanel';
import { OpenGamesList } from './OpenGamesList';
import { JoinGamePanel } from './JoinGamePanel';
import { Toast } from '@/components/Toast';
import { retryWithBackoff } from './utils';

interface LobbyViewProps {
  onGameStart: (game: Game, isPlayer1: boolean) => void;
  onOpenEditor?: () => void;
}

export function LobbyView({ onGameStart, onOpenEditor }: LobbyViewProps) {
  const wallet = useWalletStandalone();
  const [service] = useState(() => new ZknightService(networks.testnet.contractId));
  const [openGames, setOpenGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Poll open games every 10 seconds with exponential backoff on failure
  useEffect(() => {
    let cancelled = false;
    let consecutiveFailures = 0;

    const fetchOpenGames = async () => {
      if (cancelled) return;

      setLoadingGames(true);
      try {
        const games = await retryWithBackoff(() => service.getOpenGames(), 2, 500, 5000);

        if (!cancelled) {
          setOpenGames(games);
          setIsReconnecting(false);
          consecutiveFailures = 0;
        }
      } catch (err) {
        console.error('[LobbyView] Error fetching open games:', err);
        consecutiveFailures++;

        if (!cancelled && consecutiveFailures >= 3) {
          setIsReconnecting(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingGames(false);
        }
      }
    };

    // Initial fetch
    fetchOpenGames();

    // Poll every 10 seconds
    const interval = setInterval(fetchOpenGames, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [service]);

  // Check if current player has an active game
  useEffect(() => {
    let cancelled = false;

    const checkActiveGame = async () => {
      if (!wallet.publicKey) {
        setActiveGameId(null);
        return;
      }

      try {
        const gameId = await service.getPlayerActiveGame(wallet.publicKey);
        if (!cancelled) {
          setActiveGameId(gameId);
        }
      } catch (err) {
        console.error('[LobbyView] Error checking active game:', err);
      }
    };

    checkActiveGame();

    return () => {
      cancelled = true;
    };
  }, [wallet.publicKey, service]);

  const handleGameCreated = useCallback((gameId: number) => {
    setActiveGameId(gameId);
    setError(null);
  }, []);

  const handleGameCancelled = useCallback(() => {
    setActiveGameId(null);
    setError(null);
  }, []);

  const handlePlayer1GameStart = useCallback((game: Game) => {
    onGameStart(game, true);
  }, [onGameStart]);

  const handleJoinSuccess = useCallback(async (gameId: number) => {
    try {
      const game = await service.getGame(gameId);
      if (game) {
        onGameStart(game, false);
      }
    } catch (err) {
      console.error('[LobbyView] Error fetching game after join:', err);
      setError('Failed to load game data');
    }
  }, [onGameStart, service]);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #4a90a4 0%, #3a7084 100%)',
      padding: '2rem',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '2.5rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #2e6e82 0%, #4a90a4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}>
                ⚔️ ZKnight
              </h1>
              <p style={{ margin: '0.75rem 0 0 0', color: '#555', fontSize: '1.05rem' }}>
                Competitive puzzle racing with zero-knowledge proofs
              </p>
            </div>

            {/* Wallet Connection + Dev Editors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Dev Editors Button (DEV ONLY) */}
              {import.meta.env.DEV && onOpenEditor && (
                <button
                  onClick={onOpenEditor}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#5a6268';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#6c757d';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Dev Editors
                </button>
              )}

              {/* Wallet Connection */}
              {wallet.isWalletAvailable ? (
                wallet.isConnected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: '#e8f5f7',
                      borderRadius: '6px',
                      border: '1px solid #b8dce2',
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        color: '#2e6e82',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                      }}>
                        {wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={wallet.disconnect}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        color: '#495057',
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e9ecef';
                        e.currentTarget.style.borderColor = '#ced4da';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#dee2e6';
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                    style={{
                      padding: '0.75rem 2rem',
                      background: wallet.isConnecting ? '#6c99aa' : '#2e6e82',
                      color: '#fff',
                      border: 'none',
                      cursor: wallet.isConnecting ? 'not-allowed' : 'pointer',
                      opacity: wallet.isConnecting ? 0.7 : 1,
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!wallet.isConnecting) {
                        e.currentTarget.style.background = '#255a6d';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#2e6e82';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                    }}
                  >
                    {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )
              ) : (
                <div style={{
                  textAlign: 'right',
                  padding: '0.75rem 1rem',
                  background: '#fff3cd',
                  borderRadius: '6px',
                  border: '1px solid #ffc107',
                }}>
                  <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem', fontWeight: '500' }}>
                    Wallet not detected
                  </p>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.85rem',
                      color: '#2e6e82',
                      textDecoration: 'underline',
                      fontWeight: '500',
                    }}
                  >
                    Install Freighter
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Reconnecting Indicator */}
          {isReconnecting && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ffc107',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ color: '#856404', fontSize: '0.9rem' }}>
                Reconnecting to network...
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
        }}>
          {/* Left Column: Create Game */}
          <div>
            <CreateGamePanel
              service={service}
              wallet={wallet}
              activeGameId={activeGameId}
              onGameCreated={handleGameCreated}
              onGameCancelled={handleGameCancelled}
              onGameStart={handlePlayer1GameStart}
              onError={handleError}
            />
          </div>

          {/* Right Column: Join Game */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <JoinGamePanel
              service={service}
              wallet={wallet}
              onJoinSuccess={handleJoinSuccess}
              onError={handleError}
            />

            <OpenGamesList
              games={openGames}
              loading={loadingGames}
              currentPlayer={wallet.publicKey}
              service={service}
              wallet={wallet}
              onJoinSuccess={handleJoinSuccess}
              onError={handleError}
            />
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && <Toast message={error} onDismiss={clearError} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
