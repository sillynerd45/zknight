# ZKnight ZK Quick Reference

## Common Commands

```bash
# Check setup status (fast)
npm run check

# Run full trusted setup (~10-30 min)
npm run setup

# Verify setup completed correctly
npm run verify-setup

# Generate all test inputs
npm run gen:all

# Run circuit validation tests
npm run validate

# Verify zkey only
npm run verify-zkey

# Generate and verify test proof
npm run test-proof
```

## File Locations

### Source Files
- `zknight.circom` — Main circuit (512 ticks, 438K constraints)
- `gen_*.js` — Test input generators
- `validate.js` — Automated validation suite

### Build Outputs
- `build/zknight.r1cs` — Compiled circuit (57MB)
- `build/zknight_js/zknight.wasm` — Circuit WASM (1.7MB)
- `build/zknight.sym` — Debug symbols

### Trusted Setup Outputs
- `zknight_final.zkey` — Proving key (~200MB) **DO NOT COMMIT**
- `vk.json` — Verification key (~2KB) **COMMIT THIS**
- `pot19_final.ptau` — Powers of Tau (~1.4GB) **DO NOT COMMIT**

### Frontend Assets
- `../zknight-frontend/public/zk/zknight.wasm` — Circuit WASM
- `../zknight-frontend/public/zk/zknight_final.zkey` — Proving key

## Validation Test Suite

| Test | Input File | Expected | Description |
|------|-----------|----------|-------------|
| Trivial | `test_input.json` | ✅ Pass | Empty grid, no obstacles |
| Puzzle 01 | `test_puzzle01.json` | ✅ Pass | Walls + static TNT |
| Puzzle 03 | `test_puzzle03.json` | ✅ Pass | Moving barrel (31 ticks) |
| Real solution | `test_real_solution.json` | ✅ Pass | 59-tick gameplay |
| Post-padding | `test_post_padding.json` | ✅ Pass | Moves after win |
| Collision | `bad_input.json` | ❌ Fail | Knight-knight collision |
| Crossing | `test_crossing.json` | ❌ Fail | Knights swap positions |
| Wrong count | `test_wrong_tick_count.json` | ❌ Fail | Incorrect tick_count |
| Barrel hit | `test_barrel_collision.json` | ❌ Fail | Barrel collision during NoOp |

## Circuit Specs

| Parameter | Value |
|-----------|-------|
| Constraints | 438,294 |
| Max ticks | 512 |
| Tick duration | 600ms |
| Grid size | 11×7 |
| Max walls | 16 |
| Max static TNT | 8 |
| Max moving barrels | 2 |
| Max barrel path | 16 steps |
| Move encoding | 0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp |

## Proving Performance

| Platform | Expected Time |
|----------|---------------|
| Node.js (local) | 200-400ms |
| Desktop browser | 500-2000ms |
| Mobile browser | 2000-8000ms |

## Public Inputs (75 total)

1. `grid_width` (11)
2. `grid_height` (7)
3-4. `knight_a_start[2]`
5-6. `knight_b_start[2]`
7-38. `walls[16][2]` (padded)
39-54. `static_tnt[8][2]` (padded)
55-118. `barrel_paths[2][16][2]`
119-120. `barrel_path_lengths[2]`
121. `tick_count` (actual ticks used)
122. `puzzle_id`

## Private Input

- `moves[512]` — Move sequence (0-4 encoding, NoOp-padded)

## Workflow

### Development
```bash
# 1. Modify circuit
vim zknight.circom

# 2. Recompile
npm run compile

# 3. Regenerate test inputs
npm run gen:all

# 4. Validate
npm run validate
```

### Trusted Setup (One-time)
```bash
# Run full setup
npm run setup

# Verify
npm run verify-setup
```

### Testing Proofs
```bash
# Generate test proof
npm run test-proof

# Custom proof
snarkjs groth16 fullprove \
    my_input.json \
    build/zknight_js/zknight.wasm \
    zknight_final.zkey \
    proof.json \
    public.json

# Verify
snarkjs groth16 verify vk.json public.json proof.json
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `snarkjs not found` | `npm install -g snarkjs` |
| `wget not found` (Windows) | Use Git Bash or download pot19 manually |
| Out of memory | Close other apps, need 8GB+ RAM |
| Proof fails | Check input format, run `npm run validate` |
| Setup hangs | Phase 2 preparation takes 5-15 minutes, be patient |

## Documentation

- `README_TRUSTED_SETUP.md` — Full trusted setup guide
- `README_VALIDATION.md` — Validation system docs
- `SETUP_IMPLEMENTATION_SUMMARY.md` — Implementation overview
- `../../development/build_steps/07_ZK_CIRCUIT.md` — Circuit design
- `../../development/build_steps/08_TRUSTED_SETUP.md` — Setup spec

## Next Steps

After trusted setup:
1. Build Soroban contract (`09_SOROBAN_CONTRACT.md`)
2. Frontend integration (`10_ZK_FRONTEND.md`)
