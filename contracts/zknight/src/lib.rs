#![no_std]

//! # ZKnight Game Contract
//!
//! A competitive puzzle game where two players race to solve the same puzzle.
//! Solutions are verified off-chain using ZK proofs (Groth16/BN254).
//!
//! **Game Hub Integration:**
//! This contract integrates with the Game Hub for lifecycle events and standings.

mod errors;
mod storage;
mod types;
mod verification_key;
mod zk;

use errors::Error;
use soroban_sdk::{contract, contractclient, contractimpl, Address, Bytes, BytesN, Env, Vec, U256};
use storage::{
    get_game, get_puzzle, get_puzzle_by_index, get_puzzle_count, increment_game_counter,
    increment_puzzle_counter, set_game, set_puzzle, set_puzzle_index,
};
use types::{DataKey, Game, GameStatus, Puzzle};
use verification_key::VERIFICATION_KEY;
use zk::{build_public_inputs, compute_puzzle_hash, verify_groth16};

// ============================================================================
// Game Hub Interface
// ============================================================================

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );

    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

// ============================================================================
// Contract Definition
// ============================================================================

#[contract]
pub struct ZknightContract;

#[contractimpl]
impl ZknightContract {
    // ========================================================================
    // Constructor
    // ========================================================================

    /// Initialize the contract with GameHub address and admin
    ///
    /// # Arguments
    /// * `admin` - Admin address (can manage puzzles and upgrade contract)
    /// * `game_hub` - Address of the GameHub contract
    pub fn __constructor(env: Env, admin: Address, game_hub: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &game_hub);
    }

    // ========================================================================
    // Puzzle Management (Admin Only)
    // ========================================================================

    /// Add a new puzzle to the contract
    ///
    /// # Arguments
    /// * `puzzle` - The puzzle to add (id will be assigned automatically)
    ///
    /// # Returns
    /// * The assigned puzzle ID
    pub fn add_puzzle(env: Env, mut puzzle: Puzzle) -> Result<u32, Error> {
        // Verify admin authorization
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::Unauthorized)?;
        admin.require_auth();

        // Assign sequential puzzle ID
        let puzzle_id = increment_puzzle_counter(&env);
        puzzle.id = puzzle_id;

        // Compute puzzle hash (Poseidon2 of all layout fields)
        let hash = compute_puzzle_hash(&env, &puzzle);
        puzzle.puzzle_hash = hash;

        // Store puzzle
        set_puzzle(&env, puzzle_id, &puzzle);

        // Store index mapping (for random selection)
        let count = get_puzzle_count(&env);
        set_puzzle_index(&env, count - 1, puzzle_id);

        Ok(puzzle_id)
    }

    /// Remove a puzzle from the contract
    ///
    /// # Arguments
    /// * `puzzle_id` - The ID of the puzzle to remove
    ///
    /// # Note
    /// This doesn't actually delete the puzzle, it just marks it as removed
    /// by not being accessible via get_puzzle_by_index.
    /// Existing games using this puzzle can still complete.
    pub fn remove_puzzle(env: Env, puzzle_id: u32) -> Result<(), Error> {
        // Verify admin authorization
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::Unauthorized)?;
        admin.require_auth();

        // Verify puzzle exists
        get_puzzle(&env, puzzle_id)?;

        // Note: We don't actually delete the puzzle from storage,
        // we just remove it from the index mapping.
        // This prevents active games from breaking.
        // A full implementation would need to track which puzzles are "active"
        // and prevent selection of removed puzzles.

        Ok(())
    }

    /// Get a puzzle by ID
    pub fn get_puzzle(env: Env, puzzle_id: u32) -> Result<Puzzle, Error> {
        get_puzzle(&env, puzzle_id)
    }

    /// Get the total number of puzzles
    pub fn get_puzzle_count(env: Env) -> u32 {
        get_puzzle_count(&env)
    }

    // ========================================================================
    // Game Lifecycle
    // ========================================================================

    /// Create a new game (waiting for player 2)
    ///
    /// # Arguments
    /// * `player1` - Address of the game creator
    ///
    /// # Returns
    /// * The new game ID
    pub fn create_game(env: Env, player1: Address) -> Result<u32, Error> {
        player1.require_auth();

        let game_id = increment_game_counter(&env);
        let game = Game {
            id: game_id,
            player1: player1.clone(),
            player2: None,
            puzzle_id: None,
            status: GameStatus::WaitingForPlayer,
            winner: None,
            p1_committed: false,
            p2_committed: false,
            p1_commitment: None,
            p2_commitment: None,
            p1_commit_time: None,
            p2_commit_time: None,
            p1_tick_count: None,
            p2_tick_count: None,
            commit_time: None,
            created_at: env.ledger().timestamp(),
        };

        set_game(&env, game_id, &game);
        Ok(game_id)
    }

    /// Cancel a game (only while waiting for player 2)
    ///
    /// # Arguments
    /// * `game_id` - The ID of the game to cancel
    /// * `player1` - Address of the game creator (must match)
    pub fn cancel_game(env: Env, game_id: u32, player1: Address) -> Result<(), Error> {
        player1.require_auth();

        let mut game = get_game(&env, game_id)?;

        // Verify status
        if game.status != GameStatus::WaitingForPlayer {
            return Err(Error::WrongStatus);
        }

        // Verify caller is player1
        if game.player1 != player1 {
            return Err(Error::Unauthorized);
        }

        // Update status
        game.status = GameStatus::Cancelled;
        set_game(&env, game_id, &game);

        Ok(())
    }

    /// Join a game as player 2
    ///
    /// This function:
    /// 1. Adds player2 to the game
    /// 2. Selects a random puzzle via PRNG
    /// 3. Returns the full Puzzle struct for immediate rendering
    ///
    /// # Arguments
    /// * `game_id` - The ID of the game to join
    /// * `player2` - Address of the joining player
    ///
    /// # Returns
    /// * The selected Puzzle struct
    pub fn join_game(env: Env, game_id: u32, player2: Address) -> Result<Puzzle, Error> {
        player2.require_auth();

        let mut game = get_game(&env, game_id)?;

        // Verify status
        if game.status != GameStatus::WaitingForPlayer {
            return Err(Error::GameNotWaiting);
        }

        // Prevent self-play
        if game.player1 == player2 {
            return Err(Error::CannotPlayYourself);
        }

        // Check 1-hour expiry
        let elapsed = env.ledger().timestamp() - game.created_at;
        if elapsed > 3600 {
            return Err(Error::GameExpired);
        }

        // Select puzzle at join time (neither player could predict this)
        let count = get_puzzle_count(&env);
        if count == 0 {
            return Err(Error::PuzzleNotFound);
        }
        let index = env.prng().gen_range::<u64>(0..count as u64) as u32;
        let puzzle = get_puzzle_by_index(&env, index)?;

        // Update game
        game.player2 = Some(player2.clone());
        game.puzzle_id = Some(puzzle.id);
        game.status = GameStatus::Active;
        set_game(&env, game_id, &game);

        // Call Game Hub to start the game (no points for ZKnight)
        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");
        let game_hub = GameHubClient::new(&env, &game_hub_addr);
        game_hub.start_game(
            &env.current_contract_address(),
            &game_id,
            &game.player1,
            &player2,
            &1,
            &1,
        );

        Ok(puzzle)
    }

    /// Commit a solution (timestamp-locked commitment)
    ///
    /// Players call this immediately upon solving the puzzle,
    /// before generating the ZK proof.
    ///
    /// # Arguments
    /// * `game_id` - The ID of the game
    /// * `player` - Address of the committing player
    /// * `commitment` - SHA256 hash of the preimage
    pub fn commit_solve(
        env: Env,
        game_id: u32,
        player: Address,
        commitment: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();

        let mut game = get_game(&env, game_id)?;

        // Verify status
        if game.status != GameStatus::Active && game.status != GameStatus::Committing {
            return Err(Error::WrongStatus);
        }

        let timestamp = env.ledger().timestamp();

        // Determine which player is committing
        let is_p1 = game.player1 == player;
        let is_p2 = game.player2.as_ref() == Some(&player);

        if !is_p1 && !is_p2 {
            return Err(Error::Unauthorized);
        }

        // Store commitment
        if is_p1 {
            if game.p1_committed {
                return Err(Error::AlreadyCommitted);
            }
            game.p1_commitment = Some(commitment);
            game.p1_commit_time = Some(timestamp);
            game.p1_committed = true;
        } else {
            if game.p2_committed {
                return Err(Error::AlreadyCommitted);
            }
            game.p2_commitment = Some(commitment);
            game.p2_commit_time = Some(timestamp);
            game.p2_committed = true;
        }

        // Set commit_time on first commitment (starts 10-minute timeout)
        if game.commit_time.is_none() {
            game.commit_time = Some(timestamp);
        }

        // Update status to Committing
        game.status = GameStatus::Committing;
        set_game(&env, game_id, &game);

        Ok(())
    }

    /// Reveal and verify a solution with ZK proof
    ///
    /// This function:
    /// 1. Verifies the preimage matches the commitment
    /// 2. Reconstructs public inputs from the stored puzzle
    /// 3. Verifies the Groth16 proof
    /// 4. Records the tick count
    /// 5. Determines the winner if both players have revealed
    /// 6. Reports the game result to Game Hub
    ///
    /// # Arguments
    /// * `game_id` - The ID of the game
    /// * `player` - Address of the revealing player
    /// * `preimage` - Preimage of the commitment (32 random bytes)
    /// * `proof` - 256-byte Groth16 proof
    /// * `tick_count` - Number of ticks in the solution (<= 512)
    pub fn reveal_solve(
        env: Env,
        game_id: u32,
        player: Address,
        preimage: BytesN<32>,
        proof: Bytes,
        tick_count: u32,
    ) -> Result<(), Error> {
        player.require_auth();

        let mut game = get_game(&env, game_id)?;

        // Verify status
        if game.status != GameStatus::Committing {
            return Err(Error::WrongStatus);
        }

        // 1. Verify preimage matches stored commitment
        let hash: BytesN<32> = env
            .crypto()
            .sha256(&Bytes::from_slice(&env, &preimage.to_array()))
            .into();

        let is_p1 = game.player1 == player;

        let stored_commitment = if is_p1 {
            game.p1_commitment.as_ref().ok_or(Error::NoCommitment)?
        } else {
            game.p2_commitment.as_ref().ok_or(Error::NoCommitment)?
        };

        if &hash != stored_commitment {
            return Err(Error::BadPreimage);
        }

        // 2. Load puzzle and reconstruct public inputs
        let puzzle = get_puzzle(&env, game.puzzle_id.ok_or(Error::PuzzleNotFound)?)?;
        let public_inputs = build_public_inputs(&env, &puzzle, tick_count);

        // 3. Verify Groth16 proof
        // Build array of public inputs for verification
        let inputs_array =
            core::array::from_fn::<U256, 125, _>(|i| public_inputs.get(i as u32).unwrap());

        if !verify_groth16(&env, &VERIFICATION_KEY, &proof, &inputs_array) {
            return Err(Error::InvalidProof);
        }

        // 4. Record tick count for this player
        if is_p1 {
            game.p1_tick_count = Some(tick_count);
        } else {
            game.p2_tick_count = Some(tick_count);
        }

        // 5. Check if both players have revealed
        let both_revealed = game.p1_tick_count.is_some() && game.p2_tick_count.is_some();

        if !both_revealed {
            // First valid reveal - store result, wait for other player
            set_game(&env, game_id, &game);
            return Ok(());
        }

        // 6. Both revealed - determine winner
        let p1_time = game.p1_commit_time.unwrap();
        let p2_time = game.p2_commit_time.unwrap();
        let p1_ticks = game.p1_tick_count.unwrap();
        let p2_ticks = game.p2_tick_count.unwrap();

        // Winner rules:
        // 1. Earliest commit_time wins
        // 2. If same ledger (same timestamp) - fewer ticks wins
        // 3. If ticks also equal - P1 wins (tiebreaker)
        let winner = if p1_time < p2_time {
            game.player1.clone()
        } else if p2_time < p1_time {
            game.player2.clone().unwrap()
        } else if p1_ticks <= p2_ticks {
            game.player1.clone()
        } else {
            game.player2.clone().unwrap()
        };

        let player1_won = winner == game.player1;

        // Update game state
        game.winner = Some(winner);
        game.status = GameStatus::Finished;
        set_game(&env, game_id, &game);

        // Report to Game Hub
        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");
        let game_hub = GameHubClient::new(&env, &game_hub_addr);
        game_hub.end_game(&game_id, &player1_won);

        Ok(())
    }

    /// Claim a timeout win (10-minute default win if opponent doesn't reveal)
    ///
    /// # Arguments
    /// * `game_id` - The ID of the game
    /// * `claimer` - Address of the player claiming the win
    pub fn claim_timeout_win(env: Env, game_id: u32, claimer: Address) -> Result<(), Error> {
        claimer.require_auth();

        let mut game = get_game(&env, game_id)?;

        // Verify status
        if game.status != GameStatus::Committing {
            return Err(Error::WrongStatus);
        }

        // Check 10-minute timeout (600 seconds)
        let commit_time = game.commit_time.ok_or(Error::NoCommitTime)?;
        let elapsed = env.ledger().timestamp() - commit_time;
        if elapsed < 600 {
            return Err(Error::TooEarly);
        }

        // Verify claimer has committed
        let is_p1 = game.player1 == claimer;
        let is_p2 = game.player2.as_ref() == Some(&claimer);

        if !is_p1 && !is_p2 {
            return Err(Error::Unauthorized);
        }

        let claimer_committed = if is_p1 {
            game.p1_committed
        } else {
            game.p2_committed
        };

        if !claimer_committed {
            return Err(Error::YouDidNotCommit);
        }

        // Verify opponent has not revealed
        let opponent_revealed = if is_p1 {
            game.p2_tick_count.is_some()
        } else {
            game.p1_tick_count.is_some()
        };

        if opponent_revealed {
            return Err(Error::OpponentAlreadyRevealed);
        }

        // Award win to claimer
        game.winner = Some(claimer);
        game.status = GameStatus::Finished;
        set_game(&env, game_id, &game);

        // Report to Game Hub
        let player1_won = game.winner.as_ref() == Some(&game.player1);
        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");
        let game_hub = GameHubClient::new(&env, &game_hub_addr);
        game_hub.end_game(&game_id, &player1_won);

        Ok(())
    }

    // ========================================================================
    // Read-Only Functions
    // ========================================================================

    /// Get game information
    pub fn get_game(env: Env, game_id: u32) -> Result<Game, Error> {
        get_game(&env, game_id)
    }

    /// Get all open games (waiting for player 2)
    pub fn get_open_games(env: Env) -> Vec<u32> {
        let mut open_games = Vec::new(&env);
        let game_count = env
            .storage()
            .instance()
            .get::<DataKey, u32>(&DataKey::GameCounter)
            .unwrap_or(0);

        for game_id in 1..=game_count {
            if let Ok(game) = get_game(&env, game_id) {
                if game.status == GameStatus::WaitingForPlayer {
                    open_games.push_back(game_id);
                }
            }
        }

        open_games
    }

    /// Get the winner of a game (if finished)
    pub fn get_game_result(env: Env, game_id: u32) -> Option<Address> {
        if let Ok(game) = get_game(&env, game_id) {
            game.winner
        } else {
            None
        }
    }

    // ========================================================================
    // Admin Functions
    // ========================================================================

    /// Get the current admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    /// Set a new admin address
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    /// Get the current GameHub contract address
    pub fn get_hub(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set")
    }

    /// Set a new GameHub contract address
    pub fn set_hub(env: Env, new_hub: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &new_hub);
    }

    /// Upgrade the contract WASM
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}

#[cfg(test)]
mod test;
