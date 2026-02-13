import { useEffect, useRef } from 'react';
import { useGameContext } from '@/context/GameContext';

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-overlay-bg)',
  fontFamily: 'monospace',
  color: '#fff',
  pointerEvents: 'auto',
};

const buttonStyle: React.CSSProperties = {
  marginTop: 24,
  padding: '8px 24px',
  fontSize: 16,
  fontFamily: 'monospace',
  background: '#fff',
  color: '#000',
  border: 'none',
  cursor: 'pointer',
};

// ── Win Overlay ──────────────────────────────────────────

interface WinOverlayProps {
  turnCount: number;
  elapsed: number;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function WinOverlay({ turnCount, elapsed }: WinOverlayProps) {
  const { dispatch } = useGameContext();

  return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 32, fontWeight: 'bold' }}>Puzzle Solved!</div>
      <div style={{ marginTop: 12, fontSize: 18 }}>
        Time: {formatTime(elapsed)}
      </div>
      <div style={{ fontSize: 18 }}>
        Moves: {turnCount}
      </div>
      <button style={buttonStyle} onClick={() => dispatch({ type: 'RESET' })}>
        Play Again
      </button>
    </div>
  );
}

// ── Explosion Overlay ────────────────────────────────────

interface ExplosionOverlayProps {
  onReset: () => void;
}

export function ExplosionOverlay({ onReset }: ExplosionOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(onReset, 1500);
    return () => clearTimeout(timerRef.current);
  }, [onReset]);

  return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-explosion)' }}>
        BOOM!
      </div>
      <button style={buttonStyle} onClick={onReset}>
        Try Again
      </button>
    </div>
  );
}

// ── Cycle Notice ─────────────────────────────────────────

interface CycleNoticeProps {
  visible: boolean;
}

export function CycleNotice({ visible }: CycleNoticeProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#fff',
        background: 'rgba(0, 0, 0, 0.6)',
        padding: '4px 16px',
        borderRadius: 4,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      Loop removed
    </div>
  );
}
