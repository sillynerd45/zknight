import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/context/GameContext';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function RaceTimer() {
  const { state } = useGameContext();
  const { startTime, gameStatus } = state;
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

  // Freeze display on non-playing state
  useEffect(() => {
    if (gameStatus !== 'playing' && startTime) {
      setElapsed(Date.now() - startTime);
    }
  }, [gameStatus, startTime]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 40,
        fontFamily: 'monospace',
        fontSize: 20,
        fontWeight: 'bold',
        color: 'var(--color-moves-normal)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {formatTime(elapsed)}
    </div>
  );
}
