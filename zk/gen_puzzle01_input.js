// Generate test input for puzzle_01 with a real solution from gameplay
const OOB = ["11", "7"];

// TODO: record a real solution after the new puzzle layout is played
// Placeholder: all NoOps — not a valid solution, only use after updating moves
const realMoves = [/* fill in after gameplay */];

const moves = realMoves.map(String);
while (moves.length < 512) moves.push("4");

// Puzzle_01 walls (7 walls, pad to 26)
// knightA: (0,6), knightB: (4,3), goalA: (0,3), goalB: (4,6)
const walls = [
  ["1", "3"], ["2", "3"], ["4", "4"],
  ["0", "5"], ["2", "5"], ["2", "6"], ["3", "6"],
  OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB,
  OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB,
];

// No static TNT
const static_tnt = [OOB, OOB, OOB, OOB, OOB, OOB, OOB, OOB];

// No moving barrels
const barrel_path = [];
for (let i = 0; i < 16; i++) barrel_path.push(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["0", "6"],
  knight_b_start: ["4", "3"],
  goal_a: ["0", "3"],
  goal_b: ["4", "6"],
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: String(realMoves.length || 1),
  puzzle_id: "1",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_puzzle01.json", JSON.stringify(input, null, 2));
console.log(`Generated test_puzzle01.json — ${realMoves.length} moves, padded to ${moves.length}`);
