#!/usr/bin/env node
// Enhanced witness validation script with colored output and timing

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const WASM = path.join(__dirname, 'build/zknight_js/zknight.wasm');
const GENERATOR = path.join(__dirname, 'build/zknight_js/generate_witness.js');

// Check if circuit is built
if (!fs.existsSync(WASM) || !fs.existsSync(GENERATOR)) {
  console.error(`${colors.red}✗ Circuit not built!${colors.reset}`);
  console.error(`  Run: ${colors.cyan}circom zknight.circom --r1cs --wasm --sym${colors.reset}`);
  process.exit(1);
}

const testCases = [
  // Valid inputs (should pass)
  { file: 'test_input.json', shouldPass: true, description: 'Trivial puzzle (no obstacles)' },
  { file: 'test_puzzle01.json', shouldPass: true, description: 'Puzzle 01 solution (walls + static TNT)' },
  { file: 'test_real_solution.json', shouldPass: true, description: 'Real 59-tick gameplay solution' },
  { file: 'test_post_padding.json', shouldPass: true, description: 'Post-tick_count moves (should be ignored)' },
  { file: 'test_puzzle03.json', shouldPass: true, description: 'Puzzle 03 with moving barrel (31 ticks, 14 moves)' },

  // Invalid inputs (should fail)
  { file: 'bad_input.json', shouldPass: false, description: 'Knight collision (invalid)' },
  { file: 'test_crossing.json', shouldPass: false, description: 'Knight crossing/swap (invalid)' },
  { file: 'test_wrong_tick_count.json', shouldPass: false, description: 'Wrong tick_count value (invalid)' },
  { file: 'test_barrel_collision.json', shouldPass: false, description: 'Barrel hits knight during NoOp (invalid)' },
];

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}║          ZKnight Circuit Witness Validation Suite             ║${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

for (const test of testCases) {
  const inputFile = path.join(__dirname, test.file);
  const witnessFile = path.join(__dirname, test.file.replace('.json', '.wtns'));

  // Check if test file exists
  if (!fs.existsSync(inputFile)) {
    console.log(`${colors.yellow}⊘ SKIP${colors.reset}: ${test.description}`);
    console.log(`  ${colors.gray}File not found: ${test.file}${colors.reset}\n`);
    skipped++;
    results.push({ ...test, status: 'skip', reason: 'File not found' });
    continue;
  }

  // Skip placeholder tests
  if (test.skip) {
    console.log(`${colors.yellow}⊘ SKIP${colors.reset}: ${test.description}`);
    console.log(`  ${colors.gray}Placeholder - update after manual gameplay${colors.reset}\n`);
    skipped++;
    results.push({ ...test, status: 'skip', reason: 'Placeholder' });
    continue;
  }

  process.stdout.write(`${colors.dim}Testing:${colors.reset} ${test.description}... `);

  const startTime = Date.now();
  let success = false;
  let errorMsg = '';

  try {
    execSync(`node "${GENERATOR}" "${WASM}" "${inputFile}" "${witnessFile}"`, {
      stdio: 'pipe',
      timeout: 30000, // 30 second timeout
    });
    success = true;
  } catch (e) {
    errorMsg = e.stderr?.toString().split('\n')[0] || e.message;
  }

  const elapsed = Date.now() - startTime;

  if (success === test.shouldPass) {
    console.log(`${colors.green}✓ PASS${colors.reset} ${colors.gray}(${elapsed}ms)${colors.reset}`);
    if (!test.shouldPass) {
      console.log(`  ${colors.gray}Correctly rejected${colors.reset}`);
    }
    passed++;
    results.push({ ...test, status: 'pass', time: elapsed });
  } else {
    console.log(`${colors.red}✗ FAIL${colors.reset} ${colors.gray}(${elapsed}ms)${colors.reset}`);
    if (test.shouldPass) {
      console.log(`  ${colors.red}Expected success but witness generation failed${colors.reset}`);
      console.log(`  ${colors.gray}${errorMsg}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}Expected failure but witness generated successfully${colors.reset}`);
    }
    failed++;
    results.push({ ...test, status: 'fail', time: elapsed, error: errorMsg });
  }

  console.log('');
}

// Summary
const total = testCases.length;
const tested = passed + failed;
console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}Summary${colors.reset}\n`);
console.log(`  Total tests:     ${total}`);
console.log(`  ${colors.green}Passed:${colors.reset}          ${passed}`);
console.log(`  ${colors.red}Failed:${colors.reset}          ${failed}`);
console.log(`  ${colors.yellow}Skipped:${colors.reset}         ${skipped}`);

if (failed === 0 && skipped === 0) {
  console.log(`\n${colors.green}${colors.bright}✓ All tests passed!${colors.reset}`);
  console.log(`  Circuit is ready for trusted setup (08_TRUSTED_SETUP.md)`);
} else if (failed === 0 && skipped > 0) {
  console.log(`\n${colors.yellow}${colors.bright}⚠ All active tests passed, but ${skipped} test(s) skipped${colors.reset}`);
  console.log(`  Update placeholder tests and re-run validation.`);
} else {
  console.log(`\n${colors.red}${colors.bright}✗ ${failed} test(s) failed${colors.reset}`);
  console.log(`  Review failures above before proceeding.`);
}

console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

// Timing stats
const validTests = results.filter(r => r.status === 'pass');
if (validTests.length > 0) {
  const times = validTests.map(r => r.time);
  const avgTime = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(0);
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`${colors.dim}Timing Stats (valid witnesses only):${colors.reset}`);
  console.log(`  Average: ${avgTime}ms  |  Min: ${minTime}ms  |  Max: ${maxTime}ms\n`);
}

// Exit with error if any test failed
process.exit(failed > 0 ? 1 : 0);
