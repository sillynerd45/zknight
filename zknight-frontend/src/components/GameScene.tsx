import {
  BASE_WIDTH,
  BASE_HEIGHT,
  TILE_SIZE,
  PLAY_GRID_W,
  PLAY_GRID_H,
  BG_PADDING_TILES,
} from '@/game/constants';
import type { Position, MovingBarrel, Direction, GameStatus, Puzzle } from '@/game/types';
import { WaterLayer } from '@/components/WaterLayer';
import { BackgroundDecorations } from '@/components/BackgroundDecorations';
import { BoardGrid } from '@/components/BoardGrid';
import { GoalTiles } from '@/components/GoalTiles';
import { StaticBarrels } from '@/components/StaticBarrels';
import { MovingBarrels } from '@/components/MovingBarrels';
import { KnightA } from '@/components/KnightA';
import { KnightB } from '@/components/KnightB';
import { Sprite } from '@/components/Sprite';

interface GameSceneProps {
  puzzle: Puzzle;
  knightA: Position;
  knightB: Position;
  barrels: MovingBarrel[];
  gameStatus: GameStatus;
  lastDirection: Direction | null;
  explodedKnights: { knightA: boolean; knightB: boolean };
  destroyedStaticTNT: Position[];
  crossingExplosionPos: Position | null;
  onExplosionComplete?: () => void;
}

export function GameScene({
  puzzle,
  knightA,
  knightB,
  barrels,
  gameStatus,
  lastDirection,
  explodedKnights,
  destroyedStaticTNT,
  crossingExplosionPos,
  onExplosionComplete,
}: GameSceneProps) {
  // Play area origin (centered in container)
  const playOriginX = (BASE_WIDTH - PLAY_GRID_W * TILE_SIZE) / 2;
  const playOriginY = (BASE_HEIGHT - PLAY_GRID_H * TILE_SIZE) / 2;

  // Ground grid origin (BG_PADDING_TILES border around play area)
  const groundOriginX = playOriginX - BG_PADDING_TILES * TILE_SIZE;
  const groundOriginY = playOriginY - BG_PADDING_TILES * TILE_SIZE;

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
        knightA={knightA}
        knightB={knightB}
        destroyedStaticTNT={destroyedStaticTNT}
        playOriginX={playOriginX}
        playOriginY={playOriginY}
      />
      <MovingBarrels
        barrels={barrels}
        playOriginX={playOriginX}
        playOriginY={playOriginY}
      />
      {/* Knights rendered inside a play-area-offset container */}
      <div
        style={{
          position: 'absolute',
          left: playOriginX,
          top: playOriginY,
        }}
      >
        <KnightA
          pos={knightA}
          lastDirection={lastDirection}
          gameStatus={gameStatus}
          exploded={explodedKnights.knightA}
          isCrossing={crossingExplosionPos !== null}
          onExplosionComplete={onExplosionComplete}
        />
        <KnightB
          pos={knightB}
          lastDirection={lastDirection}
          gameStatus={gameStatus}
          exploded={explodedKnights.knightB}
          isCrossing={crossingExplosionPos !== null}
          onExplosionComplete={onExplosionComplete}
        />
        {/* Render crossing explosion at midpoint */}
        {crossingExplosionPos && gameStatus === 'exploded' && (
          <Sprite
            spriteKey="explosion"
            animation="explode"
            x={crossingExplosionPos.x}
            y={crossingExplosionPos.y}
            zIndex={40}
            transitionDuration={0}
            onComplete={onExplosionComplete}
          />
        )}
      </div>
    </div>
  );
}
