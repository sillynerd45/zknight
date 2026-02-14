import { useState, useCallback, useEffect } from 'react';
import type { Position, Direction, GameStatus } from '@/game/types';
import { Sprite } from '@/components/Sprite';

interface KnightBProps {
  pos: Position;
  lastDirection: Direction | null;
  gameStatus: GameStatus;
  exploded: boolean;
  isCrossing: boolean;
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

export function KnightB({ pos, lastDirection, gameStatus, exploded, isCrossing, onExplosionComplete }: KnightBProps) {
  const [explosionComplete, setExplosionComplete] = useState(false);

  // Reset explosion state when game restarts
  useEffect(() => {
    if (gameStatus !== 'exploded') {
      setExplosionComplete(false);
    }
  }, [gameStatus]);

  const handleExplosionComplete = useCallback(() => {
    setExplosionComplete(true);
    onExplosionComplete?.();
  }, [onExplosionComplete]);

  // If crossing, don't render individual explosion (rendered at midpoint in GameScene)
  // Just disappear immediately
  if (gameStatus === 'exploded' && isCrossing && exploded) {
    return null;
  }

  // Show explosion animation if this knight exploded and animation hasn't completed yet
  if (gameStatus === 'exploded' && exploded && !explosionComplete) {
    return (
      <Sprite
        spriteKey="explosion"
        animation="explode"
        x={pos.x}
        y={pos.y}
        zIndex={30 + pos.y}
        transitionDuration={0}
        onComplete={handleExplosionComplete}
      />
    );
  }

  // Don't render if exploded (explosion animation finished or other knight exploded)
  if (exploded) {
    return null;
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
