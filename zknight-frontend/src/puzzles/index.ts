import type {Puzzle} from '../game/types';
import puzzle01 from './puzzle_01';
import puzzle02 from './puzzle_02';
import puzzle03 from './puzzle_03';
import puzzle04 from './puzzle_04';
import puzzle05 from './puzzle_05';
import puzzle06 from './puzzle_06';
import puzzle07 from './puzzle_07';
import puzzle08 from './puzzle_08';
import puzzle09 from './puzzle_09';
import puzzle10 from './puzzle_10';

export const PUZZLES: Puzzle[] = [
    puzzle01,
    puzzle02,
    puzzle03,
    puzzle04,
    puzzle05,
    puzzle06,
    puzzle07,
    puzzle08,
    puzzle09,
    puzzle10,
];

export function getPuzzleById(id: string): Puzzle | undefined {
    return PUZZLES.find((p) => p.id === id);
}
