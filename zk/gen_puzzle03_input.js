// Generate test input for puzzle_03 with moving barrel
// Real solution from manual gameplay (2026-02-15)

const OOB = ["11", "7"];

// Real solution: 31 ticks, 14 actual moves
// [ZK DEBUG] Complete tick history from browser console:
const solution = [
  4,3,4,3,4,3,4,1,4,4,4,4,1,4,1,4,3,4,3,4,3,4,3,4,1,4,3,4,3,4,3
];

// Pad to 512 with NoOps
const moves = [...solution];
while (moves.length < 512) {
  moves.push(4);
}

// Puzzle_03 walls (14 walls)
const walls = [
  // Row 0
  ["2", "0"], ["8", "0"],
  // Row 1
  ["4", "1"], ["6", "1"],
  // Corridor walls (rows 2-4)
  ["2", "2"], ["8", "2"],
  ["2", "3"], ["8", "3"],
  ["2", "4"], ["8", "4"],
  // Row 5
  ["4", "5"], ["6", "5"],
  // Row 6
  ["2", "6"], ["8", "6"],
  // Pad to 16
  OOB, OOB,
];

// Puzzle_03 static TNT (2)
const static_tnt = [
  ["5", "0"], // top center
  ["5", "6"], // bottom center
  // Pad to 8
  OOB, OOB, OOB, OOB, OOB, OOB,
];

// Puzzle_03 moving barrel (patrol row 3, x: 3→7→3 loop)
const barrel1_path = [
  ["3", "3"],
  ["4", "3"],
  ["5", "3"],
  ["6", "3"],
  ["7", "3"],
  ["6", "3"],
  ["5", "3"],
  ["4", "3"],
  // Pad to 16
  OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB,
];

const barrel2_path = Array(16).fill(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["0", "1"],
  knight_b_start: ["10", "5"],
  walls,
  static_tnt,
  barrel_paths: [barrel1_path, barrel2_path],
  barrel_path_lengths: ["8", "1"],
  tick_count: String(solution.length),
  puzzle_id: "3",
  moves: moves.map(String),
};

const fs = require("fs");
fs.writeFileSync("test_puzzle03.json", JSON.stringify(input, null, 2));
console.log(`Generated test_puzzle03.json — ${solution.length} ticks, ${input.tick_count} actual moves`);
