//! Basic tests for ZKnight contract
//!
//! Note: Full integration tests with ZK proofs require the proving key
//! and are better suited for end-to-end testing.

#![cfg(test)]

use crate::{ZknightContract, ZknightContractClient};
use crate::types::{GameStatus, MovingBarrel, Position, Puzzle};
use crate::errors::Error;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Bytes, BytesN, Env, Vec};

// ============================================================================
// Mock GameHub for Unit Testing
// ============================================================================

use soroban_sdk::{contract, contractimpl};

#[contract]
pub struct MockGameHub;

#[contractimpl]
impl MockGameHub {
    pub fn start_game(
        _env: Env,
        _game_id: Address,
        _session_id: u32,
        _player1: Address,
        _player2: Address,
        _player1_points: i128,
        _player2_points: i128,
    ) {
        // Mock implementation - does nothing
    }

    pub fn end_game(_env: Env, _session_id: u32, _player1_won: bool) {
        // Mock implementation - does nothing
    }
}

// ============================================================================
// Test Helpers
// ============================================================================

fn create_test_puzzle(env: &Env) -> Puzzle {
    // Create a simple test puzzle (trivial, no obstacles)
    Puzzle {
        id: 0, // Will be assigned by contract
        grid_width: 11,
        grid_height: 7,
        knight_a_start: Position { x: 0, y: 3 },
        knight_b_start: Position { x: 10, y: 3 },
        walls: Vec::new(env),
        static_tnt: Vec::new(env),
        moving_barrels: Vec::new(env),
        min_ticks: 10,
        max_ticks: 512,
        puzzle_hash: BytesN::from_array(env, &[0u8; 32]), // Will be computed by contract
    }
}

fn create_test_puzzle_with_obstacles(env: &Env) -> Puzzle {
    // Create a puzzle with walls and TNT
    let mut walls = Vec::new(env);
    walls.push_back(Position { x: 3, y: 2 });
    walls.push_back(Position { x: 3, y: 3 });
    walls.push_back(Position { x: 3, y: 4 });

    let mut static_tnt = Vec::new(env);
    static_tnt.push_back(Position { x: 5, y: 0 });
    static_tnt.push_back(Position { x: 5, y: 6 });

    // Create a moving barrel
    let mut barrel_path = Vec::new(env);
    barrel_path.push_back(Position { x: 4, y: 3 });
    barrel_path.push_back(Position { x: 5, y: 3 });
    barrel_path.push_back(Position { x: 6, y: 3 });
    barrel_path.push_back(Position { x: 5, y: 3 });

    let mut moving_barrels = Vec::new(env);
    moving_barrels.push_back(MovingBarrel {
        path: barrel_path,
        path_length: 4,
    });

    Puzzle {
        id: 0,
        grid_width: 11,
        grid_height: 7,
        knight_a_start: Position { x: 0, y: 3 },
        knight_b_start: Position { x: 10, y: 3 },
        walls,
        static_tnt,
        moving_barrels,
        min_ticks: 20,
        max_ticks: 512,
        puzzle_hash: BytesN::from_array(env, &[0u8; 32]),
    }
}

#[test]
fn test_init() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_hub(), hub_addr);
}

#[test]
fn test_add_puzzle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    let puzzle = create_test_puzzle(&env);
    let puzzle_id = client.add_puzzle(&puzzle);

    assert_eq!(puzzle_id, 1);
    assert_eq!(client.get_puzzle_count(), 1);

    // Retrieve and verify puzzle
    let stored_puzzle = client.get_puzzle(&puzzle_id);
    assert_eq!(stored_puzzle.id, puzzle_id);
    assert_eq!(stored_puzzle.grid_width, 11);
    assert_eq!(stored_puzzle.grid_height, 7);
}

#[test]
fn test_add_puzzle_with_obstacles() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    let puzzle = create_test_puzzle_with_obstacles(&env);
    let puzzle_id = client.add_puzzle(&puzzle);

    let stored_puzzle = client.get_puzzle(&puzzle_id);
    assert_eq!(stored_puzzle.walls.len(), 3);
    assert_eq!(stored_puzzle.static_tnt.len(), 2);
    assert_eq!(stored_puzzle.moving_barrels.len(), 1);
}

#[test]
fn test_create_and_join_game() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Add a puzzle first
    let puzzle = create_test_puzzle(&env);
    client.add_puzzle(&puzzle);

    // Create game
    let game_id = client.create_game(&player1);
    assert_eq!(game_id, 1);

    // Verify game state
    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::WaitingForPlayer);
    assert_eq!(game.player1, player1);
    assert!(game.player2.is_none());

    // Join game
    let selected_puzzle = client.join_game(&game_id, &player2);
    assert_eq!(selected_puzzle.id, 1);

    // Verify game state after join
    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::Active);
    assert_eq!(game.player2.unwrap(), player2);
    assert_eq!(game.puzzle_id.unwrap(), 1);
}

#[test]
fn test_cancel_game() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Create and cancel game
    let game_id = client.create_game(&player1);
    client.cancel_game(&game_id, &player1);

    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::Cancelled);
}

#[test]
fn test_commit_solve() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Setup: add puzzle, create and join game
    let puzzle = create_test_puzzle(&env);
    client.add_puzzle(&puzzle);
    let game_id = client.create_game(&player1);
    client.join_game(&game_id, &player2);

    // Create a fake commitment (32 random bytes)
    let preimage = BytesN::from_array(&env, &[1u8; 32]);
    let commitment: BytesN<32> = env.crypto().sha256(&Bytes::from_slice(&env, &preimage.to_array())).into();

    // Commit solution
    client.commit_solve(&game_id, &player1, &commitment);

    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::Committing);
    assert!(game.p1_committed);
    assert!(!game.p2_committed);
    assert!(game.p1_commitment.is_some());
    assert!(game.commit_time.is_some());
}

#[test]
fn test_get_open_games() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let player3 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Create games from different players (each player can only have one)
    let game1 = client.create_game(&player1);
    let game2 = client.create_game(&player2);

    // Check open games — returns full Game objects
    let open_games = client.get_open_games();
    assert_eq!(open_games.len(), 2);
    assert_eq!(open_games.get(0).unwrap().id, game1);
    assert_eq!(open_games.get(1).unwrap().id, game2);

    // Add puzzle and join one game
    let puzzle = create_test_puzzle(&env);
    client.add_puzzle(&puzzle);
    client.join_game(&game1, &player3);

    // Now only one game should be open
    let open_games = client.get_open_games();
    assert_eq!(open_games.len(), 1);
    assert_eq!(open_games.get(0).unwrap().id, game2);
}

#[test]
fn test_player_cannot_create_two_games() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // First game succeeds
    client.create_game(&player1);

    // Second game should fail
    let result = client.try_create_game(&player1);
    assert_eq!(result, Err(Ok(Error::AlreadyHasActiveGame)));
}

#[test]
fn test_cancel_frees_player_to_create() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Create and cancel
    let game_id = client.create_game(&player1);
    client.cancel_game(&game_id, &player1);

    // Now player can create another game
    let game_id2 = client.create_game(&player1);
    assert_eq!(game_id2, 2);
}

#[test]
fn test_player_cannot_join_if_has_active_game() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Add puzzle
    let puzzle = create_test_puzzle(&env);
    client.add_puzzle(&puzzle);

    // Player1 creates a game
    let game1 = client.create_game(&player1);

    // Player2 creates their own game
    client.create_game(&player2);

    // Player2 tries to join player1's game — should fail (already has active game)
    let result = client.try_join_game(&game1, &player2);
    assert_eq!(result, Err(Ok(Error::AlreadyHasActiveGame)));
}

#[test]
fn test_get_player_active_game_public() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // No active game initially
    assert_eq!(client.get_player_active_game(&player1), None);

    // Create game
    let game_id = client.create_game(&player1);

    // Should return the game ID (WaitingForPlayer)
    assert_eq!(client.get_player_active_game(&player1), Some(game_id));

    // Add puzzle and join
    let puzzle = create_test_puzzle(&env);
    client.add_puzzle(&puzzle);
    client.join_game(&game_id, &player2);

    // After join, game is Active — should return None (not WaitingForPlayer)
    assert_eq!(client.get_player_active_game(&player1), None);

    // Player2 also should return None (they joined, didn't create)
    assert_eq!(client.get_player_active_game(&player2), None);
}

#[test]
fn test_auto_expire_on_join() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hub_addr = env.register(MockGameHub, ());
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let contract_id = env.register(ZknightContract, (&admin, &hub_addr));
    let client = ZknightContractClient::new(&env, &contract_id);

    // Add puzzle
    let puzzle = create_test_puzzle(&env);
    client.add_puzzle(&puzzle);

    // Create game
    let game_id = client.create_game(&player1);

    // Verify player1 has active game
    assert_eq!(client.get_player_active_game(&player1), Some(game_id));

    // Get current timestamp and advance by 1 hour + 1 second
    let current_time = env.ledger().timestamp();
    env.ledger().set_timestamp(current_time + 3601);

    // Check and expire the game (returns true if expired)
    let expired = client.check_and_expire_game(&game_id);
    assert_eq!(expired, true);

    // Verify game status is Expired
    let game = client.get_game(&game_id);
    assert_eq!(game.status, GameStatus::Expired);

    // Now try to join — should fail with GameExpired
    let result = client.try_join_game(&game_id, &player2);
    assert_eq!(result, Err(Ok(Error::GameExpired)));

    // Verify player1's lock was released
    assert_eq!(client.get_player_active_game(&player1), None);

    // Verify player1 can now create a new game
    let game_id2 = client.create_game(&player1);
    assert_eq!(game_id2, 2);
}
