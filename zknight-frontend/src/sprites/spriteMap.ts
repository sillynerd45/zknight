// ── Types ──────────────────────────────────────────────

/** A single animation within a spritesheet (one row or partial row). */
export interface SpriteAnimation {
    row: number;        // 0-indexed row in the sheet
    startCol: number;   // 0-indexed first column of the animation
    frameCount: number; // number of frames to play
    fps: number;
    loop: boolean;      // false = play once then hold last frame
    mirror?: boolean;   // true = apply CSS scaleX(-1) (e.g. walk left)
}

/** A spritesheet with one or more named animations. */
export interface SpriteSheetConfig {
    src: string;
    cols: number;        // total columns in the sheet
    rows: number;        // total rows in the sheet
    frameWidth: number;  // pixel width of one frame cell (including padding)
    frameHeight: number; // pixel height of one frame cell (including padding)
    animations: Record<string, SpriteAnimation>;
}

// ── Knight animation states ────────────────────────────

type KnightAnimation = 'idle' | 'walkRight' | 'walkLeft' | 'walkUp' | 'walkDown';

const KNIGHT_ANIMATIONS: Record<KnightAnimation, SpriteAnimation> = {
    idle: {row: 0, startCol: 0, frameCount: 6, fps: 10, loop: true},
    walkRight: {row: 1, startCol: 0, frameCount: 6, fps: 10, loop: true},
    walkLeft: {row: 1, startCol: 0, frameCount: 6, fps: 10, loop: true, mirror: true},
    walkDown: {row: 5, startCol: 0, frameCount: 3, fps: 10, loop: true},
    walkUp: {row: 6, startCol: 0, frameCount: 3, fps: 10, loop: true},
};

// ── Barrel animation states ────────────────────────────

type StaticBarrelAnimation = 'staticIdle' | 'reactive';
type MovingBarrelAnimation = 'movingRoll';

const STATIC_BARREL_ANIMATIONS: Record<StaticBarrelAnimation, SpriteAnimation> = {
    staticIdle: {row: 0, startCol: 0, frameCount: 1, fps: 8, loop: false},
    reactive: {row: 5, startCol: 0, frameCount: 3, fps: 8, loop: true},
};

const MOVING_BARREL_ANIMATIONS: Record<MovingBarrelAnimation, SpriteAnimation> = {
    movingRoll: {row: 3, startCol: 0, frameCount: 6, fps: 8, loop: true},
};

// ── Sprite map ─────────────────────────────────────────

export const SPRITE_MAP = {
    knightA: {
        src: '/sprites/knight_blue.png',
        cols: 6, rows: 8,
        frameWidth: 192, frameHeight: 192,
        animations: KNIGHT_ANIMATIONS,
    },
    knightB: {
        src: '/sprites/knight_red.png',
        cols: 6, rows: 8,
        frameWidth: 192, frameHeight: 192,
        animations: KNIGHT_ANIMATIONS,
    },
    barrelStatic: {
        src: '/sprites/barrel_static.png',
        cols: 6, rows: 6,
        frameWidth: 128, frameHeight: 128,
        animations: STATIC_BARREL_ANIMATIONS,
    },
    barrelMove: {
        src: '/sprites/barrel_move.png',
        cols: 6, rows: 6,
        frameWidth: 128, frameHeight: 128,
        animations: MOVING_BARREL_ANIMATIONS,
    },
    explosion: {
        src: '/sprites/explosion.png',
        cols: 10, rows: 1,
        frameWidth: 192, frameHeight: 192,
        animations: {
            explode: {row: 0, startCol: 0, frameCount: 10, fps: 8, loop: false},
        },
    },
    tree: {
        src: '/sprites/tree.png',
        cols: 4, rows: 3,
        frameWidth: 192, frameHeight: 192,
        animations: {
            idle: {row: 0, startCol: 0, frameCount: 4, fps: 2, loop: true},
        },
    },
    bush: {
        src: '/sprites/bush/bushes1.png',
        cols: 8, rows: 1,
        frameWidth: 128, frameHeight: 128,
        animations: {
            idle: {row: 0, startCol: 0, frameCount: 8, fps: 2, loop: true},
        },
    },
} as const satisfies Record<string, SpriteSheetConfig>;

export type SpriteKey = keyof typeof SPRITE_MAP;
