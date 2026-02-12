import type { MovingBarrel, Position } from './types';

export function advanceBarrels(barrels: MovingBarrel[]): MovingBarrel[] {
  return barrels.map((barrel) => {
    if (!barrel.loop) return barrel;
    return { ...barrel, step: (barrel.step + 1) % barrel.path.length };
  });
}

export function getBarrelPositions(barrels: MovingBarrel[]): Position[] {
  return barrels.map((barrel) => barrel.path[barrel.step]);
}
