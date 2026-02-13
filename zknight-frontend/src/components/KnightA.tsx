import type { Position, Direction, GameStatus } from '@/game/types';
import { Sprite } from '@/components/Sprite';

interface KnightAProps {
  pos: Position;
  lastDirection: Direction | null;
  gameStatus: GameStatus;
  onExplosionComplete?: () => void;
}

function getAnimation(lastDirection: Direction | null, gameStatus: GameStatus): string {
  if (gameStatus === 'idle' || !lastDirection) return 'idle';
  switch (lastDirection) {
    case 'ArrowRight': return 'walkRight';
    case 'ArrowLeft':  return 'walkLeft';
    case 'ArrowUp':    return 'walkUp';
    case 'ArrowDown':  return 'walkDown';
  }
}

export function KnightA({ pos, lastDirection, gameStatus, onExplosionComplete }: KnightAProps) {
  if (gameStatus === 'exploded') {
    return (
      <Sprite
        spriteKey="explosion"
        animation="explode"
        x={pos.x}
        y={pos.y}
        zIndex={30 + pos.y}
        onComplete={onExplosionComplete}
      />
    );
  }

  return (
    <Sprite
      spriteKey="knightA"
      animation={getAnimation(lastDirection, gameStatus)}
      x={pos.x}
      y={pos.y}
      zIndex={30 + pos.y}
    />
  );
}
