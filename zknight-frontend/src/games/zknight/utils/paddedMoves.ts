/**
 * Convert tick history to circuit input format
 *
 * The ZK circuit expects:
 * - An array of 512 move values (0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp)
 * - Padded with NoOp (4) to fill 512 ticks
 *
 * The frontend tracks tickHistory which is an array of MoveValue (0-4).
 * This utility pads it to 512 entries for circuit input.
 */

import type { MoveValue } from '@/game/types';

/** NoOp move value for padding */
const NO_OP: MoveValue = 4;

/**
 * Pad move history to circuit's expected length (512 ticks)
 *
 * @param tickHistory - Array of MoveValue entries from gameplay (already encoded as 0-4)
 * @param maxTicks - Circuit's maximum tick count (default: 512)
 * @returns Array of 512 integers ready for circuit input
 */
export function padMoveHistory(
  tickHistory: MoveValue[],
  maxTicks: number = 512
): number[] {
  if (tickHistory.length > maxTicks) {
    throw new Error(
      `Tick history exceeds maximum: ${tickHistory.length} > ${maxTicks}`
    );
  }

  // MoveValue is already encoded as 0-4, just copy and pad
  const padded = [...tickHistory];

  // Pad with NoOp (4) to reach maxTicks
  while (padded.length < maxTicks) {
    padded.push(NO_OP);
  }

  return padded;
}

/**
 * Validate padded move array
 * Ensures all values are valid move encodings (0-4)
 */
export function validatePaddedMoves(moves: number[]): boolean {
  if (moves.length !== 512) {
    return false;
  }

  for (const move of moves) {
    if (move < 0 || move > 4 || !Number.isInteger(move)) {
      return false;
    }
  }

  return true;
}

/**
 * Extract actual tick count from padded moves
 * Finds the last non-NoOp move
 */
export function extractTickCount(paddedMoves: number[]): number {
  for (let i = paddedMoves.length - 1; i >= 0; i--) {
    if (paddedMoves[i] !== NO_OP) {
      return i + 1;  // +1 because index is 0-based
    }
  }
  return 0;  // All NoOps (shouldn't happen in practice)
}
