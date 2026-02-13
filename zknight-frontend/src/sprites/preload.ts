import { SPRITE_MAP } from './spriteMap';
import { GROUND_TILE_MAP } from './groundTiles';
import { ROCK_ASSETS, DECO_ASSETS, WATER_TILE, TARGET_TILES } from './staticAssets';

function loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
    });
}

export function preloadSprites(): Promise<void> {
    const sources: string[] = [];

    // Spritesheets
    for (const config of Object.values(SPRITE_MAP)) {
        sources.push(config.src);
    }

    // Ground tile map
    sources.push(GROUND_TILE_MAP.src);

    // Static assets
    sources.push(WATER_TILE);
    sources.push(TARGET_TILES.knightA);
    sources.push(TARGET_TILES.knightB);
    sources.push(...ROCK_ASSETS);
    sources.push(...DECO_ASSETS);

    return Promise.all(sources.map(loadImage)).then(() => undefined);
}
