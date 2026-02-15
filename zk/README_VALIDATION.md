# ZKnight Circuit Validation Guide

## Quick Start

```bash
# Run all validation tests
cd zk
npm run validate

# Or run directly
node validate.js
```

## What Gets Tested

### ✓ Valid Inputs (should pass)
- `test_input.json` - Trivial puzzle with no obstacles
- `test_puzzle01.json` - Puzzle 01 with walls and static TNT
- `test_real_solution.json` - Real 59-tick gameplay solution
- `test_post_padding.json` - Verifies post-tick_count moves are ignored
- `test_puzzle03.json` - **PLACEHOLDER** - Puzzle 03 with moving barrel

### ✗ Invalid Inputs (should be rejected)
- `bad_input.json` - Knight collision (both knights on same tile)
- `test_crossing.json` - Knight crossing (position swap)
- `test_wrong_tick_count.json` - Valid moves but wrong tick_count
- `test_barrel_collision.json` - Barrel hits knight during NoOp ticks

## Updating test_puzzle03.json

After manually solving puzzle_03 in the browser:

1. Start the dev server:
   ```bash
   cd zknight-frontend
   bun run dev
   ```

2. Open browser, select **Puzzle 03** from the dropdown in the lobby

3. Solve the puzzle - watch for the win message in the console

4. Copy the tick history from the browser console:
   ```
   [ZK DEBUG] Puzzle solved!
   [ZK DEBUG] Tick count: <N>
   [ZK DEBUG] Tick history: [4,4,3,1,...]
   ```

5. Update `zk/gen_puzzle03_input.js`:
   ```javascript
   // Replace the solution array with your tick history:
   const solution = [4,4,3,1,4,4,3,3, ... ]; // paste your array here
   ```

6. Regenerate and validate:
   ```bash
   cd zk
   node gen_puzzle03_input.js
   npm run validate
   ```

## npm Scripts

```bash
npm run validate      # Run full validation suite
npm run gen:all       # Regenerate all test input files
npm run gen:valid     # Regenerate only valid test inputs
npm run gen:invalid   # Regenerate only invalid test inputs
npm test              # Alias for validate
```

## Expected Output

When all tests pass (except placeholder):

```
╔════════════════════════════════════════════════════════════════╗
║          ZKnight Circuit Witness Validation Suite             ║
╚════════════════════════════════════════════════════════════════╝

Testing: Trivial puzzle (no obstacles)... ✓ PASS (336ms)
Testing: Puzzle 01 solution (walls + static TNT)... ✓ PASS (318ms)
...
═══════════════════════════════════════════════════════════════
Summary

  Total tests:     9
  Passed:          8
  Failed:          0
  Skipped:         1

⚠ All active tests passed, but 1 test(s) skipped
  Update placeholder tests and re-run validation.
```

## Troubleshooting

### Witness generation fails
- Check that the circuit is compiled: `ls build/zknight_js/zknight.wasm`
- If missing, compile: `circom zknight.circom --r1cs --wasm --sym`

### Test fails unexpectedly
- Run witness generation manually to see full error:
  ```bash
  node build/zknight_js/generate_witness.js \
    build/zknight_js/zknight.wasm \
    test_file.json \
    output.wtns
  ```

### Invalid test passes (should fail but doesn't)
- Check the test input is actually invalid
- Verify circuit constraint is correct
- Review circuit line number in error output

## Success Criteria

Before proceeding to trusted setup (08_TRUSTED_SETUP.md):

- [ ] All 8 active tests pass (green ✓)
- [ ] All 4 invalid inputs correctly rejected
- [ ] puzzle_03 placeholder updated with real solution
- [ ] All 9 tests pass with 0 skipped
- [ ] TypeScript compiles: `cd zknight-frontend && tsc --noEmit`
- [ ] Frontend tests pass: `cd zknight-frontend && bun run test`
