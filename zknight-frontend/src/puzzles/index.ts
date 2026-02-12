import type { Puzzle } from '../game/types';
import puzzle01 from './puzzle_01';

export const PUZZLES: Puzzle[] = [puzzle01];

export function getPuzzleById(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}
