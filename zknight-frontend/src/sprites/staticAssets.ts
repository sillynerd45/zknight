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

export const WOOD_ASSET = '/sprites/wood.png';

// Deco assets allowed as wall variants (excludes 04, 05, 06, 16, 17, 18 which are
// oversized or otherwise unsuitable for wall slots).
const ALLOWED_DECO_WALL_ASSETS = [
    '/sprites/deco/01.png',
    '/sprites/deco/02.png',
    '/sprites/deco/03.png',
    '/sprites/deco/07.png',
    '/sprites/deco/08.png',
    '/sprites/deco/09.png',
    '/sprites/deco/10.png',
    '/sprites/deco/11.png',
    '/sprites/deco/12.png',
    '/sprites/deco/13.png',
    '/sprites/deco/14.png',
    '/sprites/deco/15.png',
];

/** Full pool of assets that can be randomly assigned to puzzle walls. */
export const WALL_ASSETS: readonly string[] = [
    ...ROCK_ASSETS,
    ...ALLOWED_DECO_WALL_ASSETS,
    WOOD_ASSET,
];

/** Goal tiles — placed at the opponent knight's starting position. */
export const TARGET_TILES = {
    knightA: '/sprites/target_knight_a.png', // placed at goalA (Knight B's start)
    knightB: '/sprites/target_knight_b.png', // placed at goalB (Knight A's start)
} as const;
