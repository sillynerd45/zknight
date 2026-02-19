import { TILE_SIZE, BG_GRID_W, BG_GRID_H } from '@/game/constants';
import type { Puzzle } from '@/game/types';
import { GroundTile } from '@/components/GroundTile';
import { StaticSprite } from '@/components/StaticSprite';
import { ROCK_ASSETS } from '@/sprites/staticAssets';
import { getAutoGroundTileKey } from '@/sprites/groundTiles';
import { GROUND_TILE_REMOVED, GROUND_TILE_VARIANTS } from '@/puzzles/backgroundLayout';

interface BoardGridProps {
  puzzle: Puzzle;
  groundOriginX: number;
  groundOriginY: number;
  playOriginX: number;
  playOriginY: number;
}

export function BoardGrid({ puzzle, groundOriginX, groundOriginY, playOriginX, playOriginY }: BoardGridProps) {
  const groundTiles: React.ReactNode[] = [];

  // Default 15×11 BG grid
  for (let y = 0; y < BG_GRID_H; y++) {
    for (let x = 0; x < BG_GRID_W; x++) {
      if (GROUND_TILE_REMOVED.some(p => p.x === x && p.y === y)) continue;

      const variant = GROUND_TILE_VARIANTS.find(v => v.pos.x === x && v.pos.y === y);
      groundTiles.push(
        variant ? (
          <GroundTile key={`ground-${x}-${y}`} col={variant.col} row={variant.row} x={x} y={y} />
        ) : (
          <GroundTile key={`ground-${x}-${y}`} tileKey={getAutoGroundTileKey(x, y)} x={x} y={y} />
        )
      );
    }
  }

  // Extra tiles painted outside the default BG grid
  for (const v of GROUND_TILE_VARIANTS) {
    const {pos, col, row} = v;
    if (pos.x < 0 || pos.x >= BG_GRID_W || pos.y < 0 || pos.y >= BG_GRID_H) {
      groundTiles.push(
        <GroundTile key={`ground-${pos.x}-${pos.y}`} col={col} row={row} x={pos.x} y={pos.y} />
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
