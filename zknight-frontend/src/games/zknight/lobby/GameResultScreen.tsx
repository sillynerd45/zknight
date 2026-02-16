import { shortenAddress, formatTimestamp } from './utils';

interface GameResultScreenProps {
  winner: string | null;
  player1: string;
  player2: string;
  player1TickCount: number | null;
  player2TickCount: number | null;
  player1CommitTime: number | null;
  player2CommitTime: number | null;
  currentPlayer: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function GameResultScreen({
  winner,
  player1,
  player2,
  player1TickCount,
  player2TickCount,
  player1CommitTime,
  player2CommitTime,
  currentPlayer,
  onPlayAgain,
  onBackToLobby,
}: GameResultScreenProps) {
  const isWinner = winner === currentPlayer;
  const isDraw = !winner;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '2.5rem',
        maxWidth: '600px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideIn 0.3s ease-out',
      }}>
        {/* Result Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            animation: 'bounce 0.6s ease-out',
          }}>
            {isDraw ? '🤝' : isWinner ? '🏆' : '🎯'}
          </div>
          <h2 style={{
            margin: '0 0 0.75rem 0',
            fontSize: '2.5rem',
            color: isDraw ? '#6c757d' : isWinner ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
          }}>
            {isDraw ? 'Draw!' : isWinner ? 'Victory!' : 'Defeated'}
          </h2>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '1.05rem',
          }}>
            {isDraw
              ? 'Both players tied'
              : isWinner
              ? 'You solved the puzzle first!'
              : 'Your opponent was faster'}
          </p>
        </div>

        {/* Player Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2.5rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '12px',
          border: '2px solid #dee2e6',
        }}>
          {/* Player 1 */}
          <div style={{
            padding: '1rem',
            background: winner === player1 ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : '#fff',
            borderRadius: '8px',
            border: winner === player1 ? '2px solid #28a745' : '2px solid #e9ecef',
          }}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: winner === player1 ? '#155724' : '#333',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                padding: '0.25rem 0.625rem',
                background: '#2e6e82',
                color: '#fff',
                fontSize: '0.75rem',
                borderRadius: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                P1
              </span>
              <span style={{ fontFamily: 'monospace' }}>
                {shortenAddress(player1)}
              </span>
              {winner === player1 && <span>👑</span>}
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#555',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>Ticks:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                  {player1TickCount ?? 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>Committed:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {formatTimestamp(player1CommitTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div style={{
            padding: '1rem',
            background: winner === player2 ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : '#fff',
            borderRadius: '8px',
            border: winner === player2 ? '2px solid #28a745' : '2px solid #e9ecef',
          }}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: winner === player2 ? '#155724' : '#333',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{
                padding: '0.25rem 0.625rem',
                background: '#6c757d',
                color: '#fff',
                fontSize: '0.75rem',
                borderRadius: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                P2
              </span>
              <span style={{ fontFamily: 'monospace' }}>
                {shortenAddress(player2)}
              </span>
              {winner === player2 && <span>👑</span>}
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#555',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>Ticks:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                  {player2TickCount ?? 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>Committed:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {formatTimestamp(player2CommitTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onBackToLobby}
            style={{
              flex: 1,
              padding: '1rem',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.05rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a6268';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6c757d';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            }}
          >
            Back to Lobby
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 1,
              padding: '1rem',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.05rem',
              fontWeight: '700',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#218838';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#28a745';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
            }}
          >
            🎮 Play Again
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
