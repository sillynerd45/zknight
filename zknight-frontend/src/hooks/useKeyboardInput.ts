import { useEffect, useRef } from 'react';
import { DIRECTION_MAP } from '@/game/directionMap';
import { DIRECTION_TO_MOVE } from '@/game/types';
import type { Direction } from '@/game/types';
import type { GameAction } from '@/game/gameReducer';
import { useGameContext } from '@/context/GameContext';

const WASD_MAP: Record<string, Direction> = {
  w: 'ArrowUp',
  a: 'ArrowLeft',
  s: 'ArrowDown',
  d: 'ArrowRight',
  W: 'ArrowUp',
  A: 'ArrowLeft',
  S: 'ArrowDown',
  D: 'ArrowRight',
};

const MOVE_COOLDOWN_MS = 600;

export function useKeyboardInput() {
  const { state, dispatch, scheduleNoOpTick } = useGameContext();
  const isAnimatingRef = useRef(false);
  const statusRef = useRef(state.gameStatus);
  const pressedKeysRef = useRef(new Set<string>());
  statusRef.current = state.gameStatus;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') return;
      if (isAnimatingRef.current) return;

      // Ignore if key is already pressed (key repeat)
      if (pressedKeysRef.current.has(e.key)) return;

      // Map key to Direction
      const direction: Direction | undefined =
        (e.key as Direction) in DIRECTION_MAP
          ? (e.key as Direction)
          : WASD_MAP[e.key];

      if (!direction) return;

      e.preventDefault();

      pressedKeysRef.current.add(e.key);
      isAnimatingRef.current = true;

      // Dispatch tick immediately (no lag)
      const move = DIRECTION_TO_MOVE[direction];
      dispatch({ type: 'TICK', move, direction });

      // Reset the NoOp timer (next NoOp in 600ms from now)
      scheduleNoOpTick();

      // Animation cooldown
      setTimeout(() => {
        dispatch({ type: 'IDLE' });
        isAnimatingRef.current = false;
      }, MOVE_COOLDOWN_MS);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, scheduleNoOpTick]);
}
