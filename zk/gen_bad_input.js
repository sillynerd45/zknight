// Generate bad_input.json — knights on the same row, moving toward each other = collision
// A at (0, 3), B at (10, 3). Right×5 → both at (5,3) → collision!

const OOB = ["11", "7"];

const moves = [];
// Right = 3, five times → A goes to (5,3), B goes to (5,3) → COLLISION
for (let i = 0; i < 5; i++) moves.push("3");
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
  knight_a_start: ["0", "3"],
  knight_b_start: ["10", "3"],
  goal_a: ["10", "3"],
  goal_b: ["0", "3"],
  walls,
  static_tnt,
  barrel_paths: [barrel_path, barrel_path],
  barrel_path_lengths: ["1", "1"],
  tick_count: "5",
  puzzle_id: "1",
  moves,
};

const fs = require("fs");
fs.writeFileSync("bad_input.json", JSON.stringify(input, null, 2));
console.log(`Generated bad_input.json with ${moves.length} moves`);
