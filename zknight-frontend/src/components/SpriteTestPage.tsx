import { useState } from 'react';
import { Sprite } from '@/components/Sprite';
import { GroundTile } from '@/components/GroundTile';
import { StaticSprite } from '@/components/StaticSprite';
import { TARGET_TILES, ROCK_ASSETS, DECO_ASSETS } from '@/sprites/staticAssets';
import { TILE_SIZE } from '@/game/constants';
import type { GroundTileKey } from '@/sprites/groundTiles';

/**
 * Temporary smoke test page for the sprite system.
 * Renders all sprite types to verify animations, centering, and nine-slice ground.
 * Remove this file after visual verification.
 */
export function SpriteTestPage() {
    const [explosionKey, setExplosionKey] = useState(0);

    // Nine-slice ground: 5 wide × 4 tall (with border)
    const groundTiles: { key: GroundTileKey; x: number; y: number }[] = [];
    const groundW = 5;
    const groundH = 4;
    for (let gy = 0; gy < groundH; gy++) {
        for (let gx = 0; gx < groundW; gx++) {
            let key: GroundTileKey;
            if (gy === 0) {
                key = gx === 0 ? 'topLeft' : gx === groundW - 1 ? 'topRight' : 'topCenter';
            } else if (gy === groundH - 1) {
                key = gx === 0 ? 'bottomLeft' : gx === groundW - 1 ? 'bottomRight' : 'bottomCenter';
            } else {
                key = gx === 0 ? 'middleLeft' : gx === groundW - 1 ? 'middleRight' : 'center';
            }
            groundTiles.push({ key, x: gx, y: gy });
        }
    }

    return (
        <div style={{ width: '100%', height: '100%', background: '#1a1a2e', overflow: 'auto', padding: 16 }}>
            {/* Section: Knight A — all animations */}
            <SectionLabel text="Knight A — idle, walkRight, walkLeft, walkDown, walkUp" />
            <SpriteRow yOffset={0}>
                <Sprite spriteKey="knightA" animation="idle" x={0} y={0} zIndex={1} />
                <Sprite spriteKey="knightA" animation="walkRight" x={2} y={0} zIndex={1} />
                <Sprite spriteKey="knightA" animation="walkLeft" x={4} y={0} zIndex={1} />
                <Sprite spriteKey="knightA" animation="walkDown" x={6} y={0} zIndex={1} />
                <Sprite spriteKey="knightA" animation="walkUp" x={8} y={0} zIndex={1} />
            </SpriteRow>

            {/* Section: Knight B — idle */}
            <SectionLabel text="Knight B — idle" />
            <SpriteRow yOffset={0}>
                <Sprite spriteKey="knightB" animation="idle" x={0} y={0} zIndex={1} />
            </SpriteRow>

            {/* Section: Barrel — all 3 states (split across two spritesheets) */}
            <SectionLabel text="Barrel — staticIdle, reactive (barrel_static.png) + movingRoll (barrel_move.png)" />
            <SpriteRow yOffset={0}>
                <Sprite spriteKey="barrelStatic" animation="staticIdle" x={0} y={0} zIndex={1} />
                <Sprite spriteKey="barrelMove" animation="movingRoll" x={2} y={0} zIndex={1} />
                <Sprite spriteKey="barrelStatic" animation="reactive" x={4} y={0} zIndex={1} />
            </SpriteRow>

            {/* Section: Explosion — play once */}
            <SectionLabel text="Explosion — plays once, holds last frame (click to replay)" />
            <div
                style={{ cursor: 'pointer', marginBottom: 8, color: '#aaa', fontSize: 12 }}
                onClick={() => setExplosionKey(prev => prev + 1)}
            >
                [Click to replay]
            </div>
            <SpriteRow yOffset={0}>
                <Sprite
                    key={explosionKey}
                    spriteKey="explosion"
                    animation="explode"
                    x={0}
                    y={0}
                    zIndex={1}
                />
            </SpriteRow>

            {/* Section: Tree + Bush */}
            <SectionLabel text="Tree idle + Bush idle" />
            <SpriteRow yOffset={0}>
                <Sprite spriteKey="tree" animation="idle" x={0} y={0} zIndex={1} />
                <Sprite spriteKey="bush" animation="idle" x={3} y={0} zIndex={1} />
            </SpriteRow>

            {/* Section: Ground nine-slice */}
            <SectionLabel text="Ground tiles — nine-slice border + center fill" />
            <div style={{ position: 'relative', width: groundW * TILE_SIZE, height: groundH * TILE_SIZE, marginBottom: 24 }}>
                {groundTiles.map(t => (
                    <GroundTile key={`${t.x}-${t.y}`} tileKey={t.key} x={t.x} y={t.y} />
                ))}
            </div>

            {/* Section: Target tiles */}
            <SectionLabel text="Target tiles — Knight A (blue) + Knight B (red)" />
            <div style={{ position: 'relative', width: 4 * TILE_SIZE, height: TILE_SIZE, marginBottom: 24 }}>
                <StaticSprite src={TARGET_TILES.knightA} x={0} y={0} zIndex={1} />
                <StaticSprite src={TARGET_TILES.knightB} x={2} y={0} zIndex={1} />
            </div>

            {/* Section: Rocks + Deco */}
            <SectionLabel text="Rocks (4 variants) + Deco (first 6 of 18)" />
            <div style={{ position: 'relative', width: 12 * TILE_SIZE, height: 2 * TILE_SIZE, marginBottom: 24 }}>
                {ROCK_ASSETS.map((src, i) => (
                    <StaticSprite key={src} src={src} x={i} y={0} zIndex={1} />
                ))}
                {DECO_ASSETS.slice(0, 6).map((src, i) => (
                    <StaticSprite key={src} src={src} x={i + 5} y={0} zIndex={1} />
                ))}
            </div>
        </div>
    );
}

function SectionLabel({ text }: { text: string }) {
    return (
        <div style={{ color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, marginTop: 16, marginBottom: 4 }}>
            {text}
        </div>
    );
}

function SpriteRow({ children, yOffset: _yOffset }: { children: React.ReactNode; yOffset: number }) {
    return (
        <div style={{ position: 'relative', width: 12 * TILE_SIZE, height: 3 * TILE_SIZE, marginBottom: 8 }}>
            {children}
        </div>
    );
}
