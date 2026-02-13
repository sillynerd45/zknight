import { useGameContext } from '@/context/GameContext';

export function MoveCounter() {
  const { state } = useGameContext();
  const { turnCount } = state;

  let color = 'var(--color-moves-normal)';
  let pulse = false;

  if (turnCount > 460) {
    color = 'var(--color-moves-danger)';
    pulse = true;
  } else if (turnCount > 400) {
    color = 'var(--color-moves-warning)';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 40,
        fontFamily: 'monospace',
        fontSize: 20,
        fontWeight: 'bold',
        color,
        animation: pulse ? 'pulse 0.6s ease-in-out infinite' : undefined,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      Moves: {turnCount}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
