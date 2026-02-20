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

// All 10 puzzles (matching frontend puzzle files EXACTLY)
// Field names use contract snake_case; min_ticks/max_ticks are contract-only.
const puzzles = [
  {
    name: 'Puzzle 1: The Broken Mirror',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 3, y: 3 },
    knight_b_start: { x: 8, y: 6 },
    goal_a: { x: 9, y: 6 },
    goal_b: { x: 1, y: 5 },
    walls: [
      { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
      { x: 3, y: 1 }, { x: 7, y: 1 },
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 },
      { x: 5, y: 3 },
      { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 },
      { x: 0, y: 5 }, { x: 4, y: 5 }, { x: 6, y: 5 },
      { x: 0, y: 6 }, { x: 4, y: 6 }, { x: 6, y: 6 }, { x: 10, y: 6 },
    ],
    static_tnt: [
      { x: 0, y: 0 }, { x: 10, y: 0 },
      { x: 1, y: 3 }, { x: 9, y: 3 },
      { x: 9, y: 5 },
      { x: 3, y: 6 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 2: The Crosspath',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 2, y: 5 },
    knight_b_start: { x: 9, y: 5 },
    goal_a: { x: 4, y: 1 },
    goal_b: { x: 2, y: 1 },
    walls: [
      { x: 2, y: 0 }, { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 6, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
      { x: 5, y: 3 }, { x: 10, y: 3 },
      { x: 0, y: 4 }, { x: 3, y: 4 },
      { x: 1, y: 5 }, { x: 10, y: 5 },
      { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 },
    ],
    static_tnt: [
      { x: 4, y: 0 },
      { x: 2, y: 4 }, { x: 9, y: 4 },
      { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 3: The Clockwork Corridor',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 4, y: 6 },
    knight_b_start: { x: 6, y: 6 },
    goal_a: { x: 7, y: 6 },
    goal_b: { x: 3, y: 6 },
    walls: [
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 7, y: 1 }, { x: 8, y: 1 },
      { x: 4, y: 2 }, { x: 6, y: 2 },
      { x: 0, y: 3 }, { x: 4, y: 3 }, { x: 6, y: 3 }, { x: 10, y: 3 },
      { x: 1, y: 4 }, { x: 5, y: 4 }, { x: 9, y: 4 },
      { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 8, y: 5 },
      { x: 2, y: 6 }, { x: 8, y: 6 },
    ],
    static_tnt: [
      { x: 5, y: 2 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 4: The Twin Traps',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 6 },
    knight_b_start: { x: 10, y: 6 },
    goal_a: { x: 0, y: 3 },
    goal_b: { x: 10, y: 0 },
    walls: [
      { x: 5, y: 0 },
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 10, y: 1 },
      { x: 0, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 8, y: 3 },
      { x: 0, y: 4 },
      { x: 0, y: 5 }, { x: 5, y: 5 }, { x: 7, y: 5 }, { x: 10, y: 5 },
      { x: 3, y: 6 }, { x: 5, y: 6 },
    ],
    static_tnt: [
      { x: 2, y: 2 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 5: The Split Vanguard',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 6 },
    knight_b_start: { x: 10, y: 6 },
    goal_a: { x: 3, y: 0 },
    goal_b: { x: 10, y: 1 },
    walls: [
      { x: 2, y: 0 }, { x: 5, y: 0 }, { x: 7, y: 0 },
      { x: 0, y: 1 }, { x: 5, y: 1 },
      { x: 5, y: 2 }, { x: 9, y: 2 },
      { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 8, y: 3 },
      { x: 3, y: 4 },
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 4, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 },
      { x: 4, y: 6 }, { x: 7, y: 6 },
    ],
    static_tnt: [
      { x: 6, y: 0 },
      { x: 0, y: 4 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 6: The Dual Gambit',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 6 },
    knight_b_start: { x: 10, y: 6 },
    goal_a: { x: 6, y: 5 },
    goal_b: { x: 0, y: 2 },
    walls: [
      { x: 9, y: 0 },
      { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
      { x: 1, y: 2 }, { x: 4, y: 2 },
      { x: 7, y: 3 }, { x: 8, y: 3 },
      { x: 1, y: 4 }, { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
      { x: 0, y: 5 }, { x: 5, y: 5 },
      { x: 5, y: 6 },
    ],
    static_tnt: [
      { x: 8, y: 1 },
      { x: 2, y: 2 },
      { x: 6, y: 3 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 7: The Binary Bridge',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 0, y: 6 },
    knight_b_start: { x: 9, y: 6 },
    goal_a: { x: 3, y: 0 },
    goal_b: { x: 6, y: 1 },
    walls: [
      { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 10, y: 1 },
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 },
      { x: 0, y: 3 }, { x: 4, y: 3 }, { x: 7, y: 3 },
      { x: 5, y: 4 },
      { x: 2, y: 5 }, { x: 5, y: 5 },
      { x: 5, y: 6 }, { x: 8, y: 6 }, { x: 10, y: 6 },
    ],
    static_tnt: [
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 8: The Divided Dungeon',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 3, y: 1 },
    knight_b_start: { x: 7, y: 1 },
    goal_a: { x: 8, y: 3 },
    goal_b: { x: 2, y: 3 },
    walls: [
      { x: 3, y: 0 }, { x: 7, y: 0 },
      { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 },
      { x: 1, y: 2 }, { x: 5, y: 2 }, { x: 9, y: 2 },
      { x: 1, y: 3 }, { x: 5, y: 3 }, { x: 9, y: 3 },
      { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 },
      { x: 3, y: 5 }, { x: 7, y: 5 },
    ],
    static_tnt: [
      { x: 3, y: 6 }, { x: 7, y: 6 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 9: The Parallel Pursuit',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 1, y: 6 },
    knight_b_start: { x: 10, y: 5 },
    goal_a: { x: 6, y: 6 },
    goal_b: { x: 3, y: 6 },
    walls: [
      { x: 0, y: 0 }, { x: 4, y: 0 },
      { x: 7, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 1 },
      { x: 0, y: 2 }, { x: 4, y: 2 },
      { x: 5, y: 3 }, { x: 6, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 },
      { x: 0, y: 5 }, { x: 3, y: 5 }, { x: 5, y: 5 },
      { x: 0, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 7, y: 6 },
    ],
    static_tnt: [
      { x: 2, y: 0 },
      { x: 8, y: 2 }, { x: 10, y: 2 },
      { x: 3, y: 3 },
      { x: 10, y: 6 },
    ],
    moving_barrels: [],
  },
  {
    name: 'Puzzle 10: The Two-Faced Fortress',
    grid_width: 11,
    grid_height: 7,
    min_ticks: 5,
    max_ticks: 512,
    knight_a_start: { x: 9, y: 1 },
    knight_b_start: { x: 0, y: 6 },
    goal_a: { x: 1, y: 6 },
    goal_b: { x: 2, y: 0 },
    walls: [
      { x: 1, y: 0 },
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 10, y: 1 },
      { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 10, y: 2 },
      { x: 0, y: 3 }, { x: 5, y: 3 }, { x: 9, y: 3 },
      { x: 6, y: 4 }, { x: 8, y: 4 },
      { x: 9, y: 5 },
      { x: 2, y: 6 }, { x: 4, y: 6 }, { x: 6, y: 6 },
    ],
    static_tnt: [
      { x: 1, y: 3 },
      { x: 0, y: 4 },
    ],
    moving_barrels: [
      {
        path: [
          { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
          { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 },
          { x: 7, y: 0 }, { x: 6, y: 0 }, { x: 5, y: 0 }, { x: 4, y: 0 },
        ],
        path_length: 10,
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
    goal_a: puzzle.goal_a,
    goal_b: puzzle.goal_b,
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
