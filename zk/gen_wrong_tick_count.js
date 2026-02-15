// Generate test input with wrong tick_count value
// This should FAIL witness generation - win condition not met at wrong tick

const OOB = ["11", "7"];

// Valid solution: 2 moves (Right, Right) to swap
// Knight A: (4,3) → (5,3) → (6,3)
// Knight B: (6,3) → (5,3) → (4,3)
// But we'll claim tick_count = 1 (wrong!)
const moves = ["3", "3"]; // 2 moves

// Pad to 512
while (moves.length < 512) moves.push("4");

const walls = Array(16).fill(OOB);
const static_tnt = Array(8).fill(OOB);
const barrel_path = Array(16).fill(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["4", "3"],
  knight_b_start: ["6", "3"],
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: "1", // WRONG! Should be 2
  puzzle_id: "99",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_wrong_tick_count.json", JSON.stringify(input, null, 2));
console.log(`Generated test_wrong_tick_count.json — should FAIL (wrong tick_count)`);
