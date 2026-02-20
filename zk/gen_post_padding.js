// Generate test input with real move after tick_count
// This tests that post-tick_count moves are ignored (should still pass if win state is correct)

const OOB = ["11", "7"];

// Use a simple working solution from test_input.json as base
// Just ensure knights reach win state at tick_count, then pad with NoOps and inject a real move
// Simplest: copy the trivial solution (2 Right moves) and inject a bad move after tick_count

// Knight A: (4,3) → Right → (5,3) → Right → (6,3) [final]
// Knight B: (6,3) → Left → (5,3) → Left → (4,3) [final]
// No collision, they pass through (5,3) at different ticks
// Wait, they WILL collide at (5,3) on tick 1!
//
// Let me use the already-working test_input.json setup which uses NoOps:
// Looking at test_input.json... Actually let me just make a minimal valid case:
//
// A=(0,0), B=(1,0) - adjacent horizontally
// Move Right: A→(1,0), B→(0,0) - they swap x but same y, this is crossing!
//
// Ugh. Let me use diagonal positions:
// A=(0,0), B=(1,1)
// Move 1 Right: A→(1,0), B→(0,1)  [no collision]
// Move 2 Down: A→(1,1), B→(0,0)  [A reaches B's start, B reaches A's start - WIN!]
const validMoves = ["3", "1"]; // Right, then Down

// Copy and pad
const moves = [...validMoves];
while (moves.length < 512) moves.push("4");

// Inject a real move after tick_count (should be ignored by circuit)
// This won't affect the outcome since circuit stops processing at tick_count
moves[10] = "0"; // Up move at position 10 (well after tick_count=2)

const walls = Array(26).fill(OOB);
const static_tnt = Array(8).fill(OOB);
const barrel_path = Array(16).fill(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["0", "0"], // Diagonal starting positions
  knight_b_start: ["1", "1"], // One step diagonally away
  goal_a: ["1", "1"],
  goal_b: ["0", "0"],
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: "2", // Process 2 moves (Right, Down), then ignore rest
  puzzle_id: "99",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_post_padding.json", JSON.stringify(input, null, 2));
console.log(`Generated test_post_padding.json — should PASS (post-tick_count moves ignored)`);
