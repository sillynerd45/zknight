import { useState, useEffect, useRef } from 'react';
import type { SpriteAnimation } from '@/sprites/spriteMap';

export function useAnimatedSprite(
    animation: SpriteAnimation,
    options?: { active?: boolean; onComplete?: () => void }
): number {
    const { active = true, onComplete } = options ?? {};
    const [frameIndex, setFrameIndex] = useState(0);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        setFrameIndex(0); // reset on animation change
    }, [animation]);

    useEffect(() => {
        if (!active) return;

        const interval = setInterval(() => {
            setFrameIndex(prev => {
                const next = prev + 1;
                if (next >= animation.frameCount) {
                    if (animation.loop) return 0;
                    clearInterval(interval);
                    onCompleteRef.current?.();
                    return prev; // hold last frame
                }
                return next;
            });
        }, 1000 / animation.fps);

        return () => clearInterval(interval);
    }, [animation, active]);

    return frameIndex;
}
