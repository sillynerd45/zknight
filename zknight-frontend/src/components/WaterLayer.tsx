import { BASE_WIDTH, BASE_HEIGHT } from '@/game/constants';
import { WATER_TILE } from '@/sprites/staticAssets';

export function WaterLayer() {
  return (
    <div
      style={{
        position: 'absolute',
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        backgroundImage: `url('${WATER_TILE}')`,
        backgroundRepeat: 'repeat',
        imageRendering: 'pixelated',
        zIndex: 0,
      }}
    />
  );
}
