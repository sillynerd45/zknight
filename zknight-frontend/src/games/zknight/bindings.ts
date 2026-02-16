import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBSATERYTZLETTTBYRAC4SQ2M2F4V2T3HL45DYHGE6UILARWOGQF65ED",
  }
} as const

export const Errors = {
  1: {message:"GameNotFound"},
  2: {message:"GameNotWaiting"},
  3: {message:"WrongStatus"},
  4: {message:"CannotPlayYourself"},
  5: {message:"GameExpired"},
  6: {message:"AlreadyHasActiveGame"},
  10: {message:"PuzzleNotFound"},
  11: {message:"InvalidPuzzleId"},
  20: {message:"NoCommitment"},
  21: {message:"BadPreimage"},
  22: {message:"AlreadyCommitted"},
  30: {message:"InvalidProof"},
  40: {message:"TooEarly"},
  41: {message:"YouDidNotCommit"},
  42: {message:"OpponentAlreadyRevealed"},
  43: {message:"NoCommitTime"},
  50: {message:"Unauthorized"}
}


export interface Position {
  x: u32;
  y: u32;
}


export interface MovingBarrel {
  path: Array<Position>;
  path_length: u32;
}


export interface Puzzle {
  grid_height: u32;
  grid_width: u32;
  id: u32;
  knight_a_start: Position;
  knight_b_start: Position;
  max_ticks: u32;
  min_ticks: u32;
  moving_barrels: Array<MovingBarrel>;
  puzzle_hash: Buffer;
  static_tnt: Array<Position>;
  walls: Array<Position>;
}

export type GameStatus = {tag: "WaitingForPlayer", values: void} | {tag: "Active", values: void} | {tag: "Committing", values: void} | {tag: "Finished", values: void} | {tag: "Cancelled", values: void} | {tag: "Expired", values: void};


export interface Game {
  commit_time: Option<u64>;
  created_at: u64;
  id: u32;
  p1_commit_time: Option<u64>;
  p1_commitment: Option<Buffer>;
  p1_committed: boolean;
  p1_tick_count: Option<u32>;
  p2_commit_time: Option<u64>;
  p2_commitment: Option<Buffer>;
  p2_committed: boolean;
  p2_tick_count: Option<u32>;
  player1: string;
  player2: Option<string>;
  puzzle_id: Option<u32>;
  status: GameStatus;
  winner: Option<string>;
}

export type DataKey = {tag: "Game", values: readonly [u32]} | {tag: "Puzzle", values: readonly [u32]} | {tag: "GameCounter", values: void} | {tag: "PuzzleCounter", values: void} | {tag: "PuzzleIndex", values: readonly [u32]} | {tag: "PlayerActiveGame", values: readonly [string]} | {tag: "GameHubAddress", values: void} | {tag: "Admin", values: void};

export interface Client {
  /**
   * Construct and simulate a add_puzzle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add a new puzzle to the contract
   * 
   * # Arguments
   * * `puzzle` - The puzzle to add (id will be assigned automatically)
   * 
   * # Returns
   * * The assigned puzzle ID
   */
  add_puzzle: ({puzzle}: {puzzle: Puzzle}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a remove_puzzle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove a puzzle from the contract
   * 
   * # Arguments
   * * `puzzle_id` - The ID of the puzzle to remove
   * 
   * # Note
   * This doesn't actually delete the puzzle, it just marks it as removed
   * by not being accessible via get_puzzle_by_index.
   * Existing games using this puzzle can still complete.
   */
  remove_puzzle: ({puzzle_id}: {puzzle_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_puzzle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a puzzle by ID
   */
  get_puzzle: ({puzzle_id}: {puzzle_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Puzzle>>>

  /**
   * Construct and simulate a get_puzzle_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the total number of puzzles
   */
  get_puzzle_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a create_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new game (waiting for player 2)
   * 
   * # Arguments
   * * `player1` - Address of the game creator
   * 
   * # Returns
   * * The new game ID
   */
  create_game: ({player1}: {player1: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a cancel_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a game (only while waiting for player 2)
   * 
   * # Arguments
   * * `game_id` - The ID of the game to cancel
   * * `player1` - Address of the game creator (must match)
   */
  cancel_game: ({game_id, player1}: {game_id: u32, player1: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a join_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Join a game as player 2
   * 
   * This function:
   * 1. Adds player2 to the game
   * 2. Selects a random puzzle via PRNG
   * 3. Returns the full Puzzle struct for immediate rendering
   * 
   * # Arguments
   * * `game_id` - The ID of the game to join
   * * `player2` - Address of the joining player
   * 
   * # Returns
   * * The selected Puzzle struct
   */
  join_game: ({game_id, player2}: {game_id: u32, player2: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Puzzle>>>

  /**
   * Construct and simulate a commit_solve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Commit a solution (timestamp-locked commitment)
   * 
   * Players call this immediately upon solving the puzzle,
   * before generating the ZK proof.
   * 
   * # Arguments
   * * `game_id` - The ID of the game
   * * `player` - Address of the committing player
   * * `commitment` - SHA256 hash of the preimage
   */
  commit_solve: ({game_id, player, commitment}: {game_id: u32, player: string, commitment: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a reveal_solve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reveal and verify a solution with ZK proof
   * 
   * This function:
   * 1. Verifies the preimage matches the commitment
   * 2. Reconstructs public inputs from the stored puzzle
   * 3. Verifies the Groth16 proof
   * 4. Records the tick count
   * 5. Determines the winner if both players have revealed
   * 6. Reports the game result to Game Hub
   * 
   * # Arguments
   * * `game_id` - The ID of the game
   * * `player` - Address of the revealing player
   * * `preimage` - Preimage of the commitment (32 random bytes)
   * * `proof` - 256-byte Groth16 proof
   * * `tick_count` - Number of ticks in the solution (<= 512)
   */
  reveal_solve: ({game_id, player, preimage, proof, tick_count}: {game_id: u32, player: string, preimage: Buffer, proof: Buffer, tick_count: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_timeout_win transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim a timeout win (10-minute default win if opponent doesn't reveal)
   * 
   * # Arguments
   * * `game_id` - The ID of the game
   * * `claimer` - Address of the player claiming the win
   */
  claim_timeout_win: ({game_id, claimer}: {game_id: u32, claimer: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get game information
   */
  get_game: ({game_id}: {game_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Game>>>

  /**
   * Construct and simulate a get_open_games transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all open games (waiting for player 2)
   * 
   * Returns full Game objects so the frontend can display
   * player info, creation time, etc. without extra calls.
   */
  get_open_games: (options?: MethodOptions) => Promise<AssembledTransaction<Array<Game>>>

  /**
   * Construct and simulate a get_game_result transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the winner of a game (if finished)
   */
  get_game_result: ({game_id}: {game_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_player_active_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the active WaitingForPlayer game ID for a player (if any)
   * 
   * Returns the game ID if the player has a WaitingForPlayer game.
   * Returns None if the player has no active game, or if their active
   * game is already Active/Committing/Finished.
   * 
   * Useful for frontend to check if player needs to cancel before creating.
   */
  get_player_active_game: ({player}: {player: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<u32>>>

  /**
   * Construct and simulate a check_and_expire_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Check if a WaitingForPlayer game has expired (>1 hour old) and auto-expire it
   * 
   * If the game is WaitingForPlayer and more than 1 hour old:
   * - Sets status to Expired
   * - Releases player1's active game lock
   * - Returns true
   * 
   * Otherwise returns false (game doesn't exist, not WaitingForPlayer, or not expired yet).
   * 
   * This function can be called by anyone before attempting to join a game.
   * Frontend should call this before join_game() to clean up stale games.
   */
  check_and_expire_game: ({game_id}: {game_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current admin address
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new admin address
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_hub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get the current GameHub contract address
   */
  get_hub: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_hub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set a new GameHub contract address
   */
  set_hub: ({new_hub}: {new_hub: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade the contract WASM
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, game_hub}: {admin: string, game_hub: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, game_hub}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAEQAAAAAAAAAMR2FtZU5vdEZvdW5kAAAAAQAAAAAAAAAOR2FtZU5vdFdhaXRpbmcAAAAAAAIAAAAAAAAAC1dyb25nU3RhdHVzAAAAAAMAAAAAAAAAEkNhbm5vdFBsYXlZb3Vyc2VsZgAAAAAABAAAAAAAAAALR2FtZUV4cGlyZWQAAAAABQAAAAAAAAAUQWxyZWFkeUhhc0FjdGl2ZUdhbWUAAAAGAAAAAAAAAA5QdXp6bGVOb3RGb3VuZAAAAAAACgAAAAAAAAAPSW52YWxpZFB1enpsZUlkAAAAAAsAAAAAAAAADE5vQ29tbWl0bWVudAAAABQAAAAAAAAAC0JhZFByZWltYWdlAAAAABUAAAAAAAAAEEFscmVhZHlDb21taXR0ZWQAAAAWAAAAAAAAAAxJbnZhbGlkUHJvb2YAAAAeAAAAAAAAAAhUb29FYXJseQAAACgAAAAAAAAAD1lvdURpZE5vdENvbW1pdAAAAAApAAAAAAAAABdPcHBvbmVudEFscmVhZHlSZXZlYWxlZAAAAAAqAAAAAAAAAAxOb0NvbW1pdFRpbWUAAAArAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAy",
        "AAAAAQAAAAAAAAAAAAAACFBvc2l0aW9uAAAAAgAAAAAAAAABeAAAAAAAAAQAAAAAAAAAAXkAAAAAAAAE",
        "AAAAAQAAAAAAAAAAAAAADE1vdmluZ0JhcnJlbAAAAAIAAAAAAAAABHBhdGgAAAPqAAAH0AAAAAhQb3NpdGlvbgAAAAAAAAALcGF0aF9sZW5ndGgAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAABlB1enpsZQAAAAAACwAAAAAAAAALZ3JpZF9oZWlnaHQAAAAABAAAAAAAAAAKZ3JpZF93aWR0aAAAAAAABAAAAAAAAAACaWQAAAAAAAQAAAAAAAAADmtuaWdodF9hX3N0YXJ0AAAAAAfQAAAACFBvc2l0aW9uAAAAAAAAAA5rbmlnaHRfYl9zdGFydAAAAAAH0AAAAAhQb3NpdGlvbgAAAAAAAAAJbWF4X3RpY2tzAAAAAAAABAAAAAAAAAAJbWluX3RpY2tzAAAAAAAABAAAAAAAAAAObW92aW5nX2JhcnJlbHMAAAAAA+oAAAfQAAAADE1vdmluZ0JhcnJlbAAAAAAAAAALcHV6emxlX2hhc2gAAAAD7gAAACAAAAAAAAAACnN0YXRpY190bnQAAAAAA+oAAAfQAAAACFBvc2l0aW9uAAAAAAAAAAV3YWxscwAAAAAAA+oAAAfQAAAACFBvc2l0aW9u",
        "AAAAAgAAAAAAAAAAAAAACkdhbWVTdGF0dXMAAAAAAAYAAAAAAAAAAAAAABBXYWl0aW5nRm9yUGxheWVyAAAAAAAAAAAAAAAGQWN0aXZlAAAAAAAAAAAAAAAAAApDb21taXR0aW5nAAAAAAAAAAAAAAAAAAhGaW5pc2hlZAAAAAAAAAAAAAAACUNhbmNlbGxlZAAAAAAAAAAAAAAAAAAAB0V4cGlyZWQA",
        "AAAAAQAAAAAAAAAAAAAABEdhbWUAAAAQAAAAAAAAAAtjb21taXRfdGltZQAAAAPoAAAABgAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAACaWQAAAAAAAQAAAAAAAAADnAxX2NvbW1pdF90aW1lAAAAAAPoAAAABgAAAAAAAAANcDFfY29tbWl0bWVudAAAAAAAA+gAAAPuAAAAIAAAAAAAAAAMcDFfY29tbWl0dGVkAAAAAQAAAAAAAAANcDFfdGlja19jb3VudAAAAAAAA+gAAAAEAAAAAAAAAA5wMl9jb21taXRfdGltZQAAAAAD6AAAAAYAAAAAAAAADXAyX2NvbW1pdG1lbnQAAAAAAAPoAAAD7gAAACAAAAAAAAAADHAyX2NvbW1pdHRlZAAAAAEAAAAAAAAADXAyX3RpY2tfY291bnQAAAAAAAPoAAAABAAAAAAAAAAHcGxheWVyMQAAAAATAAAAAAAAAAdwbGF5ZXIyAAAAA+gAAAATAAAAAAAAAAlwdXp6bGVfaWQAAAAAAAPoAAAABAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAACkdhbWVTdGF0dXMAAAAAAAAAAAAGd2lubmVyAAAAAAPoAAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACAAAAAEAAAAAAAAABEdhbWUAAAABAAAABAAAAAEAAAAAAAAABlB1enpsZQAAAAAAAQAAAAQAAAAAAAAAAAAAAAtHYW1lQ291bnRlcgAAAAAAAAAAAAAAAA1QdXp6bGVDb3VudGVyAAAAAAAAAQAAAAAAAAALUHV6emxlSW5kZXgAAAAAAQAAAAQAAAABAAAAAAAAABBQbGF5ZXJBY3RpdmVHYW1lAAAAAQAAABMAAAAAAAAAAAAAAA5HYW1lSHViQWRkcmVzcwAAAAAAAAAAAAAAAAAFQWRtaW4AAAA=",
        "AAAAAAAAALZJbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIEdhbWVIdWIgYWRkcmVzcyBhbmQgYWRtaW4KCiMgQXJndW1lbnRzCiogYGFkbWluYCAtIEFkbWluIGFkZHJlc3MgKGNhbiBtYW5hZ2UgcHV6emxlcyBhbmQgdXBncmFkZSBjb250cmFjdCkKKiBgZ2FtZV9odWJgIC0gQWRkcmVzcyBvZiB0aGUgR2FtZUh1YiBjb250cmFjdAAAAAAADV9fY29uc3RydWN0b3IAAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACGdhbWVfaHViAAAAEwAAAAA=",
        "AAAAAAAAAJRBZGQgYSBuZXcgcHV6emxlIHRvIHRoZSBjb250cmFjdAoKIyBBcmd1bWVudHMKKiBgcHV6emxlYCAtIFRoZSBwdXp6bGUgdG8gYWRkIChpZCB3aWxsIGJlIGFzc2lnbmVkIGF1dG9tYXRpY2FsbHkpCgojIFJldHVybnMKKiBUaGUgYXNzaWduZWQgcHV6emxlIElEAAAACmFkZF9wdXp6bGUAAAAAAAEAAAAAAAAABnB1enpsZQAAAAAH0AAAAAZQdXp6bGUAAAAAAAEAAAPpAAAABAAAAAM=",
        "AAAAAAAAARBSZW1vdmUgYSBwdXp6bGUgZnJvbSB0aGUgY29udHJhY3QKCiMgQXJndW1lbnRzCiogYHB1enpsZV9pZGAgLSBUaGUgSUQgb2YgdGhlIHB1enpsZSB0byByZW1vdmUKCiMgTm90ZQpUaGlzIGRvZXNuJ3QgYWN0dWFsbHkgZGVsZXRlIHRoZSBwdXp6bGUsIGl0IGp1c3QgbWFya3MgaXQgYXMgcmVtb3ZlZApieSBub3QgYmVpbmcgYWNjZXNzaWJsZSB2aWEgZ2V0X3B1enpsZV9ieV9pbmRleC4KRXhpc3RpbmcgZ2FtZXMgdXNpbmcgdGhpcyBwdXp6bGUgY2FuIHN0aWxsIGNvbXBsZXRlLgAAAA1yZW1vdmVfcHV6emxlAAAAAAAAAQAAAAAAAAAJcHV6emxlX2lkAAAAAAAABAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAABJHZXQgYSBwdXp6bGUgYnkgSUQAAAAAAApnZXRfcHV6emxlAAAAAAABAAAAAAAAAAlwdXp6bGVfaWQAAAAAAAAEAAAAAQAAA+kAAAfQAAAABlB1enpsZQAAAAAAAw==",
        "AAAAAAAAAB9HZXQgdGhlIHRvdGFsIG51bWJlciBvZiBwdXp6bGVzAAAAABBnZXRfcHV6emxlX2NvdW50AAAAAAAAAAEAAAAE",
        "AAAAAAAAAHxDcmVhdGUgYSBuZXcgZ2FtZSAod2FpdGluZyBmb3IgcGxheWVyIDIpCgojIEFyZ3VtZW50cwoqIGBwbGF5ZXIxYCAtIEFkZHJlc3Mgb2YgdGhlIGdhbWUgY3JlYXRvcgoKIyBSZXR1cm5zCiogVGhlIG5ldyBnYW1lIElEAAAAC2NyZWF0ZV9nYW1lAAAAAAEAAAAAAAAAB3BsYXllcjEAAAAAEwAAAAEAAAPpAAAABAAAAAM=",
        "AAAAAAAAAJ5DYW5jZWwgYSBnYW1lIChvbmx5IHdoaWxlIHdhaXRpbmcgZm9yIHBsYXllciAyKQoKIyBBcmd1bWVudHMKKiBgZ2FtZV9pZGAgLSBUaGUgSUQgb2YgdGhlIGdhbWUgdG8gY2FuY2VsCiogYHBsYXllcjFgIC0gQWRkcmVzcyBvZiB0aGUgZ2FtZSBjcmVhdG9yIChtdXN0IG1hdGNoKQAAAAAAC2NhbmNlbF9nYW1lAAAAAAIAAAAAAAAAB2dhbWVfaWQAAAAABAAAAAAAAAAHcGxheWVyMQAAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAStKb2luIGEgZ2FtZSBhcyBwbGF5ZXIgMgoKVGhpcyBmdW5jdGlvbjoKMS4gQWRkcyBwbGF5ZXIyIHRvIHRoZSBnYW1lCjIuIFNlbGVjdHMgYSByYW5kb20gcHV6emxlIHZpYSBQUk5HCjMuIFJldHVybnMgdGhlIGZ1bGwgUHV6emxlIHN0cnVjdCBmb3IgaW1tZWRpYXRlIHJlbmRlcmluZwoKIyBBcmd1bWVudHMKKiBgZ2FtZV9pZGAgLSBUaGUgSUQgb2YgdGhlIGdhbWUgdG8gam9pbgoqIGBwbGF5ZXIyYCAtIEFkZHJlc3Mgb2YgdGhlIGpvaW5pbmcgcGxheWVyCgojIFJldHVybnMKKiBUaGUgc2VsZWN0ZWQgUHV6emxlIHN0cnVjdAAAAAAJam9pbl9nYW1lAAAAAAAAAgAAAAAAAAAHZ2FtZV9pZAAAAAAEAAAAAAAAAAdwbGF5ZXIyAAAAABMAAAABAAAD6QAAB9AAAAAGUHV6emxlAAAAAAAD",
        "AAAAAAAAARBDb21taXQgYSBzb2x1dGlvbiAodGltZXN0YW1wLWxvY2tlZCBjb21taXRtZW50KQoKUGxheWVycyBjYWxsIHRoaXMgaW1tZWRpYXRlbHkgdXBvbiBzb2x2aW5nIHRoZSBwdXp6bGUsCmJlZm9yZSBnZW5lcmF0aW5nIHRoZSBaSyBwcm9vZi4KCiMgQXJndW1lbnRzCiogYGdhbWVfaWRgIC0gVGhlIElEIG9mIHRoZSBnYW1lCiogYHBsYXllcmAgLSBBZGRyZXNzIG9mIHRoZSBjb21taXR0aW5nIHBsYXllcgoqIGBjb21taXRtZW50YCAtIFNIQTI1NiBoYXNoIG9mIHRoZSBwcmVpbWFnZQAAAAxjb21taXRfc29sdmUAAAADAAAAAAAAAAdnYW1lX2lkAAAAAAQAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAKY29tbWl0bWVudAAAAAAD7gAAACAAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAilSZXZlYWwgYW5kIHZlcmlmeSBhIHNvbHV0aW9uIHdpdGggWksgcHJvb2YKClRoaXMgZnVuY3Rpb246CjEuIFZlcmlmaWVzIHRoZSBwcmVpbWFnZSBtYXRjaGVzIHRoZSBjb21taXRtZW50CjIuIFJlY29uc3RydWN0cyBwdWJsaWMgaW5wdXRzIGZyb20gdGhlIHN0b3JlZCBwdXp6bGUKMy4gVmVyaWZpZXMgdGhlIEdyb3RoMTYgcHJvb2YKNC4gUmVjb3JkcyB0aGUgdGljayBjb3VudAo1LiBEZXRlcm1pbmVzIHRoZSB3aW5uZXIgaWYgYm90aCBwbGF5ZXJzIGhhdmUgcmV2ZWFsZWQKNi4gUmVwb3J0cyB0aGUgZ2FtZSByZXN1bHQgdG8gR2FtZSBIdWIKCiMgQXJndW1lbnRzCiogYGdhbWVfaWRgIC0gVGhlIElEIG9mIHRoZSBnYW1lCiogYHBsYXllcmAgLSBBZGRyZXNzIG9mIHRoZSByZXZlYWxpbmcgcGxheWVyCiogYHByZWltYWdlYCAtIFByZWltYWdlIG9mIHRoZSBjb21taXRtZW50ICgzMiByYW5kb20gYnl0ZXMpCiogYHByb29mYCAtIDI1Ni1ieXRlIEdyb3RoMTYgcHJvb2YKKiBgdGlja19jb3VudGAgLSBOdW1iZXIgb2YgdGlja3MgaW4gdGhlIHNvbHV0aW9uICg8PSA1MTIpAAAAAAAADHJldmVhbF9zb2x2ZQAAAAUAAAAAAAAAB2dhbWVfaWQAAAAABAAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAhwcmVpbWFnZQAAA+4AAAAgAAAAAAAAAAVwcm9vZgAAAAAAAA4AAAAAAAAACnRpY2tfY291bnQAAAAAAAQAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAKlDbGFpbSBhIHRpbWVvdXQgd2luICgxMC1taW51dGUgZGVmYXVsdCB3aW4gaWYgb3Bwb25lbnQgZG9lc24ndCByZXZlYWwpCgojIEFyZ3VtZW50cwoqIGBnYW1lX2lkYCAtIFRoZSBJRCBvZiB0aGUgZ2FtZQoqIGBjbGFpbWVyYCAtIEFkZHJlc3Mgb2YgdGhlIHBsYXllciBjbGFpbWluZyB0aGUgd2luAAAAAAAAEWNsYWltX3RpbWVvdXRfd2luAAAAAAAAAgAAAAAAAAAHZ2FtZV9pZAAAAAAEAAAAAAAAAAdjbGFpbWVyAAAAABMAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAABRHZXQgZ2FtZSBpbmZvcm1hdGlvbgAAAAhnZXRfZ2FtZQAAAAEAAAAAAAAAB2dhbWVfaWQAAAAABAAAAAEAAAPpAAAH0AAAAARHYW1lAAAAAw==",
        "AAAAAAAAAJZHZXQgYWxsIG9wZW4gZ2FtZXMgKHdhaXRpbmcgZm9yIHBsYXllciAyKQoKUmV0dXJucyBmdWxsIEdhbWUgb2JqZWN0cyBzbyB0aGUgZnJvbnRlbmQgY2FuIGRpc3BsYXkKcGxheWVyIGluZm8sIGNyZWF0aW9uIHRpbWUsIGV0Yy4gd2l0aG91dCBleHRyYSBjYWxscy4AAAAAAA5nZXRfb3Blbl9nYW1lcwAAAAAAAAAAAAEAAAPqAAAH0AAAAARHYW1l",
        "AAAAAAAAACZHZXQgdGhlIHdpbm5lciBvZiBhIGdhbWUgKGlmIGZpbmlzaGVkKQAAAAAAD2dldF9nYW1lX3Jlc3VsdAAAAAABAAAAAAAAAAdnYW1lX2lkAAAAAAQAAAABAAAD6AAAABM=",
        "AAAAAAAAATRHZXQgdGhlIGFjdGl2ZSBXYWl0aW5nRm9yUGxheWVyIGdhbWUgSUQgZm9yIGEgcGxheWVyIChpZiBhbnkpCgpSZXR1cm5zIHRoZSBnYW1lIElEIGlmIHRoZSBwbGF5ZXIgaGFzIGEgV2FpdGluZ0ZvclBsYXllciBnYW1lLgpSZXR1cm5zIE5vbmUgaWYgdGhlIHBsYXllciBoYXMgbm8gYWN0aXZlIGdhbWUsIG9yIGlmIHRoZWlyIGFjdGl2ZQpnYW1lIGlzIGFscmVhZHkgQWN0aXZlL0NvbW1pdHRpbmcvRmluaXNoZWQuCgpVc2VmdWwgZm9yIGZyb250ZW5kIHRvIGNoZWNrIGlmIHBsYXllciBuZWVkcyB0byBjYW5jZWwgYmVmb3JlIGNyZWF0aW5nLgAAABZnZXRfcGxheWVyX2FjdGl2ZV9nYW1lAAAAAAABAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAD6AAAAAQ=",
        "AAAAAAAAAb5DaGVjayBpZiBhIFdhaXRpbmdGb3JQbGF5ZXIgZ2FtZSBoYXMgZXhwaXJlZCAoPjEgaG91ciBvbGQpIGFuZCBhdXRvLWV4cGlyZSBpdAoKSWYgdGhlIGdhbWUgaXMgV2FpdGluZ0ZvclBsYXllciBhbmQgbW9yZSB0aGFuIDEgaG91ciBvbGQ6Ci0gU2V0cyBzdGF0dXMgdG8gRXhwaXJlZAotIFJlbGVhc2VzIHBsYXllcjEncyBhY3RpdmUgZ2FtZSBsb2NrCi0gUmV0dXJucyB0cnVlCgpPdGhlcndpc2UgcmV0dXJucyBmYWxzZSAoZ2FtZSBkb2Vzbid0IGV4aXN0LCBub3QgV2FpdGluZ0ZvclBsYXllciwgb3Igbm90IGV4cGlyZWQgeWV0KS4KClRoaXMgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZCBieSBhbnlvbmUgYmVmb3JlIGF0dGVtcHRpbmcgdG8gam9pbiBhIGdhbWUuCkZyb250ZW5kIHNob3VsZCBjYWxsIHRoaXMgYmVmb3JlIGpvaW5fZ2FtZSgpIHRvIGNsZWFuIHVwIHN0YWxlIGdhbWVzLgAAAAAAFWNoZWNrX2FuZF9leHBpcmVfZ2FtZQAAAAAAAAEAAAAAAAAAB2dhbWVfaWQAAAAABAAAAAEAAAAB",
        "AAAAAAAAAB1HZXQgdGhlIGN1cnJlbnQgYWRtaW4gYWRkcmVzcwAAAAAAAAlnZXRfYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAABdTZXQgYSBuZXcgYWRtaW4gYWRkcmVzcwAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAChHZXQgdGhlIGN1cnJlbnQgR2FtZUh1YiBjb250cmFjdCBhZGRyZXNzAAAAB2dldF9odWIAAAAAAAAAAAEAAAAT",
        "AAAAAAAAACJTZXQgYSBuZXcgR2FtZUh1YiBjb250cmFjdCBhZGRyZXNzAAAAAAAHc2V0X2h1YgAAAAABAAAAAAAAAAduZXdfaHViAAAAABMAAAAA",
        "AAAAAAAAABlVcGdyYWRlIHRoZSBjb250cmFjdCBXQVNNAAAAAAAAB3VwZ3JhZGUAAAAAAQAAAAAAAAANbmV3X3dhc21faGFzaAAAAAAAA+4AAAAgAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    add_puzzle: this.txFromJSON<Result<u32>>,
        remove_puzzle: this.txFromJSON<Result<void>>,
        get_puzzle: this.txFromJSON<Result<Puzzle>>,
        get_puzzle_count: this.txFromJSON<u32>,
        create_game: this.txFromJSON<Result<u32>>,
        cancel_game: this.txFromJSON<Result<void>>,
        join_game: this.txFromJSON<Result<Puzzle>>,
        commit_solve: this.txFromJSON<Result<void>>,
        reveal_solve: this.txFromJSON<Result<void>>,
        claim_timeout_win: this.txFromJSON<Result<void>>,
        get_game: this.txFromJSON<Result<Game>>,
        get_open_games: this.txFromJSON<Array<Game>>,
        get_game_result: this.txFromJSON<Option<string>>,
        get_player_active_game: this.txFromJSON<Option<u32>>,
        check_and_expire_game: this.txFromJSON<boolean>,
        get_admin: this.txFromJSON<string>,
        set_admin: this.txFromJSON<null>,
        get_hub: this.txFromJSON<string>,
        set_hub: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>
  }
}