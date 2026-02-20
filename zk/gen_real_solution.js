// Generate test input for real gameplay solution
const solution = [4,4,4,3,4,3,4,1,4,4,1,4,1,4,3,4,3,4,3,4,3,4,3,4,0,4,4,3,4,1,4,4,0,4,3,4,1,4,2,4,3,4,3,4,3,4,1,4,1,4,1,4,1,4,0,4,0,4,0];

// Pad to 512 with NoOps
const moves = [...solution];
while (moves.length < 512) {
  moves.push(4);
}

const input = {
  grid_width: "11",
  grid_height: "7",
  knight_a_start: ["0", "3"],
  knight_b_start: ["10", "3"],
  goal_a: ["10", "3"],
  goal_b: ["0", "3"],
  walls: [
    ["2", "1"], ["4", "2"], ["3", "3"], ["8", "2"],
    ["7", "4"], ["1", "5"], ["9", "5"],
    ["11", "7"], ["11", "7"], ["11", "7"], ["11", "7"],
    ["11", "7"], ["11", "7"], ["11", "7"], ["11", "7"], ["11", "7"]
  ],
  static_tnt: [
    ["5", "1"], ["5", "5"],
    ["11", "7"], ["11", "7"], ["11", "7"], ["11", "7"],
    ["11", "7"], ["11", "7"]
  ],
  barrel_paths: [
    Array(16).fill(["11", "7"]),
    Array(16).fill(["11", "7"])
  ],
  barrel_path_lengths: ["1", "1"],
  tick_count: "59",
  puzzle_id: "1",
  moves: moves.map(String)
};

console.log(JSON.stringify(input, null, 2));
