import { TILE_SIZE, BG_GRID_W, BG_GRID_H } from '@/game/constants';
import type { Puzzle } from '@/game/types';
import { GroundTile } from '@/components/GroundTile';
import { StaticSprite } from '@/components/StaticSprite';
import { ROCK_ASSETS } from '@/sprites/staticAssets';
import type { GroundTileKey } from '@/sprites/groundTiles';

interface BoardGridProps {
  puzzle: Puzzle;
  groundOriginX: number;
  groundOriginY: number;
  playOriginX: number;
  playOriginY: number;
}

function getGroundTileKey(x: number, y: number): GroundTileKey {
  const lastX = BG_GRID_W - 1;
  const lastY = BG_GRID_H - 1;

  if (x === 0 && y === 0) return 'topLeft';
  if (x === lastX && y === 0) return 'topRight';
  if (x === 0 && y === lastY) return 'bottomLeft';
  if (x === lastX && y === lastY) return 'bottomRight';
  if (y === 0) return 'topCenter';
  if (y === lastY) return 'bottomCenter';
  if (x === 0) return 'middleLeft';
  if (x === lastX) return 'middleRight';
  return 'center';
}

export function BoardGrid({ puzzle, groundOriginX, groundOriginY, playOriginX, playOriginY }: BoardGridProps) {
  const groundTiles: React.ReactNode[] = [];
  for (let y = 0; y < BG_GRID_H; y++) {
    for (let x = 0; x < BG_GRID_W; x++) {
      groundTiles.push(
        <GroundTile
          key={`ground-${x}-${y}`}
          tileKey={getGroundTileKey(x, y)}
          x={x}
          y={y}
        />
      );
    }
  }

  const wallSprites = puzzle.walls.map((wall) => {
    const rockIdx = (wall.x * 7 + wall.y * 13) % ROCK_ASSETS.length;
    return (
      <StaticSprite
        key={`wall-${wall.x}-${wall.y}`}
        src={ROCK_ASSETS[rockIdx]}
        x={wall.x}
        y={wall.y}
        zIndex={wall.y}
      />
    );
  });

  return (
    <>
      {/* Ground nine-slice grid */}
      <div
        style={{
          position: 'absolute',
          left: groundOriginX,
          top: groundOriginY,
          width: BG_GRID_W * TILE_SIZE,
          height: BG_GRID_H * TILE_SIZE,
          zIndex: 2,
        }}
      >
        {groundTiles}
      </div>

      {/* Wall sprites positioned relative to play area */}
      <div
        style={{
          position: 'absolute',
          left: playOriginX,
          top: playOriginY,
          zIndex: 2,
        }}
      >
        {wallSprites}
      </div>
    </>
  );
}
