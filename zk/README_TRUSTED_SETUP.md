# ZKnight Trusted Setup Guide

This directory contains the Groth16 trusted setup for the ZKnight circuit.

## Quick Start

Run the full automated setup:

```bash
cd zk
npm run setup
```

This will:
1. Download Hermez Powers of Tau (pot19, ~1.4GB)
2. Prepare Phase 2
3. Run Groth16 circuit-specific setup
4. Contribute randomness
5. Verify the final zkey
6. Export verification key
7. Generate and verify a test proof
8. Copy WASM and zkey to frontend

**Total time:** ~10-30 minutes depending on network speed and CPU.

## Prerequisites

- **snarkjs** installed globally: `npm install -g snarkjs`
- **wget or curl** for downloading Powers of Tau (curl is usually pre-installed on Windows)
- **~4GB free disk space** for intermediate files
- Circuit already compiled (see `07_ZK_CIRCUIT.md`)

## Manual Steps

If you prefer to run steps individually:

### 1. Download Powers of Tau

```bash
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_19.ptau \
    -O pot19_final.ptau
```

### 2. Prepare Phase 2

```bash
snarkjs powersoftau prepare phase2 pot19_final.ptau pot19_pp.ptau -v
```

### 3. Groth16 Setup

```bash
snarkjs groth16 setup build/zknight.r1cs pot19_pp.ptau zknight_0000.zkey
```

### 4. Contribute Randomness

```bash
snarkjs zkey contribute zknight_0000.zkey zknight_final.zkey \
    --name="Your Name" -e="random entropy here"
```

### 5. Verify ZKey

```bash
npm run verify-zkey
```

### 6. Export Verification Key

```bash
snarkjs zkey export verificationkey zknight_final.zkey vk.json
```

### 7. Test Proof

```bash
npm run test-proof
```

### 8. Copy to Frontend

```bash
mkdir -p ../zknight-frontend/public/zk
cp build/zknight_js/zknight.wasm ../zknight-frontend/public/zk/
cp zknight_final.zkey ../zknight-frontend/public/zk/
```

## Output Files

After successful setup:

| File | Size | Description | Git Tracked |
|------|------|-------------|-------------|
| `pot19_final.ptau` | ~1.4GB | Hermez Powers of Tau | ❌ No |
| `pot19_pp.ptau` | ~1.4GB | Phase 2 prepared | ❌ No |
| `zknight_0000.zkey` | ~200MB | Initial zkey | ❌ No |
| `zknight_final.zkey` | ~200MB | Final proving key | ❌ No |
| `vk.json` | ~2KB | Verification key | ✅ Yes |
| `test_proof.json` | ~1KB | Test proof | ❌ No |
| `test_public.json` | ~1KB | Test public signals | ❌ No |

## Verification Key Format

The `vk.json` file contains the verification key in snarkjs format:

```json
{
  "protocol": "groth16",
  "curve": "bn128",
  "nPublic": 75,
  "vk_alpha_1": [...],
  "vk_beta_2": [...],
  "vk_gamma_2": [...],
  "vk_delta_2": [...],
  "vk_alphabeta_12": [...],
  "IC": [...]
}
```

This will be converted to Soroban byte format in build step 09.

## Proving Performance

Expected proving times (on test machine):

- **Local snarkjs (Node.js):** ~200-400ms
- **Browser (WASM):** ~500-2000ms (2-5x slower)
- **Mobile browser:** ~2000-8000ms (10-20x slower)

The automated script measures actual proving time during test proof generation.

## Troubleshooting

### Error: "snarkjs not found"

Install globally:
```bash
npm install -g snarkjs
```

### Error: "Neither wget nor curl found"

**Fixed!** The script now supports both `wget` and `curl` (curl is usually available on Windows).

If you still get this error, download manually:
- URL: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_19.ptau
- Save as: `zk/pot19_final.ptau`
- Then re-run: `npm run setup`

### Error: "Circuit not compiled"

Run circuit compilation first:
```bash
cd zk
circom zknight.circom --r1cs --wasm --sym --output ./build
```

### Out of memory during setup

Phase 2 preparation requires ~8GB RAM. Close other applications or use a machine with more memory.

## Security Considerations

This setup uses:
- **Hermez Powers of Tau** — widely trusted, used by Polygon, Hermez, and other projects
- **Solo contribution** — single entropy contribution (sufficient for testing/competitive play)

For production with high-value stakes, consider:
- Multi-party ceremony (multiple contributors)
- Independent verification of Powers of Tau
- Public audit of final zkey

## Next Steps

After successful setup:

1. ✅ Verification key exported (`vk.json`)
2. ✅ Proving key ready (`zknight_final.zkey`)
3. ✅ Frontend assets copied
4. ⏭️ Build Soroban contract (see `09_SOROBAN_CONTRACT.md`)
5. ⏭️ Integrate frontend proving (see `10_ZK_FRONTEND.md`)

## References

- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [Hermez Powers of Tau](https://github.com/iden3/snarkjs#7-prepare-phase-2)
- [Circom Documentation](https://docs.circom.io/)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)
