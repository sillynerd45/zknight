//! Data types for ZKnight game contract

use soroban_sdk::{contracttype, Address, BytesN, Vec};

// ============================================================================
// Core Game Types
// ============================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Position {
    pub x: u32,
    pub y: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MovingBarrel {
    pub path: Vec<Position>,       // <= 16 steps
    pub path_length: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Puzzle {
    pub id: u32,
    pub grid_width: u32,            // always 11
    pub grid_height: u32,           // always 7
    pub knight_a_start: Position,
    pub knight_b_start: Position,
    pub goal_a: Position,
    pub goal_b: Position,
    pub walls: Vec<Position>,       // <= 26 (circuit cap)
    pub static_tnt: Vec<Position>,  // <= 8
    pub moving_barrels: Vec<MovingBarrel>, // <= 2
    pub min_ticks: u32,             // shortest known solution
    pub max_ticks: u32,             // longest valid solution (<= 512)
    pub puzzle_hash: BytesN<32>,    // Poseidon2 of all layout fields
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GameStatus {
    WaitingForPlayer,  // P1 created, no P2 yet
    Active,            // P2 joined, puzzle assigned
    Committing,        // >= 1 player has committed
    Finished,          // winner declared
    Cancelled,         // P1 cancelled before P2 joined
    Expired,           // Game expired (>1 hour old, auto-cancelled)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Game {
    pub id: u32,
    pub player1: Address,
    pub player2: Option<Address>,
    pub puzzle_id: Option<u32>,
    pub status: GameStatus,
    pub winner: Option<Address>,
    pub p1_committed: bool,
    pub p2_committed: bool,
    pub p1_commitment: Option<BytesN<32>>,  // sha256(preimage)
    pub p2_commitment: Option<BytesN<32>>,
    pub p1_commit_time: Option<u64>,        // ledger timestamp of P1 commit
    pub p2_commit_time: Option<u64>,        // ledger timestamp of P2 commit
    pub p1_tick_count: Option<u32>,         // set on reveal
    pub p2_tick_count: Option<u32>,
    pub commit_time: Option<u64>,           // timestamp of FIRST commitment
    pub created_at: u64,
}

// ============================================================================
// Storage Keys
// ============================================================================

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Game(u32),
    Puzzle(u32),
    GameCounter,
    PuzzleCounter,
    PuzzleIndex(u32),      // maps index -> puzzle_id
    PlayerActiveGame(Address), // maps player -> their WaitingForPlayer game_id
    GameHubAddress,
    Admin,
}

// ============================================================================
// Verification Key Structure (for Groth16)
// ============================================================================

/// Groth16 verification keys.
pub struct VerificationKeys {
    pub alpha: [u8; 64],
    pub beta: [u8; 128],
    pub gamma: [u8; 128],
    pub delta: [u8; 128],
    pub ic: &'static [[u8; 64]],
}
