import { useState, useEffect, useCallback } from 'react';
import { useWalletStandalone } from '@/hooks/useWalletStandalone';
import { ZknightService } from '../zknightService';
import { networks } from '../bindings';
import type { Game, Puzzle } from '../bindings';
import { CreateGamePanel } from './CreateGamePanel';
import { OpenGamesList } from './OpenGamesList';
import { JoinGamePanel } from './JoinGamePanel';

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

  // Poll open games every 10 seconds
  useEffect(() => {
    let cancelled = false;

    const fetchOpenGames = async () => {
      if (!cancelled) {
        setLoadingGames(true);
        try {
          const games = await service.getOpenGames();
          if (!cancelled) {
            setOpenGames(games);
          }
        } catch (err) {
          console.error('[LobbyView] Error fetching open games:', err);
        } finally {
          if (!cancelled) {
            setLoadingGames(false);
          }
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
    onGameStart(game, true); // isPlayer1 = true
  }, [onGameStart]);

  const handleJoinSuccess = useCallback(async (gameId: number) => {
    try {
      const game = await service.getGame(gameId);
      if (game) {
        onGameStart(game, false); // isPlayer1 = false
      }
    } catch (err) {
      console.error('[LobbyView] Error fetching game after join:', err);
      setError('Failed to load game data');
    }
  }, [onGameStart, service]);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'var(--font-body)',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>ZKnight</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
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
                padding: '0.5rem 1rem',
                background: '#666',
                color: '#fff',
                border: '1px solid #444',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
            >
              Dev Editors
            </button>
          )}

          {/* Wallet Connection */}
          {wallet.isWalletAvailable ? (
            wallet.isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  fontFamily: 'monospace',
                }}>
                  {wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-4)}
                </span>
                <button
                  onClick={wallet.disconnect}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f5f5f5',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    borderRadius: '4px',
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
                  padding: '0.5rem 1.5rem',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  cursor: wallet.isConnecting ? 'not-allowed' : 'pointer',
                  opacity: wallet.isConnecting ? 0.6 : 1,
                  borderRadius: '4px',
                }}
              >
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )
          ) : (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '0.9rem' }}>
                Wallet not detected
              </p>
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: '#007bff' }}
              >
                Install Freighter
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          color: '#c00',
        }}>
          {error}
        </div>
      )}

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
  );
}
