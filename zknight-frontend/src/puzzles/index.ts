import type {Puzzle} from '../game/types';
import puzzle01 from './puzzle_01';
import puzzle02 from './puzzle_02';

export const PUZZLES: Puzzle[] = [puzzle01, puzzle02];

export function getPuzzleById(id: string): Puzzle | undefined {
    return PUZZLES.find((p) => p.id === id);
}
