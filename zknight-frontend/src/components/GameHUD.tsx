import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/context/GameContext';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function GameHUD() {
  const { state } = useGameContext();
  const { startTime, gameStatus, turnCount } = state;
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!startTime || gameStatus !== 'playing') return;
    const tick = () => {
      setElapsed(Date.now() - startTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [startTime, gameStatus]);

  // Freeze display when game stops
  useEffect(() => {
    if (gameStatus !== 'playing' && startTime) {
      setElapsed(Date.now() - startTime);
    }
  }, [gameStatus, startTime]);

  let movesColor = '#F4E8C1';
  let movesPulse = false;
  if (turnCount > 460) {
    movesColor = '#D95763';
    movesPulse = true;
  } else if (turnCount > 400) {
    movesColor = '#F2D06B';
  }

  return (
    <>
      <style>{`@keyframes hudPulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
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
          <span style={{ fontSize: 28, color: '#F4E8C1', letterSpacing: '1px', lineHeight: 1 }}>
            {formatTime(elapsed)}
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
