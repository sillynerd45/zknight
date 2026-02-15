// Generate test input where barrel collides with knight during NoOp ticks
// This should FAIL witness generation - barrel hits knight

const OOB = ["11", "7"];

// Setup: Knight A stationary at (5,3)
// Barrel path: (3,3) → (4,3) → (5,3) → (6,3)
// On tick 2 (even tick), barrel advances from (4,3) to (5,3) → hits Knight A!
// All moves are NoOps - player is just waiting

const moves = ["4", "4", "4"]; // 3 NoOp ticks

// Pad to 512
while (moves.length < 512) moves.push("4");

const walls = Array(16).fill(OOB);
const static_tnt = Array(8).fill(OOB);

// Barrel path that will collide with knight
const barrel1_path = [
  ["3", "3"], // step 0 (initial position, tick 0)
  ["4", "3"], // step 1 (tick 2 - first advancement)
  ["5", "3"], // step 2 (tick 4 - COLLISION with Knight A!)
  ["6", "3"], // step 3 (would be tick 6, but collision happens first)
  OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB,
];

const barrel2_path = Array(16).fill(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["5", "3"], // Will be hit by barrel
  knight_b_start: ["10", "6"], // Safe position
  walls,
  static_tnt,
  barrel_paths: [barrel1_path, barrel2_path],
  barrel_path_lengths: ["4", "1"],
  tick_count: "3",
  puzzle_id: "99",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_barrel_collision.json", JSON.stringify(input, null, 2));
console.log(`Generated test_barrel_collision.json — should FAIL (barrel hits knight on tick 4)`);
