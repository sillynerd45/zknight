import type { Position, Direction, GameStatus } from '@/game/types';
import { Sprite } from '@/components/Sprite';

interface KnightBProps {
  pos: Position;
  lastDirection: Direction | null;
  gameStatus: GameStatus;
  onExplosionComplete?: () => void;
}

function getAnimation(lastDirection: Direction | null, gameStatus: GameStatus): { anim: string; mirror: boolean } {
  if (gameStatus === 'idle' || !lastDirection) return { anim: 'idle', mirror: true };
  // Mirrored relative to Knight A
  switch (lastDirection) {
    case 'ArrowRight': return { anim: 'walkLeft', mirror: false };
    case 'ArrowLeft':  return { anim: 'walkRight', mirror: false };
    case 'ArrowUp':    return { anim: 'walkDown', mirror: false };
    case 'ArrowDown':  return { anim: 'walkUp', mirror: false };
  }
}

export function KnightB({ pos, lastDirection, gameStatus, onExplosionComplete }: KnightBProps) {
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

  const { anim, mirror } = getAnimation(lastDirection, gameStatus);

  return (
    <Sprite
      spriteKey="knightB"
      animation={anim}
      x={pos.x}
      y={pos.y}
      zIndex={30 + pos.y}
      mirror={mirror}
    />
  );
}
