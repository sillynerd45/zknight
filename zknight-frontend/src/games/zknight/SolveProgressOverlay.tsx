import { useOnChainGameContext } from './OnChainGameContext';
import { useAnimatedSprite } from '@/hooks/useAnimatedSprite';
import { SPRITE_MAP } from '@/sprites/spriteMap';
import { shortenAddress, formatTimestamp } from './lobby/utils';
import styles from './lobby/lobbyStyles.module.css';

// ── Time Formatter ─────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

// ── Step Status ─────────────────────────────────────────

type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface StepStatuses {
  commit: StepStatus;
  prove: StepStatus;
  submit: StepStatus;
  wait: StepStatus;
}

function getErrorStep(
  error: string | null,
  hasCommitted: boolean,
  proof: Uint8Array | null,
  hasRevealed: boolean,
): 'commit' | 'prove' | 'submit' | null {
  if (!error) return null;
  if (!hasCommitted) return 'commit';
  if (proof === null) return 'prove';
  if (!hasRevealed) return 'submit';
  return null;
}

function computeStepStatuses(
  hasCommitted: boolean,
  proof: Uint8Array | null,
  hasRevealed: boolean,
  gameFinished: boolean,
  error: string | null,
): StepStatuses {
  const errorStep = getErrorStep(error, hasCommitted, proof, hasRevealed);

  const commit: StepStatus =
    errorStep === 'commit' ? 'error' :
    hasCommitted ? 'done' :
    'active';

  const prove: StepStatus =
    !hasCommitted ? 'pending' :
    errorStep === 'prove' ? 'error' :
    (hasRevealed || proof !== null) ? 'done' :
    'active';

  const submit: StepStatus =
    !hasCommitted ? 'pending' :
    errorStep === 'submit' ? 'error' :
    hasRevealed ? 'done' :
    proof !== null ? 'active' :
    'pending';

  const wait: StepStatus =
    !hasRevealed ? 'pending' :
    gameFinished ? 'done' :
    'active';

  return { commit, prove, submit, wait };
}

// ── Animated Sheep ─────────────────────────────────────

function AnimatedSheep() {
  const sheet = SPRITE_MAP['sheep'];
  const anim = sheet.animations['idle'];
  const frameIndex = useAnimatedSprite(anim, { active: true });

  const bgX = -(anim.startCol + frameIndex) * sheet.frameWidth;
  const bgY = -anim.row * sheet.frameHeight;

  return (
    <div
      className={styles.sheepWrapper}
      style={{
        width: sheet.frameWidth,
        height: sheet.frameHeight,
        backgroundImage: `url('${sheet.src}')`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${sheet.cols * sheet.frameWidth}px ${sheet.rows * sheet.frameHeight}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

// ── Step Icon ───────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'pending') return <div className={styles.solveStepIconPending}>○</div>;
  if (status === 'active')  return <div className={styles.solveStepIconActive}><div className={styles.solveStepSpinner} /></div>;
  if (status === 'done')    return <div className={styles.solveStepIconDone}>✓</div>;
  return                           <div className={styles.solveStepIconError}>✗</div>;
}

function labelClass(status: StepStatus): string {
  switch (status) {
    case 'pending': return styles.solveStepLabelPending;
    case 'active':  return styles.solveStepLabelActive;
    case 'done':    return styles.solveStepLabelDone;
    case 'error':   return styles.solveStepLabelError;
  }
}

// ── Result Phase ────────────────────────────────────────

function ResultView({ currentPlayer, onBack }: { currentPlayer: string; onBack: () => void }) {
  const { winner, game } = useOnChainGameContext();
  if (!game) return null;

  const player1 = game.player1;
  const player2 = game.player2 ?? '';
  const p1Ticks = game.p1_tick_count !== undefined ? Number(game.p1_tick_count) : null;
  const p2Ticks = game.p2_tick_count !== undefined ? Number(game.p2_tick_count) : null;
  const p1CommitTime = game.p1_commit_time !== undefined ? Number(game.p1_commit_time) : null;
  const p2CommitTime = game.p2_commit_time !== undefined ? Number(game.p2_commit_time) : null;

  const isWinner = winner === currentPlayer;
  const isDraw = !winner;

  const headerBg = isDraw ? '#6c757d' : isWinner ? '#28a745' : '#D95763';
  const titleText = isDraw ? 'DRAW!' : isWinner ? 'VICTORY!' : 'DEFEATED';
  const subText = isDraw
    ? 'Both players tied'
    : isWinner
    ? 'You solved the puzzle first!'
    : 'Your opponent was faster';

  return (
    <>
      {/* Result header — replaces progress header */}
      <div
        className={styles.solveCardHeader}
        style={{ background: headerBg, borderBottomColor: '#1a1a1a', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
      >
        <h2 className={styles.solveCardTitle}>{titleText}</h2>
        <p style={{ margin: 0, fontFamily: "'VT323', monospace", fontSize: '1.2rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '1px' }}>
          {subText}
        </p>
      </div>

      {/* Player stats */}
      <div style={{ padding: '1.25rem 1.75rem 0' }}>
        <div className={styles.statsContainer}>
          <div className={winner === player1 ? styles.playerCardWinner : styles.playerCard}>
            <div className={styles.playerHeader}>
              <span className={styles.tag}>P1</span>
              <span className={styles.playerAddress}>{shortenAddress(player1)}</span>
              {winner === player1 && <span style={{ color: '#28a745' }}>WINNER</span>}
            </div>
            <div className={styles.playerStats}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Ticks:</span>
                <span className={styles.statValue}>{p1Ticks ?? 'N/A'}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Committed:</span>
                <span className={styles.statValue}>{formatTimestamp(p1CommitTime)}</span>
              </div>
            </div>
          </div>

          <div className={winner === player2 ? styles.playerCardWinner : styles.playerCard}>
            <div className={styles.playerHeader}>
              <span className={styles.tagP2}>P2</span>
              <span className={styles.playerAddress}>{shortenAddress(player2)}</span>
              {winner === player2 && <span style={{ color: '#28a745' }}>WINNER</span>}
            </div>
            <div className={styles.playerStats}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Ticks:</span>
                <span className={styles.statValue}>{p2Ticks ?? 'N/A'}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Committed:</span>
                <span className={styles.statValue}>{formatTimestamp(p2CommitTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.resultActions} style={{ padding: '1rem 1.75rem 1.25rem' }}>
        <button className={styles.btnGhost} onClick={onBack}>BACK TO LOBBY</button>
        <button className={styles.btnAccent} onClick={onBack}>PLAY AGAIN</button>
      </div>
    </>
  );
}

// ── Props ───────────────────────────────────────────────

interface SolveProgressOverlayProps {
  turnCount: number;
  elapsed: number;
  currentPlayer: string;
  onRetry: () => void;
  onBack: () => void;
}

// ── Main Component ──────────────────────────────────────

export function SolveProgressOverlay({
  turnCount,
  elapsed,
  currentPlayer,
  onRetry,
  onBack,
}: SolveProgressOverlayProps) {
  const ctx = useOnChainGameContext();
  const {
    hasCommitted,
    proof,
    hasRevealed,
    gameFinished,
    error,
    proofProgress,
  } = ctx;

  const steps = computeStepStatuses(hasCommitted, proof, hasRevealed, gameFinished, error);
  const isWaiting = steps.wait === 'active';
  const hasAnyError = error !== null;

  return (
    <div className={styles.solveOverlay}>
      <div className={styles.solveCard}>

        {gameFinished ? (
          // ── Result phase ──────────────────────────────
          <ResultView currentPlayer={currentPlayer} onBack={onBack} />
        ) : (
          // ── Progress phase ────────────────────────────
          <>
            {/* Header */}
            <div className={styles.solveCardHeader}>
              <h2 className={styles.solveCardTitle}>PUZZLE SOLVED!</h2>
              <div className={styles.solveCardStats}>
                <div className={styles.solveStat}>
                  <span className={styles.solveStatLabel}>MOVES</span>
                  <span className={styles.solveStatValue}>{turnCount}</span>
                </div>
                <div className={styles.solveStat}>
                  <span className={styles.solveStatLabel}>TIME</span>
                  <span className={styles.solveStatValue}>{formatTime(elapsed)}</span>
                </div>
              </div>
            </div>

            {/* Step list */}
            <div className={styles.solveStepList}>

              {/* Step 1: Commit */}
              <div className={styles.solveStep}>
                <StepIcon status={steps.commit} />
                <div className={styles.solveStepBody}>
                  <p className={labelClass(steps.commit)}>1. COMMIT TO CHAIN</p>
                  {steps.commit === 'error' && error && (
                    <>
                      <p className={styles.solveStepErrorMsg}>⚠ {error}</p>
                      <button className={styles.btnDanger} style={{ marginTop: '0.5rem' }} onClick={onRetry}>RETRY</button>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: Generate ZK Proof */}
              <div className={styles.solveStep}>
                <StepIcon status={steps.prove} />
                <div className={styles.solveStepBody}>
                  <p className={labelClass(steps.prove)}>2. GENERATE ZK PROOF</p>
                  {steps.prove === 'active' && (
                    <p className={styles.solveStepDetail}>
                      {proofProgress || 'Preparing circuit...'}&nbsp;— This may take 5–15 seconds
                    </p>
                  )}
                  {steps.prove === 'error' && error && (
                    <>
                      <p className={styles.solveStepErrorMsg}>⚠ {error}</p>
                      <button className={styles.btnDanger} style={{ marginTop: '0.5rem' }} onClick={onRetry}>RETRY</button>
                    </>
                  )}
                </div>
              </div>

              {/* Step 3: Submit Proof */}
              <div className={styles.solveStep}>
                <StepIcon status={steps.submit} />
                <div className={styles.solveStepBody}>
                  <p className={labelClass(steps.submit)}>3. SUBMIT PROOF</p>
                  {steps.submit === 'active' && (
                    <p className={styles.solveStepDetail}>Submitting proof to contract...</p>
                  )}
                  {steps.submit === 'error' && error && (
                    <>
                      <p className={styles.solveStepErrorMsg}>⚠ {error}</p>
                      <button className={styles.btnDanger} style={{ marginTop: '0.5rem' }} onClick={onRetry}>RETRY</button>
                    </>
                  )}
                </div>
              </div>

              {/* Step 4: Wait for Opponent */}
              <div className={styles.solveStep}>
                <StepIcon status={steps.wait} />
                <div className={styles.solveStepBody}>
                  <p className={labelClass(steps.wait)}>4. WAITING FOR OPPONENT</p>
                  {isWaiting && (
                    <div className={styles.solveWaitingContent}>
                      <AnimatedSheep />
                      <p className={styles.solveWaitingText}>
                        <span className={styles.waitingDot} />
                        Waiting for opponent to solve...
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer: Back to Lobby (waiting step or error) */}
            {(isWaiting || hasAnyError) && (
              <div className={styles.solveCardFooter}>
                <button className={styles.btnGhost} onClick={onBack}>BACK TO LOBBY</button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
