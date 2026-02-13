import { useMemo } from 'react';
import {
  BASE_WIDTH,
  BASE_HEIGHT,
  TILE_SIZE,
  PLAY_GRID_W,
  PLAY_GRID_H,
  BG_PADDING_TILES,
} from '@/game/constants';
import type { Puzzle, MovingBarrel } from '@/game/types';
import { WaterLayer } from '@/components/WaterLayer';
import { BackgroundDecorations } from '@/components/BackgroundDecorations';
import { BoardGrid } from '@/components/BoardGrid';
import { GoalTiles } from '@/components/GoalTiles';
import { StaticBarrels } from '@/components/StaticBarrels';
import { MovingBarrels } from '@/components/MovingBarrels';

interface GameSceneProps {
  puzzle: Puzzle;
}

export function GameScene({ puzzle }: GameSceneProps) {
  // Play area origin (centered in container)
  const playOriginX = (BASE_WIDTH - PLAY_GRID_W * TILE_SIZE) / 2;
  const playOriginY = (BASE_HEIGHT - PLAY_GRID_H * TILE_SIZE) / 2;

  // Ground grid origin (BG_PADDING_TILES border around play area)
  const groundOriginX = playOriginX - BG_PADDING_TILES * TILE_SIZE;
  const groundOriginY = playOriginY - BG_PADDING_TILES * TILE_SIZE;

  // Initialize barrel runtime state from puzzle data
  const barrels: MovingBarrel[] = useMemo(
    () => puzzle.movingTNT.map((b) => ({ ...b, step: 0 })),
    [puzzle],
  );

  return (
    <div
      style={{
        position: 'relative',
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        overflow: 'hidden',
      }}
    >
      <WaterLayer />
      <BackgroundDecorations originX={groundOriginX} originY={groundOriginY} />
      <BoardGrid
        puzzle={puzzle}
        groundOriginX={groundOriginX}
        groundOriginY={groundOriginY}
        playOriginX={playOriginX}
        playOriginY={playOriginY}
      />
      <GoalTiles
        goalA={puzzle.goalA}
        goalB={puzzle.goalB}
        playOriginX={playOriginX}
        playOriginY={playOriginY}
      />
      <StaticBarrels
        data={puzzle.staticTNT}
        knightA={puzzle.knightA}
        knightB={puzzle.knightB}
        playOriginX={playOriginX}
        playOriginY={playOriginY}
      />
      <MovingBarrels
        barrels={barrels}
        playOriginX={playOriginX}
        playOriginY={playOriginY}
      />
    </div>
  );
}
