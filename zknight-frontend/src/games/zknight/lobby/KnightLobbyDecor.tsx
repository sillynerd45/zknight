import {useState, useEffect, useRef} from 'react';

// ── Sprite sheet constants ────────────────────────────────────────────────────
// Knight sheet: 6 cols × 8 rows, each frame 192×192 px
// The 64×64 "tile content" sits at offset (64, 80) within each 192×192 frame.
// contentOffsetX = 64  → horizontally centred: (192 - 64) / 2 = 64
// contentOffsetY = 80  → shifted 16 px above centre (from spriteMap.ts)

const SPRITE_COLS = 6;
const SPRITE_ROWS = 8;
const FRAME_W = 192;
const FRAME_H = 192;
const CONTENT_OFFSET_X = 64;
const CONTENT_OFFSET_Y = 80;

// Scale: render the 64 px tile content at 128 px on screen (2×).
const SCALE = 1.5;
const CONTENT_SIZE = 64 * SCALE; // = 128 px on screen

// VIEWPORT_SIZE > CONTENT_SIZE so the sprite visual (which extends beyond the
// 64×64 tile boundary — think sword tip, helmet plume, cape) is not clipped.
// 48 px of padding per side at 1.5× scale = 32 px of original frame space.
const VIEWPORT_SIZE = CONTENT_SIZE + 192; //

// How many scaled pixels of padding surrounds the content inside the viewport.
const VP_PAD = (VIEWPORT_SIZE - CONTENT_SIZE) / 2; // = 48

// Full scaled sheet dimensions (used for background-size).
const BG_W = SPRITE_COLS * FRAME_W * SCALE; // 2304
const BG_H = SPRITE_ROWS * FRAME_H * SCALE; // 3072

// ── Animation phase sequence ──────────────────────────────────────────────────
// Pattern (loops continuously):
//   1. Row 0, looping for 3 s
//   2. Row 1, looping for 3 s
//   3. Row 2, played exactly 2 full cycles (6 frames × 2 × 100 ms = 1.2 s)
//   → back to 1

type Phase =
    | {kind: 'timed'; row: number; durationMs: number}
    | {kind: 'repeat'; row: number; cycles: number};

const PHASES: Phase[] = [
    {kind: 'timed',  row: 0, durationMs: 3000},
    {kind: 'timed',  row: 1, durationMs: 3000},
    {kind: 'repeat', row: 2, cycles: 2},
];

const FPS = 10;
const FRAME_COUNT = 6;
const FRAME_INTERVAL_MS = 1000 / FPS; // 100 ms per frame

// ── Padding from screen edges (px) ───────────────────────────────────────────
const EDGE_PAD = 8;

// ── Animation hook ───────────────────────────────────────────────────────────

function useKnightAnimation() {
    const internal = useRef({
        phaseIndex: 0,
        frame: 0,
        elapsedMs: 0,    // accumulates ms for 'timed' phases
        framesPlayed: 0, // counts frames played for 'once' phases
    });

    const [display, setDisplay] = useState({
        row: PHASES[0].row,
        frame: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const s = internal.current;
            const phase = PHASES[s.phaseIndex];

            if (phase.kind === 'timed') {
                // Advance frame (looping) and accumulate elapsed time.
                const nextFrame = (s.frame + 1) % FRAME_COUNT;
                s.frame = nextFrame;
                s.elapsedMs += FRAME_INTERVAL_MS;

                if (s.elapsedMs >= phase.durationMs) {
                    // Time's up — move to next phase.
                    const next = (s.phaseIndex + 1) % PHASES.length;
                    s.phaseIndex = next;
                    s.frame = 0;
                    s.elapsedMs = 0;
                    s.framesPlayed = 0;
                    setDisplay({row: PHASES[next].row, frame: 0});
                } else {
                    setDisplay({row: phase.row, frame: nextFrame});
                }
            } else {
                // 'repeat' — play through FRAME_COUNT × cycles frames exactly.
                s.framesPlayed += 1;
                const totalFrames = FRAME_COUNT * phase.cycles;

                if (s.framesPlayed >= totalFrames) {
                    // Finished — move to next phase.
                    const next = (s.phaseIndex + 1) % PHASES.length;
                    s.phaseIndex = next;
                    s.frame = 0;
                    s.elapsedMs = 0;
                    s.framesPlayed = 0;
                    setDisplay({row: PHASES[next].row, frame: 0});
                } else {
                    const nextFrame = s.framesPlayed % FRAME_COUNT;
                    s.frame = nextFrame;
                    setDisplay({row: phase.row, frame: nextFrame});
                }
            }
        }, FRAME_INTERVAL_MS);

        return () => clearInterval(timer);
    }, []);

    return display;
}

// ── KnightSprite ─────────────────────────────────────────────────────────────

interface KnightSpriteProps {
    src: string;
    row: number;
    frame: number;
    mirror?: boolean;
}

function KnightSprite({src, row, frame, mirror = false}: KnightSpriteProps) {
    // Background-position: shift the scaled sheet so the content tile starts at
    // VP_PAD px inside the viewport (leaving equal padding on all sides).
    //
    // Formula derivation (for X):
    //   Content starts at CONTENT_OFFSET_X * SCALE in the scaled frame.
    //   The frame itself starts at col * FRAME_W * SCALE in the scaled sheet.
    //   We want content to appear at VP_PAD px from the viewport's left edge,
    //   so the sheet offset we hide is: (col * FRAME_W + CONTENT_OFFSET_X) * SCALE - VP_PAD
    const posX = -(frame * FRAME_W * SCALE + CONTENT_OFFSET_X * SCALE - VP_PAD);
    const posY = -(row * FRAME_H * SCALE + CONTENT_OFFSET_Y * SCALE - VP_PAD);

    return (
        <div
            style={{
                width: VIEWPORT_SIZE,
                height: VIEWPORT_SIZE,
                backgroundImage: `url(${src})`,
                backgroundSize: `${BG_W}px ${BG_H}px`,
                backgroundPosition: `${posX}px ${posY}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                transform: mirror ? 'scaleX(-1)' : undefined,
                flexShrink: 0,
            }}
        />
    );
}

// ── KnightLobbyDecor ─────────────────────────────────────────────────────────

export function KnightLobbyDecor() {
    const blue = useKnightAnimation();
    const red  = useKnightAnimation();

    const base: React.CSSProperties = {
        position: 'fixed',
        zIndex: 10,
        pointerEvents: 'none',
        bottom: EDGE_PAD,
    };

    return (
        <>
            {/* Blue knight — bottom-left */}
            <div style={{...base, left: EDGE_PAD}}>
                <KnightSprite
                    src="/sprites/knight_blue.png"
                    row={blue.row}
                    frame={blue.frame}
                />
            </div>

            {/* Red knight — bottom-right, mirrored */}
            <div style={{...base, right: EDGE_PAD}}>
                <KnightSprite
                    src="/sprites/knight_red.png"
                    row={red.row}
                    frame={red.frame}
                    mirror
                />
            </div>
        </>
    );
}
