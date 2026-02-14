import { useState, useCallback, useEffect } from 'react';
import type { Position, Direction, GameStatus } from '@/game/types';
import { Sprite } from '@/components/Sprite';

interface KnightAProps {
  pos: Position;
  lastDirection: Direction | null;
  gameStatus: GameStatus;
  exploded: boolean;
  isCrossing: boolean;
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

export function KnightA({ pos, lastDirection, gameStatus, exploded, isCrossing, onExplosionComplete }: KnightAProps) {
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
