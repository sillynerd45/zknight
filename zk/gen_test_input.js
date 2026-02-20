// Generate test_input.json for a trivial puzzle (no walls/TNT/barrels)
// A at (0,0), B at (10,6). Solution: Right×10 then Down×6 = 16 moves.

const OOB = ["11", "7"]; // out-of-bounds sentinel

const moves = [];
// Right = 3, ten times
for (let i = 0; i < 10; i++) moves.push("3");
// Down = 1, six times
for (let i = 0; i < 6; i++) moves.push("1");
// Pad with NoOp = 4
while (moves.length < 512) moves.push("4");

const walls = [];
for (let i = 0; i < 26; i++) walls.push(OOB);

const static_tnt = [];
for (let i = 0; i < 8; i++) static_tnt.push(OOB);

const barrel_path = [];
for (let i = 0; i < 16; i++) barrel_path.push(OOB);

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["0", "0"],
  knight_b_start: ["10", "6"],
  goal_a: ["10", "6"],
  goal_b: ["0", "0"],
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: "16",
  puzzle_id: "1",
  moves,
};

const fs = require("fs");
fs.writeFileSync("test_input.json", JSON.stringify(input, null, 2));
console.log(`Generated test_input.json with ${moves.length} moves`);
