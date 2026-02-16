#!/usr/bin/env bun
/**
 * Seed puzzles to the ZKnight contract using stellar CLI
 * Run with: bun run scripts/seed-puzzles.ts
 */

import { $ } from 'bun';
import fs from 'fs';
import path from 'path';

// Load deployment info
const deploymentPath = path.join(process.cwd(), 'deployment.json');
if (!fs.existsSync(deploymentPath)) {
  console.error('❌ deployment.json not found. Run `bun run deploy zknight` first.');
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
const contractId = deployment.contracts?.zknight;

if (!contractId) {
  console.error('❌ ZKnight contract not found in deployment.json');
  console.error('   Run `bun run deploy zknight` first.');
  process.exit(1);
}

console.log('🔧 Seeding puzzles to ZKnight contract...');
console.log(`   Contract: ${contractId}`);
console.log(`   Network: testnet\n`);

// Define the 3 puzzles (matching frontend puzzles EXACTLY)
const puzzles = [
  {
    name: 'Puzzle 1: The Broken Mirror',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 10,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 3 },
    knight_b_start: { x: 10, y: 3 },
    walls: [
      { x: 2, y: 1 },
      { x: 4, y: 2 },
      { x: 3, y: 3 },
      { x: 8, y: 2 },
      { x: 7, y: 4 },
      { x: 1, y: 5 },
      { x: 9, y: 5 },
    ],
    static_tnt: [
      { x: 5, y: 1 },
      { x: 5, y: 5 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 2: The Crosspath',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 15,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 2 },
    knight_b_start: { x: 10, y: 4 },
    walls: [
      { x: 2, y: 1 },
      { x: 4, y: 1 },
      { x: 8, y: 1 },
      { x: 3, y: 2 },
      { x: 1, y: 3 },
      { x: 7, y: 3 },
      { x: 9, y: 3 },
      { x: 8, y: 4 },
      { x: 2, y: 5 },
      { x: 6, y: 5 },
    ],
    static_tnt: [
      { x: 6, y: 2 },
      { x: 4, y: 4 },
      { x: 8, y: 5 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 3: The Clockwork Corridor',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 20,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 1 },
    knight_b_start: { x: 10, y: 5 },
    walls: [
      // Row 0 (edge barriers)
      { x: 2, y: 0 },
      { x: 8, y: 0 },
      // Row 1 (top gates)
      { x: 4, y: 1 },
      { x: 6, y: 1 },
      // Corridor walls (rows 2-4)
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 2, y: 3 },
      { x: 8, y: 3 },
      { x: 2, y: 4 },
      { x: 8, y: 4 },
      // Row 5 (bottom gates)
      { x: 4, y: 5 },
      { x: 6, y: 5 },
      // Row 6 (edge barriers)
      { x: 2, y: 6 },
      { x: 8, y: 6 },
    ],
    static_tnt: [
      { x: 5, y: 0 }, // top center
      { x: 5, y: 6 }, // bottom center
    ],
    moving_barrels: [
      {
        path: [
          { x: 3, y: 3 },
          { x: 4, y: 3 },
          { x: 5, y: 3 },
          { x: 6, y: 3 },
          { x: 7, y: 3 },
          { x: 6, y: 3 },
          { x: 5, y: 3 },
          { x: 4, y: 3 },
        ],
        path_length: 8,
      },
    ],
  },
];

// Convert puzzle to JSON args for stellar CLI
function puzzleToArgs(puzzle: any): string {
  return JSON.stringify({
    id: 0, // Will be assigned by contract
    grid_width: puzzle.grid_width,
    grid_height: puzzle.grid_height,
    min_ticks: puzzle.min_ticks,
    max_ticks: puzzle.max_ticks,
    knight_a_start: puzzle.knight_a_start,
    knight_b_start: puzzle.knight_b_start,
    walls: puzzle.walls,
    static_tnt: puzzle.static_tnt,
    moving_barrels: puzzle.moving_barrels,
    puzzle_hash: Array(32).fill(0), // Will be computed by contract
  });
}

// Add each puzzle using stellar CLI
async function seedPuzzles() {
  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    console.log(`📝 Adding ${puzzle.name}...`);

    try {
      const args = puzzleToArgs(puzzle);

      // Call add_puzzle via stellar CLI
      const result = await $`stellar contract invoke \
        --id ${contractId} \
        --source zknight-admin \
        --network testnet \
        --send yes \
        -- \
        add_puzzle \
        --puzzle ${args}`.text();

      console.log(`   ✅ ${puzzle.name} added successfully!`);
      console.log(`   Result: ${result.trim()}\n`);
    } catch (err: any) {
      console.error(`   ❌ Error adding ${puzzle.name}:`);
      console.error(`   ${err.message}\n`);
    }
  }

  console.log('\n✨ Puzzle seeding complete!');
  console.log('   Verify with: stellar contract invoke --id', contractId, '--network testnet -- get_puzzle_count');
  console.log('   Run `bun run dev:game zknight` to test.');
}

seedPuzzles();
