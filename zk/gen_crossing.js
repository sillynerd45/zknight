// Generate test input for crossing detection (knights swap positions)
// This should FAIL witness generation - crossing is a collision type

const OOB = ["11", "7"];

// Setup: Knights adjacent, horizontally
// Knight A at (4, 3), Knight B at (5, 3)
// Move Right: A tries (5,3), B tries (4,3) → CROSSING
const moves = ["3"]; // Right

// Pad to 512 with NoOps
while (moves.length < 512) moves.push("4");

// No walls, no obstacles - just knights crossing
const walls = Array(16).fill(OOB);
const static_tnt = Array(8).fill(OOB);
const barrel_path = Array(16).fill(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["4", "3"], // Adjacent to B
  knight_b_start: ["5", "3"], // Adjacent to A
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: "1",
  puzzle_id: "99",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_crossing.json", JSON.stringify(input, null, 2));
console.log(`Generated test_crossing.json — should FAIL (crossing detected)`);
