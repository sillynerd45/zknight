/**
 * Commitment utilities for ZKnight game
 *
 * The commit-reveal scheme works as follows:
 * 1. Player generates a random preimage (32 bytes)
 * 2. Player commits SHA-256(preimage) on-chain (timestamps the win)
 * 3. Player generates ZK proof off-chain (takes 5-15 seconds)
 * 4. Player reveals preimage + proof on-chain
 * 5. Contract verifies preimage matches commitment and proof is valid
 */

/**
 * Generate a random preimage (32 bytes)
 * Uses crypto.getRandomValues for secure randomness
 */
export function generatePreimage(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Compute SHA-256 commitment from preimage
 * Uses Web Crypto API for native SHA-256 hashing
 *
 * @param preimage - 32-byte random preimage
 * @returns SHA-256 hash (32 bytes)
 */
export async function computeCommitment(preimage: Uint8Array): Promise<Uint8Array> {
  if (preimage.length !== 32) {
    throw new Error('Preimage must be exactly 32 bytes');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', preimage as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Verify that a preimage matches a commitment
 * Useful for testing and validation
 *
 * @param preimage - Original preimage
 * @param commitment - Expected commitment hash
 * @returns true if SHA-256(preimage) === commitment
 */
export async function verifyCommitment(
  preimage: Uint8Array,
  commitment: Uint8Array
): Promise<boolean> {
  const computed = await computeCommitment(preimage);

  if (computed.length !== commitment.length) {
    return false;
  }

  for (let i = 0; i < computed.length; i++) {
    if (computed[i] !== commitment[i]) {
      return false;
    }
  }

  return true;
}
