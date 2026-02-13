/**
 * Deco asset dimensions.
 *
 * Most deco assets are 64×64. Exceptions:
 * - 16.png, 17.png: 64×128 (tall items)
 * - 18.png: 192×192 (large item, like trees)
 */

export interface DecoSize {
    width: number;
    height: number;
}

const DECO_SIZE_OVERRIDES: Record<string, DecoSize> = {
    '/sprites/deco/16.png': {width: 64, height: 128},
    '/sprites/deco/17.png': {width: 64, height: 128},
    '/sprites/deco/18.png': {width: 192, height: 192},
};

const DEFAULT_SIZE: DecoSize = {width: 64, height: 64};

export function getDecoSize(asset: string): DecoSize {
    return DECO_SIZE_OVERRIDES[asset] ?? DEFAULT_SIZE;
}
