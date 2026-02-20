import {useEffect, useRef} from 'react';

type MusicTrack = 'lobby' | 'game' | null;

const FADE_MS = 1000;
const TICK_MS = 50;
const TARGET_VOLUME = 0.25;

function trackForView(view: 'lobby' | 'game' | 'editor'): MusicTrack {
    if (view === 'lobby') return 'lobby';
    if (view === 'game') return 'game';
    return null; // editor → silence
}

/**
 * Plays looping background music based on the current game view.
 * - lobby  → /music/lobby_music.m4a
 * - game   → /music/game_music.m4a
 * - editor → silence
 *
 * Audio is deferred until the first user interaction (click or keydown)
 * to satisfy browser autoplay policies. Transitions between tracks fade
 * over FADE_MS milliseconds.
 */
export function useMusic(view: 'lobby' | 'game' | 'editor') {
    const s = useRef<{
        lobby: HTMLAudioElement | null;
        game: HTMLAudioElement | null;
        unlocked: boolean;
        active: MusicTrack;
        desired: MusicTrack;
        outTimer: ReturnType<typeof setInterval> | null;
        inTimer: ReturnType<typeof setInterval> | null;
    }>({
        lobby: null,
        game: null,
        unlocked: false,
        active: null,
        desired: null,
        outTimer: null,
        inTimer: null,
    });

    // Holds the stable transition function once audio is initialized.
    const transitionRef = useRef<(target: MusicTrack) => void>(() => {
    });

    // Initialize audio elements and register the one-time unlock listener.
    useEffect(() => {
        const state = s.current;

        state.lobby = new Audio('/music/lobby_music.m4a');
        state.lobby.loop = true;
        state.lobby.volume = 0;

        state.game = new Audio('/music/game_music.m4a');
        state.game.loop = true;
        state.game.volume = 0;

        const getAudio = (track: MusicTrack): HTMLAudioElement | null => {
            if (track === 'lobby') return state.lobby;
            if (track === 'game') return state.game;
            return null;
        };

        const clearFades = () => {
            if (state.outTimer) {
                clearInterval(state.outTimer);
                state.outTimer = null;
            }
            if (state.inTimer) {
                clearInterval(state.inTimer);
                state.inTimer = null;
            }
        };

        const fadeIn = (audio: HTMLAudioElement) => {
            audio.volume = 0;
            audio.play().catch(() => {
            });
            const steps = FADE_MS / TICK_MS;
            state.inTimer = setInterval(() => {
                audio.volume = Math.min(TARGET_VOLUME, audio.volume + TARGET_VOLUME / steps);
                if (audio.volume >= TARGET_VOLUME) {
                    if (state.inTimer) {
                        clearInterval(state.inTimer);
                        state.inTimer = null;
                    }
                }
            }, TICK_MS);
        };

        const fadeOut = (audio: HTMLAudioElement, then: () => void) => {
            const start = Math.max(audio.volume, 0.01);
            const steps = FADE_MS / TICK_MS;
            state.outTimer = setInterval(() => {
                audio.volume = Math.max(0, audio.volume - start / steps);
                if (audio.volume <= 0) {
                    if (state.outTimer) {
                        clearInterval(state.outTimer);
                        state.outTimer = null;
                    }
                    audio.pause();
                    then();
                }
            }, TICK_MS);
        };

        const transition = (target: MusicTrack) => {
            if (state.active === target) return;
            clearFades();
            const prev = getAudio(state.active);
            const next = getAudio(target);
            state.active = target;
            if (prev && !prev.paused) {
                fadeOut(prev, () => {
                    if (next) fadeIn(next);
                });
            } else {
                if (prev) {
                    prev.pause();
                    prev.volume = 0;
                }
                if (next) fadeIn(next);
            }
        };

        transitionRef.current = transition;

        const unlock = () => {
            if (state.unlocked) return;
            state.unlocked = true;
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
            transition(state.desired);
        };

        document.addEventListener('click', unlock);
        document.addEventListener('keydown', unlock);

        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
            clearFades();
            state.lobby?.pause();
            state.game?.pause();
        };
    }, []);

    // React to view changes: update desired track and transition if already unlocked.
    useEffect(() => {
        const state = s.current;
        const target = trackForView(view);
        state.desired = target;
        if (state.unlocked) {
            transitionRef.current(target);
        }
    }, [view]);
}
