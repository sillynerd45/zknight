import { useState, useCallback } from 'react';
import type { ZknightService } from '../zknightService';

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

      // Join the game (service will simulate first and handle expiry if needed)
      console.log('[JoinGamePanel] Joining game:', gameId);
      await service.joinGame(gameId, wallet.publicKey, signer);

      console.log('[JoinGamePanel] Successfully joined game:', gameId);
      onJoinSuccess(gameId);
      setGameIdInput(''); // Clear input on success
    } catch (err: any) {
      console.error('[JoinGamePanel] Error joining game:', err);
      onError(err.message || 'Failed to join game');
    } finally {
      setJoining(false);
    }
  }, [gameIdInput, wallet, service, onJoinSuccess, onError]);

  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      background: '#f9f9f9',
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Join by Game ID</h3>

      <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
        Enter a game ID to join directly
      </p>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="number"
          value={gameIdInput}
          onChange={(e) => setGameIdInput(e.target.value)}
          placeholder="Enter game ID"
          disabled={joining}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !joining) {
              handleJoinById();
            }
          }}
        />
        <button
          onClick={handleJoinById}
          disabled={!wallet.isConnected || joining || !gameIdInput}
          style={{
            padding: '0.75rem 1.5rem',
            background: wallet.isConnected && gameIdInput ? '#007bff' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: wallet.isConnected && gameIdInput && !joining ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            whiteSpace: 'nowrap',
          }}
        >
          {joining ? 'Joining...' : 'Join'}
        </button>
      </div>

      {!wallet.isConnected && (
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.85rem',
          color: '#999',
        }}>
          Connect your wallet to join a game
        </p>
      )}
    </div>
  );
}
