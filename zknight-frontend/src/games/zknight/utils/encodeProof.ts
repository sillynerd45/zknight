/**
 * Groth16 proof encoding for Soroban BN254 verification
 *
 * snarkjs outputs proofs in a specific JSON format:
 * - A (G1 point): [x, y] - 2 field elements
 * - B (G2 point): [[x1, x2], [y1, y2]] - 2 coordinates, each with 2 field elements
 * - C (G1 point): [x, y] - 2 field elements
 *
 * The frontend encodes in raw snarkjs byte order:
 * - A: 64 bytes (32 bytes x, 32 bytes y)
 * - B: 128 bytes (x_c0, x_c1, y_c0, y_c1) - NO swap here
 * - C: 64 bytes (32 bytes x, 32 bytes y)
 *
 * The G2 c0/c1 byte swap is handled by the contract's verify_groth16 function.
 *
 * Total: 256 bytes
 *
 * Reference: ZKNIGHT_SPEC.md Section 5.3
 */

/**
 * Groth16 proof structure from snarkjs
 */
export interface Groth16Proof {
  pi_a: [string, string, string];  // G1 point (x, y, 1)
  pi_b: [[string, string], [string, string], [string, string]];  // G2 point
  pi_c: [string, string, string];  // G1 point (x, y, 1)
  protocol: string;
  curve: string;
}

/**
 * Convert a decimal string to a 32-byte big-endian Uint8Array
 * Field elements in BN254 are 254 bits, which fits in 32 bytes
 */
function fieldElementToBytes(value: string): Uint8Array {
  // Convert decimal string to BigInt
  const bigIntValue = BigInt(value);

  // Create 32-byte array (big-endian)
  const bytes = new Uint8Array(32);

  // Convert BigInt to bytes (big-endian)
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(bigIntValue & 0xFFn);
    // Shift right by 8 bits
    const shifted = bigIntValue >> 8n;
  }

  // Reconstruct properly
  let temp = bigIntValue;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(temp & 0xFFn);
    temp = temp >> 8n;
  }

  return bytes;
}

/**
 * Encode a G1 point (A or C) to 64 bytes
 * @param x - x coordinate as decimal string
 * @param y - y coordinate as decimal string
 * @returns 64 bytes (32 bytes x, 32 bytes y)
 */
function encodeG1Point(x: string, y: string): Uint8Array {
  const xBytes = fieldElementToBytes(x);
  const yBytes = fieldElementToBytes(y);

  const result = new Uint8Array(64);
  result.set(xBytes, 0);
  result.set(yBytes, 32);

  return result;
}

/**
 * Encode a G2 point (B) to 128 bytes in snarkjs order (NO swap here)
 *
 * snarkjs format: [[x_c0, x_c1], [y_c0, y_c1]]
 * Output: [x_c0, x_c1, y_c0, y_c1] (raw snarkjs order)
 *
 * The c0/c1 swap is handled by the contract's verify_groth16 function.
 *
 * @param coord0 - First coordinate [c0, c1]
 * @param coord1 - Second coordinate [c0, c1]
 * @returns 128 bytes in snarkjs order
 */
function encodeG2Point(coord0: [string, string], coord1: [string, string]): Uint8Array {
  const [x_c0, x_c1] = coord0;
  const [y_c0, y_c1] = coord1;

  const x_c0_bytes = fieldElementToBytes(x_c0);
  const x_c1_bytes = fieldElementToBytes(x_c1);
  const y_c0_bytes = fieldElementToBytes(y_c0);
  const y_c1_bytes = fieldElementToBytes(y_c1);

  const result = new Uint8Array(128);
  result.set(x_c0_bytes, 0);   // x_c0
  result.set(x_c1_bytes, 32);  // x_c1
  result.set(y_c0_bytes, 64);  // y_c0
  result.set(y_c1_bytes, 96);  // y_c1

  return result;
}

/**
 * Encode a Groth16 proof for Soroban BN254 verification
 *
 * @param proof - Groth16 proof from snarkjs
 * @returns 256-byte proof ready for contract submission
 */
export function encodeProof(proof: Groth16Proof): Uint8Array {
  // Validate proof structure
  if (proof.protocol !== 'groth16') {
    throw new Error(`Invalid protocol: ${proof.protocol}. Expected groth16.`);
  }

  if (proof.curve !== 'bn128') {
    throw new Error(`Invalid curve: ${proof.curve}. Expected bn128.`);
  }

  // Extract coordinates
  const [a_x, a_y] = proof.pi_a;  // Ignore third element (always "1")
  const [b_coord0, b_coord1] = proof.pi_b;  // Ignore third element
  const [c_x, c_y] = proof.pi_c;  // Ignore third element

  // Encode each part
  const aBytes = encodeG1Point(a_x, a_y);        // 64 bytes
  const bBytes = encodeG2Point(b_coord0, b_coord1);  // 128 bytes (with swap)
  const cBytes = encodeG1Point(c_x, c_y);        // 64 bytes

  // Concatenate: A || B || C = 256 bytes
  const encoded = new Uint8Array(256);
  encoded.set(aBytes, 0);
  encoded.set(bBytes, 64);
  encoded.set(cBytes, 192);

  return encoded;
}

/**
 * Validate proof encoding (for testing)
 * Ensures the encoded proof is exactly 256 bytes
 */
export function validateEncodedProof(encodedProof: Uint8Array): boolean {
  return encodedProof.length === 256;
}
