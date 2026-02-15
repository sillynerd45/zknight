#!/usr/bin/env node
//
// Converts vk.json to Rust byte arrays for Soroban VerificationKeys struct
//

const fs = require('fs');
const path = require('path');

const vk = JSON.parse(fs.readFileSync(path.join(__dirname, 'vk.json'), 'utf8'));

// Convert a decimal string to a 32-byte big-endian hex array
function toBigEndianBytes(decimalStr) {
  const bn = BigInt(decimalStr);
  const hex = bn.toString(16).padStart(64, '0'); // 32 bytes = 64 hex chars
  const bytes = [];
  for (let i = 0; i < 64; i += 2) {
    bytes.push(`0x${hex.slice(i, i + 2)}`);
  }
  return bytes;
}

// Convert G1 affine point (2 coordinates) to 64 bytes
function g1ToBytes(point) {
  const x = toBigEndianBytes(point[0]);
  const y = toBigEndianBytes(point[1]);
  return [...x, ...y];
}

// Convert G2 affine point to 128 bytes
// G2 has 2 Fp2 elements (x, y), each Fp2 has 2 Fp elements (c0, c1)
// Format: [x_c0, x_c1], [y_c0, y_c1]
// We need: x_c0 (32) + x_c1 (32) + y_c0 (32) + y_c1 (32) = 128 bytes
function g2ToBytes(point) {
  const x_c0 = toBigEndianBytes(point[0][0]);
  const x_c1 = toBigEndianBytes(point[0][1]);
  const y_c0 = toBigEndianBytes(point[1][0]);
  const y_c1 = toBigEndianBytes(point[1][1]);
  return [...x_c0, ...x_c1, ...y_c0, ...y_c1];
}

// Format byte array as Rust code
function formatBytes(bytes, indent = 8) {
  const lines = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16).join(', ');
    lines.push(' '.repeat(indent) + chunk + ',');
  }
  return lines.join('\n');
}

console.log('// Generated from vk.json');
console.log('// nPublic:', vk.nPublic);
console.log();

// Alpha (G1)
console.log('pub const VK_ALPHA: [u8; 64] = [');
console.log(formatBytes(g1ToBytes(vk.vk_alpha_1)));
console.log('];');
console.log();

// Beta (G2)
console.log('pub const VK_BETA: [u8; 128] = [');
console.log(formatBytes(g2ToBytes(vk.vk_beta_2)));
console.log('];');
console.log();

// Gamma (G2)
console.log('pub const VK_GAMMA: [u8; 128] = [');
console.log(formatBytes(g2ToBytes(vk.vk_gamma_2)));
console.log('];');
console.log();

// Delta (G2)
console.log('pub const VK_DELTA: [u8; 128] = [');
console.log(formatBytes(g2ToBytes(vk.vk_delta_2)));
console.log('];');
console.log();

// IC array
console.log(`// IC has ${vk.IC.length} elements (nPublic + 1)`);
console.log('pub const VK_IC: &[[u8; 64]] = &[');
for (let i = 0; i < vk.IC.length; i++) {
  console.log('    [');
  console.log(formatBytes(g1ToBytes(vk.IC[i]), 8));
  console.log('    ],');
}
console.log('];');
