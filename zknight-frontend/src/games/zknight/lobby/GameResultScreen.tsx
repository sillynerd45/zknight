import { shortenAddress, formatTimestamp } from './utils';
import styles from './lobbyStyles.module.css';

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

  const titleClass = isDraw
    ? styles.resultTitleDraw
    : isWinner
    ? styles.resultTitleWin
    : styles.resultTitleLose;

  return (
    <div className={styles.resultOverlay}>
      <div className={styles.resultCard}>
        {/* Result Header */}
        <div className={styles.resultHeader}>
          <div className={styles.resultEmoji}>
            {isDraw ? '=' : isWinner ? '*' : 'X'}
          </div>
          <h2 className={titleClass}>
            {isDraw ? 'DRAW!' : isWinner ? 'VICTORY!' : 'DEFEATED'}
          </h2>
          <p className={styles.resultSubtext}>
            {isDraw
              ? 'Both players tied'
              : isWinner
              ? 'You solved the puzzle first!'
              : 'Your opponent was faster'}
          </p>
        </div>

        {/* Player Stats */}
        <div className={styles.statsContainer}>
          {/* Player 1 */}
          <div className={winner === player1 ? styles.playerCardWinner : styles.playerCard}>
            <div className={styles.playerHeader}>
              <span className={styles.tag}>P1</span>
              <span className={styles.playerAddress}>{shortenAddress(player1)}</span>
              {winner === player1 && <span>WINNER</span>}
            </div>
            <div className={styles.playerStats}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Ticks:</span>
                <span className={styles.statValue}>{player1TickCount ?? 'N/A'}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Committed:</span>
                <span className={styles.statValue}>{formatTimestamp(player1CommitTime)}</span>
              </div>
            </div>
          </div>

          {/* Player 2 */}
          <div className={winner === player2 ? styles.playerCardWinner : styles.playerCard}>
            <div className={styles.playerHeader}>
              <span className={styles.tagP2}>P2</span>
              <span className={styles.playerAddress}>{shortenAddress(player2)}</span>
              {winner === player2 && <span>WINNER</span>}
            </div>
            <div className={styles.playerStats}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Ticks:</span>
                <span className={styles.statValue}>{player2TickCount ?? 'N/A'}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Committed:</span>
                <span className={styles.statValue}>{formatTimestamp(player2CommitTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.resultActions}>
          <button className={styles.btnGhost} onClick={onBackToLobby}>
            BACK TO LOBBY
          </button>
          <button className={styles.btnAccent} onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
