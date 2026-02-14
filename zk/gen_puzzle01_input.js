// Generate test input for puzzle_01 with a real solution from gameplay
const OOB = ["11", "7"];

// Real solution from playing puzzle_01
const realMoves = [3,3,1,1,1,3,3,3,3,3,3,3,3,0,3,3,3,3,0,0,0,0,0,0,1,1,1];

const moves = realMoves.map(String);
while (moves.length < 512) moves.push("4");

// Puzzle_01 walls (7 walls, pad to 16)
const walls = [
  ["2", "1"], ["4", "2"], ["3", "3"], ["8", "2"],
  ["7", "4"], ["1", "5"], ["9", "5"],
  OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB,
];

// Puzzle_01 static TNT (2, pad to 8)
const static_tnt = [
  ["5", "1"], ["5", "5"],
  OOB, OOB, OOB, OOB, OOB, OOB,
];

// No moving barrels
const barrel_path = [];
for (let i = 0; i < 16; i++) barrel_path.push(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["0", "3"],
  knight_b_start: ["10", "3"],
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: String(realMoves.length),
  puzzle_id: "1",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_puzzle01.json", JSON.stringify(input, null, 2));
console.log(`Generated test_puzzle01.json — ${realMoves.length} moves, padded to ${moves.length}`);
