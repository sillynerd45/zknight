import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/context/GameContext';

const TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutes = 300,000ms

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function GameHUD() {
  const { state, dispatch } = useGameContext();
  const { startTime, gameStatus, turnCount } = state;
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const rafRef = useRef<number>(0);
  // ref prevents double-dispatch across RAF frames before React re-renders
  const timedOutRef = useRef(false);

  useEffect(() => {
    if (!startTime || gameStatus !== 'playing') return;
    const tick = () => {
      const newElapsed = Date.now() - startTime;
      setElapsed(newElapsed);
      if (newElapsed >= TIME_LIMIT_MS && !timedOutRef.current) {
        timedOutRef.current = true;
        setTimedOut(true);
        dispatch({ type: 'RESET' });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startTime, gameStatus, dispatch]);

  // Freeze display when game stops (explosion, win, or timeout reset)
  useEffect(() => {
    if (gameStatus !== 'playing' && startTime) {
      setElapsed(Date.now() - startTime);
    }
  }, [gameStatus, startTime]);

  const handleRetry = () => {
    timedOutRef.current = false;
    setTimedOut(false);
    dispatch({ type: 'START' });
  };

  // Timer color: warn at 4:00, critical at 4:30
  let timerColor = '#F4E8C1';
  let timerPulse = false;
  if (elapsed >= 270_000) {
    timerColor = '#D95763';
    timerPulse = true;
  } else if (elapsed >= 240_000) {
    timerColor = '#F2D06B';
  }

  // Moves color (existing behaviour)
  let movesColor = '#F4E8C1';
  let movesPulse = false;
  if (turnCount > 460) {
    movesColor = '#D95763';
    movesPulse = true;
  } else if (turnCount > 400) {
    movesColor = '#F2D06B';
  }

  // Cap display at 5:00.00 so it never shows beyond the limit
  const displayElapsed = Math.min(elapsed, TIME_LIMIT_MS);

  return (
    <>
      <style>{`@keyframes hudPulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>

      {/* TIME'S UP overlay — covers full game area, blocks all input */}
      {timedOut && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 25, 35, 0.88)',
            fontFamily: "'VT323', monospace",
            pointerEvents: 'auto',
          }}
        >
          <div style={{ fontSize: 56, color: '#D95763', letterSpacing: '3px', lineHeight: 1 }}>
            TIME&apos;S UP!
          </div>
          <div style={{ marginTop: 10, fontSize: 22, color: '#c8e8f0', letterSpacing: '1px' }}>
            Puzzle limit: 5 minutes
          </div>
          <button
            onClick={handleRetry}
            style={{
              marginTop: 28,
              padding: '8px 28px',
              fontSize: 28,
              fontFamily: "'VT323', monospace",
              background: '#e0d5b8',
              color: '#1a1a1a',
              border: '3px solid #1a1a1a',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px 0px #1a1a1a',
              letterSpacing: '1px',
            }}
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* HUD Panel */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 40,
          background: '#2F4858',
          border: '3px solid #1a1a1a',
          boxShadow: '4px 4px 0px 0px #1a1a1a',
          fontFamily: "'VT323', monospace",
          pointerEvents: 'none',
          userSelect: 'none',
          minWidth: 182,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px 4px',
          borderBottom: '2px solid rgba(26,26,26,0.3)',
          gap: 16,
        }}>
          <span style={{ fontSize: 20, color: '#c8e8f0', letterSpacing: '1px' }}>TIMER</span>
          <span style={{
            fontSize: 28,
            color: timerColor,
            letterSpacing: '1px',
            lineHeight: 1,
            animation: timerPulse ? 'hudPulse 0.6s ease-in-out infinite' : undefined,
          }}>
            {formatTime(displayElapsed)}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 14px 6px',
          gap: 16,
        }}>
          <span style={{ fontSize: 20, color: '#c8e8f0', letterSpacing: '1px' }}>MOVES</span>
          <span style={{
            fontSize: 28,
            color: movesColor,
            letterSpacing: '1px',
            lineHeight: 1,
            animation: movesPulse ? 'hudPulse 0.6s ease-in-out infinite' : undefined,
          }}>
            {turnCount}
          </span>
        </div>
      </div>
    </>
  );
}
