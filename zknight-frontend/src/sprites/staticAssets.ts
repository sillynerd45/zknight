/** Individual static images (not spritesheets). */
export const ROCK_ASSETS = [
    '/sprites/rock/rock1.png',
    '/sprites/rock/rock2.png',
    '/sprites/rock/rock3.png',
    '/sprites/rock/rock4.png',
] as const;

export const DECO_ASSETS = Array.from(
    { length: 18 },
    (_, i) => `/sprites/deco/${String(i + 1).padStart(2, '0')}.png`
);

export const WATER_TILE = '/sprites/water.png';

/** Goal tiles — placed at the opponent knight's starting position. */
export const TARGET_TILES = {
    knightA: '/sprites/target_knight_a.png', // placed at goalA (Knight B's start)
    knightB: '/sprites/target_knight_b.png', // placed at goalB (Knight A's start)
} as const;
