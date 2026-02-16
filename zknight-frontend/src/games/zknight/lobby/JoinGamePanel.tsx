import { useState, useCallback } from 'react';
import type { ZknightService } from '../zknightService';
import { retryWithBackoff } from './utils';

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
        Join by Game ID
      </h3>

      <p style={{ color: '#666', fontSize: '0.95rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
        Enter a game ID to join directly
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="number"
          value={gameIdInput}
          onChange={(e) => setGameIdInput(e.target.value)}
          placeholder="Enter game ID"
          disabled={joining}
          style={{
            flex: 1,
            padding: '0.875rem 1rem',
            border: '2px solid #b8dce2',
            borderRadius: '8px',
            fontSize: '1rem',
            fontFamily: 'monospace',
            fontWeight: '600',
            color: '#1a5166',
            background: '#f8fcfd',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#2e6e82';
            e.currentTarget.style.background = '#fff';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#b8dce2';
            e.currentTarget.style.background = '#f8fcfd';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !joining && gameIdInput) {
              handleJoinById();
            }
          }}
        />
        <button
          onClick={handleJoinById}
          disabled={!wallet.isConnected || joining || !gameIdInput}
          style={{
            padding: '0.875rem 1.75rem',
            background: wallet.isConnected && gameIdInput ? (joining ? '#6c99aa' : '#2e6e82') : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: wallet.isConnected && gameIdInput && !joining ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: wallet.isConnected && gameIdInput ? '0 2px 8px rgba(46, 110, 130, 0.3)' : 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (wallet.isConnected && gameIdInput && !joining) {
              e.currentTarget.style.background = '#255a6d';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 110, 130, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (wallet.isConnected && gameIdInput && !joining) {
              e.currentTarget.style.background = '#2e6e82';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 110, 130, 0.3)';
            }
          }}
        >
          {joining ? '⏳ Joining...' : '➜ Join'}
        </button>
      </div>

      {!wallet.isConnected && (
        <p style={{
          margin: '0.75rem 0 0 0',
          fontSize: '0.85rem',
          color: '#999',
          textAlign: 'center',
        }}>
          Connect your wallet to join a game
        </p>
      )}
    </div>
  );
}
