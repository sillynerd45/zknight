//! ZK verification and utility functions for ZKnight

use crate::types::{Puzzle, VerificationKeys};
use soroban_poseidon::poseidon2_hash;
use soroban_sdk::{
    crypto::BnScalar,
    crypto::bn254::{Bn254G1Affine, Bn254G2Affine, Fr},
    Bytes, BytesN, Env, U256, Vec, vec,
};

/// Verify a Groth16 proof using Soroban's native BN254 pairing check
///
/// # Arguments
/// * `env` - Soroban environment
/// * `vk` - Verification key
/// * `proof` - 256-byte Groth16 proof (A, B, C)
/// * `inputs` - Public inputs as U256 array
///
/// # Returns
/// * `true` if proof is valid, `false` otherwise
///
/// # Note
/// snarkjs binary is c0|c1 vs Soroban SDK expecting c1|c0 for G2 points.
/// This function handles the byte swapping automatically.
pub fn verify_groth16(env: &Env, vk: &VerificationKeys, proof: &Bytes, inputs: &[U256]) -> bool {
    // Extract and swap G2 point B (bytes 64-192)
    // snarkjs format: c0|c1 → Soroban format: c1|c0
    let raw = proof.slice(64..192);
    let mut bytes = Bytes::new(env);
    bytes.append(&raw.slice(32..64));  // x_c1
    bytes.append(&raw.slice(0..32));   // x_c0
    bytes.append(&raw.slice(96..128)); // y_c1
    bytes.append(&raw.slice(64..96));  // y_c0

    // Parse proof points
    let a = Bn254G1Affine::from_bytes(proof.slice(0..64).try_into().unwrap());
    let b = Bn254G2Affine::from_bytes(bytes.try_into().unwrap());
    let c = Bn254G1Affine::from_bytes(proof.slice(192..256).try_into().unwrap());

    // Parse verification key points
    let alpha = Bn254G1Affine::from_array(env, &vk.alpha);
    let beta = Bn254G2Affine::from_array(env, &vk.beta);
    let gamma = Bn254G2Affine::from_array(env, &vk.gamma);
    let delta = Bn254G2Affine::from_array(env, &vk.delta);

    // Compute l = ic[0] + sum(inputs[i] * ic[i+1])
    let bn254 = env.crypto().bn254();
    let mut l = Bn254G1Affine::from_array(env, &vk.ic[0]);
    for i in 0..inputs.len() {
        let ic = Bn254G1Affine::from_array(env, &vk.ic[i + 1]);
        let scalar = Fr::from_u256(inputs[i].clone());
        let term = bn254.g1_mul(&ic, &scalar);
        l = bn254.g1_add(&l, &term);
    }

    // Verify pairing equation:
    // e(-a, b) * e(alpha, beta) * e(l, gamma) * e(c, delta) == 1
    let g1: Vec<Bn254G1Affine> = vec![env, -a, alpha, l, c];
    let g2: Vec<Bn254G2Affine> = vec![env, b, beta, gamma, delta];
    bn254.pairing_check(g1, g2)
}

/// Build public signals array for Groth16 verification
///
/// Circom public signal order: outputs first, then inputs.
/// Must match exactly what snarkjs produces in publicSignals[].
///
/// # Public Signal Order (125 total):
///
/// ## Outputs (3):
/// 0. out_puzzle_id (= puzzle_id)
/// 1. out_tick_count (= tick_count)
/// 2. out_win (= 1, always true for valid proof)
///
/// ## Inputs (122):
/// 3. grid_width (1)
/// 4. grid_height (1)
/// 5-6. knight_a_start (2: x, y)
/// 7-8. knight_b_start (2: x, y)
/// 9-40. walls (32: 16 positions × 2 coords, padded with {11, 7})
/// 41-56. static_tnt (16: 8 positions × 2 coords, padded with {11, 7})
/// 57-120. barrel_paths (64: 2 barrels × 16 steps × 2 coords, padded with {11, 7})
/// 121-122. barrel_path_lengths (2: lengths for 2 barrels)
/// 123. tick_count (1)
/// 124. puzzle_id (1)
///
/// Total: 3 + 122 = 125
pub fn build_public_inputs(env: &Env, puzzle: &Puzzle, tick_count: u32) -> Vec<U256> {
    let mut inputs = Vec::new(env);

    // Circuit outputs (first 3 public signals in Circom convention)
    inputs.push_back(U256::from_u32(env, puzzle.id));       // out_puzzle_id
    inputs.push_back(U256::from_u32(env, tick_count));       // out_tick_count
    inputs.push_back(U256::from_u32(env, 1));                // out_win (always 1)

    // Circuit inputs (122 signals)
    // 1. Grid dimensions
    inputs.push_back(U256::from_u32(env, puzzle.grid_width));
    inputs.push_back(U256::from_u32(env, puzzle.grid_height));

    // 2. Knight starting positions
    inputs.push_back(U256::from_u32(env, puzzle.knight_a_start.x));
    inputs.push_back(U256::from_u32(env, puzzle.knight_a_start.y));
    inputs.push_back(U256::from_u32(env, puzzle.knight_b_start.x));
    inputs.push_back(U256::from_u32(env, puzzle.knight_b_start.y));

    // 3. Walls (padded to 16 with out-of-bounds sentinel {11, 7})
    for i in 0..16 {
        if let Some(wall) = puzzle.walls.get(i) {
            inputs.push_back(U256::from_u32(env, wall.x));
            inputs.push_back(U256::from_u32(env, wall.y));
        } else {
            inputs.push_back(U256::from_u32(env, 11)); // x out-of-bounds
            inputs.push_back(U256::from_u32(env, 7));  // y out-of-bounds
        }
    }

    // 4. Static TNT (padded to 8 with {11, 7})
    for i in 0..8 {
        if let Some(tnt) = puzzle.static_tnt.get(i) {
            inputs.push_back(U256::from_u32(env, tnt.x));
            inputs.push_back(U256::from_u32(env, tnt.y));
        } else {
            inputs.push_back(U256::from_u32(env, 11));
            inputs.push_back(U256::from_u32(env, 7));
        }
    }

    // 5. Barrel paths (2 barrels × 16 steps × 2 coords)
    for b in 0..2 {
        if let Some(barrel) = puzzle.moving_barrels.get(b) {
            for s in 0..16 {
                if let Some(pos) = barrel.path.get(s) {
                    inputs.push_back(U256::from_u32(env, pos.x));
                    inputs.push_back(U256::from_u32(env, pos.y));
                } else {
                    inputs.push_back(U256::from_u32(env, 11));
                    inputs.push_back(U256::from_u32(env, 7));
                }
            }
        } else {
            // No barrel at this index - pad entire path
            for _ in 0..16 {
                inputs.push_back(U256::from_u32(env, 11));
                inputs.push_back(U256::from_u32(env, 7));
            }
        }
    }

    // 6. Barrel path lengths
    // Non-existent barrels use length 1 (not 0) to match circuit/frontend convention
    // (avoids division by zero in circuit modular arithmetic)
    for b in 0..2 {
        if let Some(barrel) = puzzle.moving_barrels.get(b) {
            inputs.push_back(U256::from_u32(env, barrel.path_length));
        } else {
            inputs.push_back(U256::from_u32(env, 1));
        }
    }

    // 7. Tick count (actual solution length)
    inputs.push_back(U256::from_u32(env, tick_count));

    // 8. Puzzle ID (binds proof to specific puzzle)
    inputs.push_back(U256::from_u32(env, puzzle.id));

    inputs
}

/// Compute Poseidon2 hash of puzzle layout fields
///
/// This creates a cryptographic commitment to the puzzle's layout.
/// Used to verify puzzle integrity.
pub fn compute_puzzle_hash(env: &Env, puzzle: &Puzzle) -> BytesN<32> {
    // We'll hash all puzzle layout fields using Poseidon2
    // For simplicity, we'll hash pairs of U256 values

    // Start with grid dimensions and knight positions
    let mut hash = poseidon2_hash::<4, BnScalar>(
        env,
        &vec![
            env,
            U256::from_u32(env, puzzle.grid_width),
            U256::from_u32(env, puzzle.grid_height),
        ],
    );

    // Hash knight positions
    hash = poseidon2_hash::<4, BnScalar>(
        env,
        &vec![
            env,
            hash.clone(),
            U256::from_u32(env, puzzle.knight_a_start.x),
        ],
    );
    hash = poseidon2_hash::<4, BnScalar>(
        env,
        &vec![
            env,
            hash.clone(),
            U256::from_u32(env, puzzle.knight_a_start.y),
        ],
    );
    hash = poseidon2_hash::<4, BnScalar>(
        env,
        &vec![
            env,
            hash.clone(),
            U256::from_u32(env, puzzle.knight_b_start.x),
        ],
    );
    hash = poseidon2_hash::<4, BnScalar>(
        env,
        &vec![
            env,
            hash.clone(),
            U256::from_u32(env, puzzle.knight_b_start.y),
        ],
    );

    // Hash walls
    for wall in puzzle.walls.iter() {
        hash = poseidon2_hash::<4, BnScalar>(
            env,
            &vec![
                env,
                hash.clone(),
                U256::from_u32(env, wall.x),
            ],
        );
        hash = poseidon2_hash::<4, BnScalar>(
            env,
            &vec![
                env,
                hash.clone(),
                U256::from_u32(env, wall.y),
            ],
        );
    }

    // Hash static TNT
    for tnt in puzzle.static_tnt.iter() {
        hash = poseidon2_hash::<4, BnScalar>(
            env,
            &vec![
                env,
                hash.clone(),
                U256::from_u32(env, tnt.x),
            ],
        );
        hash = poseidon2_hash::<4, BnScalar>(
            env,
            &vec![
                env,
                hash.clone(),
                U256::from_u32(env, tnt.y),
            ],
        );
    }

    // Hash barrel paths
    for barrel in puzzle.moving_barrels.iter() {
        hash = poseidon2_hash::<4, BnScalar>(
            env,
            &vec![
                env,
                hash.clone(),
                U256::from_u32(env, barrel.path_length),
            ],
        );
        for pos in barrel.path.iter() {
            hash = poseidon2_hash::<4, BnScalar>(
                env,
                &vec![
                    env,
                    hash.clone(),
                    U256::from_u32(env, pos.x),
                ],
            );
            hash = poseidon2_hash::<4, BnScalar>(
                env,
                &vec![
                    env,
                    hash.clone(),
                    U256::from_u32(env, pos.y),
                ],
            );
        }
    }

    // Convert U256 to BytesN<32>
    let bytes = hash.to_be_bytes();
    bytes.try_into().unwrap()
}
