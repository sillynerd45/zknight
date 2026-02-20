import { useMemo } from 'react';
import { TILE_SIZE, BG_GRID_W, BG_GRID_H } from '@/game/constants';
import type { Puzzle } from '@/game/types';
import { GroundTile } from '@/components/GroundTile';
import { StaticSprite } from '@/components/StaticSprite';
import { WALL_ASSETS } from '@/sprites/staticAssets';
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
  // Assign a random wall asset to each wall position once per unique wall layout.
  // The memo key is the serialized wall positions, so assets re-randomize only
  // when the actual walls change (i.e. a new puzzle is loaded).
  const wallAssetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const wall of puzzle.walls) {
      const key = `${wall.x},${wall.y}`;
      map.set(key, WALL_ASSETS[Math.floor(Math.random() * WALL_ASSETS.length)]);
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.walls.map(w => `${w.x},${w.y}`).join('|')]);

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
    const src = wallAssetMap.get(`${wall.x},${wall.y}`) ?? WALL_ASSETS[0];
    return (
      <StaticSprite
        key={`wall-${wall.x}-${wall.y}`}
        src={src}
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
