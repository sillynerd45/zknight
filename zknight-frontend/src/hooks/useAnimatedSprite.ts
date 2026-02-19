import { useState, useEffect, useRef } from 'react';
import type { SpriteAnimation } from '@/sprites/spriteMap';

export function useAnimatedSprite(
    animation: SpriteAnimation,
    options?: { active?: boolean; onComplete?: () => void }
): number {
    const { active = true, onComplete } = options ?? {};
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    // Compute a stable random start frame once per mount (for randomPhase sprites).
    // useRef ensures the same value is used for both the initial state and the schedule.
    const startFrameRef = useRef(
        animation.randomPhase ? Math.floor(Math.random() * animation.frameCount) : 0
    );

    // Lazy useState so the very first render already shows the random frame — no flash.
    const [frameIndex, setFrameIndex] = useState(startFrameRef.current);

    // Track the previous animation reference to skip the reset on mount
    // (startFrameRef is already correct at mount time).
    const prevAnimRef = useRef(animation);

    // Reset only on actual animation changes, not on mount.
    useEffect(() => {
        if (prevAnimRef.current === animation) return;
        prevAnimRef.current = animation;
        startFrameRef.current = animation.randomPhase
            ? Math.floor(Math.random() * animation.frameCount)
            : 0;
        setFrameIndex(startFrameRef.current);
    }, [animation]);

    useEffect(() => {
        if (!active) return;

        const frameMs = 1000 / animation.fps;
        const startFrame = startFrameRef.current;
        let timeoutId: ReturnType<typeof setTimeout>;
        let cancelled = false;

        function schedule(nextFrame: number, delay: number) {
            timeoutId = setTimeout(() => {
                if (cancelled) return;

                if (nextFrame >= animation.frameCount) {
                    // End of one loop cycle — restart from frame 0
                    if (animation.loop) {
                        setFrameIndex(0);
                        schedule(1, frameMs);
                    } else {
                        onCompleteRef.current?.();
                        // hold last frame — no further scheduling
                    }
                } else {
                    setFrameIndex(nextFrame);
                    // If this is the last frame and we loop, add loopDelay before restarting
                    const isLast = nextFrame === animation.frameCount - 1;
                    const nextDelay = isLast && animation.loop
                        ? frameMs + (animation.loopDelay ?? 0)
                        : frameMs;
                    schedule(nextFrame + 1, nextDelay);
                }
            }, delay);
        }

        // Begin scheduling from the frame after startFrame.
        if (startFrame + 1 >= animation.frameCount) {
            // startFrame is already the last frame
            if (animation.loop) {
                schedule(0, frameMs + (animation.loopDelay ?? 0));
            } else {
                onCompleteRef.current?.();
            }
        } else {
            schedule(startFrame + 1, frameMs);
        }

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [animation, active]);

    return frameIndex;
}
