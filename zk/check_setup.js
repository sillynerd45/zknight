#!/usr/bin/env node
/**
 * Quick setup status checker (cross-platform)
 * Shows which trusted setup files exist and their sizes
 */

const fs = require('fs');
const path = require('path');

const files = [
  { path: 'pot19_final.ptau', name: 'Powers of Tau (Hermez pot19)', required: false },
  { path: 'pot19_pp.ptau', name: 'Phase 2 prepared', required: false },
  { path: 'zknight_0000.zkey', name: 'Initial zkey', required: false },
  { path: 'zknight_final.zkey', name: 'Final proving key', required: true },
  { path: 'vk.json', name: 'Verification key', required: true },
  { path: 'build/zknight.r1cs', name: 'R1CS circuit', required: true },
  { path: 'build/zknight_js/zknight.wasm', name: 'WASM circuit', required: true },
  { path: 'test_proof.json', name: 'Test proof', required: false },
  { path: '../zknight-frontend/public/zk/zknight.wasm', name: 'Frontend WASM', required: true },
  { path: '../zknight-frontend/public/zk/zknight_final.zkey', name: 'Frontend proving key', required: true },
];

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

console.log('\n========================================');
console.log('ZKnight Trusted Setup Status');
console.log('========================================\n');

let missing = 0;
let total = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    const size = formatSize(stats.size);
    console.log(`✓ ${file.name.padEnd(30)} ${size}`);
  } else {
    const symbol = file.required ? '✗' : '○';
    const status = file.required ? 'MISSING (required)' : 'not created yet';
    console.log(`${symbol} ${file.name.padEnd(30)} ${status}`);
    if (file.required) {
      missing++;
    }
  }

  if (file.required) total++;
});

console.log('\n========================================');
if (missing === 0) {
  console.log('✓ Setup Complete');
  console.log('========================================\n');
  console.log('All required files present.');
  console.log('\nRun verification: npm run verify-setup\n');
} else {
  console.log(`✗ Setup Incomplete (${missing}/${total} required files missing)`);
  console.log('========================================\n');
  console.log('Run trusted setup: npm run setup\n');
}
