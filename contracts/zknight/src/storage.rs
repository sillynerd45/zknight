//! Storage helpers for ZKnight contract

use crate::errors::Error;
use crate::types::{DataKey, Game, Puzzle};
use soroban_sdk::Env;

// ============================================================================
// Storage TTL Management
// ============================================================================

/// TTL for game storage (30 days in ledgers, ~5 seconds per ledger)
/// 30 days = 30 * 24 * 60 * 60 / 5 = 518,400 ledgers
const GAME_TTL_LEDGERS: u32 = 518_400;

/// TTL for puzzle storage (persistent - 1 year)
/// 1 year = 365 * 24 * 60 * 60 / 5 = 6,307,200 ledgers
const PUZZLE_TTL_LEDGERS: u32 = 6_307_200;

// ============================================================================
// Game Storage
// ============================================================================

/// Get a game by ID
pub fn get_game(env: &Env, game_id: u32) -> Result<Game, Error> {
    let key = DataKey::Game(game_id);
    env.storage()
        .temporary()
        .get(&key)
        .ok_or(Error::GameNotFound)
}

/// Set a game and extend its TTL
pub fn set_game(env: &Env, game_id: u32, game: &Game) {
    let key = DataKey::Game(game_id);
    env.storage().temporary().set(&key, game);
    env.storage()
        .temporary()
        .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);
}

/// Get the next game ID and increment the counter
pub fn increment_game_counter(env: &Env) -> u32 {
    let key = DataKey::GameCounter;
    let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&key, &next);
    next
}

// ============================================================================
// Puzzle Storage
// ============================================================================

/// Get a puzzle by ID
pub fn get_puzzle(env: &Env, puzzle_id: u32) -> Result<Puzzle, Error> {
    let key = DataKey::Puzzle(puzzle_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::PuzzleNotFound)
}

/// Set a puzzle and extend its TTL
pub fn set_puzzle(env: &Env, puzzle_id: u32, puzzle: &Puzzle) {
    let key = DataKey::Puzzle(puzzle_id);
    env.storage().persistent().set(&key, puzzle);
    env.storage()
        .persistent()
        .extend_ttl(&key, PUZZLE_TTL_LEDGERS, PUZZLE_TTL_LEDGERS);
}

/// Get the total number of puzzles
pub fn get_puzzle_count(env: &Env) -> u32 {
    let key = DataKey::PuzzleCounter;
    env.storage().instance().get(&key).unwrap_or(0)
}

/// Increment the puzzle counter and return the new count
pub fn increment_puzzle_counter(env: &Env) -> u32 {
    let key = DataKey::PuzzleCounter;
    let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&key, &next);
    next
}

/// Get a puzzle by index (0-based)
/// This allows random selection via index
pub fn get_puzzle_by_index(env: &Env, index: u32) -> Result<Puzzle, Error> {
    let key = DataKey::PuzzleIndex(index);
    let puzzle_id: u32 = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(Error::PuzzleNotFound)?;
    get_puzzle(env, puzzle_id)
}

/// Set the puzzle ID for a given index
pub fn set_puzzle_index(env: &Env, index: u32, puzzle_id: u32) {
    let key = DataKey::PuzzleIndex(index);
    env.storage().persistent().set(&key, &puzzle_id);
    env.storage()
        .persistent()
        .extend_ttl(&key, PUZZLE_TTL_LEDGERS, PUZZLE_TTL_LEDGERS);
}
