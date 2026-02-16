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

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
      }}>
        {/* Result Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '2rem',
            color: isDraw ? '#666' : isWinner ? '#28a745' : '#dc3545',
          }}>
            {isDraw ? 'Draw!' : isWinner ? 'You Win! 🎉' : 'You Lose'}
          </h2>
          <p style={{ margin: 0, color: '#666' }}>
            Game finished
          </p>
        </div>

        {/* Player Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: '#f9f9f9',
          borderRadius: '4px',
        }}>
          {/* Player 1 */}
          <div>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: winner === player1 ? '#28a745' : '#333',
            }}>
              Player 1: {shortenAddress(player1)}
              {winner === player1 && ' 👑'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Ticks: {player1TickCount ?? 'N/A'}
              <br />
              Committed: {formatTimestamp(player1CommitTime)}
            </div>
          </div>

          {/* Player 2 */}
          <div>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: winner === player2 ? '#28a745' : '#333',
            }}>
              Player 2: {shortenAddress(player2)}
              {winner === player2 && ' 👑'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Ticks: {player2TickCount ?? 'N/A'}
              <br />
              Committed: {formatTimestamp(player2CommitTime)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onBackToLobby}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Back to Lobby
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
