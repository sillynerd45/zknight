// Generate test input for puzzle_03
// Real solution from manual gameplay (TODO: update after re-solving new layout)

const OOB = ["11", "7"];

// TODO: record a real solution for the new layout
// knightA: (5,6) → goalA: (5,2), knightB: (5,0) → goalB: (5,4)
const solution = [/* fill in after gameplay */];

// Pad to 512 with NoOps
const moves = [...solution];
while (moves.length < 512) {
  moves.push(4);
}

// Puzzle_03 walls (20 walls, pad to 26)
const walls = [
  ["3", "0"], ["4", "0"], ["6", "0"], ["7", "0"],
  ["2", "1"], ["8", "1"],
  ["2", "2"], ["4", "2"], ["6", "2"], ["7", "2"],
  ["2", "3"], ["4", "3"], ["6", "3"],
  ["2", "4"], ["6", "4"],
  ["3", "5"], ["4", "5"], ["6", "5"],
  ["4", "6"], ["6", "6"],
  // Pad to 26
  OOB, OOB, OOB, OOB, OOB, OOB,
];

// No static TNT
const static_tnt = [OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB];

// No moving barrels
const barrel1_path = Array(16).fill(OOB);
const barrel2_path = Array(16).fill(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["5", "6"],
  knight_b_start: ["5", "0"],
  goal_a: ["5", "2"],
  goal_b: ["5", "4"],
  walls,
  static_tnt,
  barrel_paths: [barrel1_path, barrel2_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: String(solution.length || 1),
  puzzle_id: "3",
  moves: moves.map(String),
};

const fs = require("fs");
fs.writeFileSync("test_puzzle03.json", JSON.stringify(input, null, 2));
console.log(`Generated test_puzzle03.json — ${solution.length} ticks`);
