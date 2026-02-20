pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/comparators.circom";
include "./node_modules/circomlib/circuits/gates.circom";

// ============================================================================
// ZKnight Circuit - Tick-based Game Logic Verification
// ============================================================================
// This circuit verifies that a sequence of moves (including NoOp ticks) leads
// to a valid win state without any explosions.
//
// Tick model: Each tick = 600ms
// - Player can move OR wait (NoOp) each tick
// - Barrels advance every 2 ticks (1200ms)
// - MAX_TICKS = 512 (~5 min time limit)
// ============================================================================

// ----------------------------------------------------------------------------
// Helper: Compute direction delta from move value
// ----------------------------------------------------------------------------
// Inputs: move (0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp)
// Outputs: dx_a, dy_a, dx_b, dy_b (mirrored deltas)
template DeltaFromMove() {
    signal input move;
    signal output dx_a;
    signal output dy_a;
    signal output dx_b;
    signal output dy_b;

    // Check which move it is
    component isUp = IsEqual();
    component isDown = IsEqual();
    component isLeft = IsEqual();
    component isRight = IsEqual();

    isUp.in[0] <== move;
    isUp.in[1] <== 0;

    isDown.in[0] <== move;
    isDown.in[1] <== 1;

    isLeft.in[0] <== move;
    isLeft.in[1] <== 2;

    isRight.in[0] <== move;
    isRight.in[1] <== 3;

    // Up: A goes -y, B goes +y
    // Down: A goes +y, B goes -y
    // Left: A goes -x, B goes +x
    // Right: A goes +x, B goes -x
    // NoOp: both stay (0, 0)

    // dx_a = Right - Left
    dx_a <== isRight.out - isLeft.out;

    // dy_a = Down - Up
    dy_a <== isDown.out - isUp.out;

    // dx_b = Left - Right (mirrored x)
    dx_b <== isLeft.out - isRight.out;

    // dy_b = Up - Down (mirrored y)
    dy_b <== isUp.out - isDown.out;
}

// ----------------------------------------------------------------------------
// Helper: Clamp a value between min and max
// ----------------------------------------------------------------------------
template Clamp() {
    signal input val;
    signal input min;
    signal input max;
    signal output out;

    component ltMin = LessThan(8);
    component gtMax = GreaterThan(8);

    ltMin.in[0] <== val;
    ltMin.in[1] <== min;

    gtMax.in[0] <== val;
    gtMax.in[1] <== max;

    // If val < min, use min; if val > max, use max; else use val
    signal clamped_low;
    clamped_low <== ltMin.out * (min - val) + val;

    out <== gtMax.out * (max - clamped_low) + clamped_low;
}

// ----------------------------------------------------------------------------
// Helper: Check if position matches a wall
// ----------------------------------------------------------------------------
template IsBlockedByWall() {
    signal input pos[2];
    signal input walls[26][2];
    signal output blocked;

    component xEquals[26];
    component yEquals[26];
    component ands[26];

    signal blockFlags[26];
    signal sum[27];
    sum[0] <== 0;

    for (var i = 0; i < 26; i++) {
        xEquals[i] = IsEqual();
        xEquals[i].in[0] <== pos[0];
        xEquals[i].in[1] <== walls[i][0];

        yEquals[i] = IsEqual();
        yEquals[i].in[0] <== pos[1];
        yEquals[i].in[1] <== walls[i][1];

        ands[i] = AND();
        ands[i].a <== xEquals[i].out;
        ands[i].b <== yEquals[i].out;

        blockFlags[i] <== ands[i].out;
        sum[i+1] <== sum[i] + blockFlags[i];
    }

    // blocked = 1 if sum > 0, else 0
    component isBlocked = GreaterThan(8);
    isBlocked.in[0] <== sum[26];
    isBlocked.in[1] <== 0;

    blocked <== isBlocked.out;
}

// ----------------------------------------------------------------------------
// Helper: Check if two positions are equal
// ----------------------------------------------------------------------------
template PositionEquals() {
    signal input a[2];
    signal input b[2];
    signal output equal;

    component xEq = IsEqual();
    component yEq = IsEqual();
    component andGate = AND();

    xEq.in[0] <== a[0];
    xEq.in[1] <== b[0];

    yEq.in[0] <== a[1];
    yEq.in[1] <== b[1];

    andGate.a <== xEq.out;
    andGate.b <== yEq.out;

    equal <== andGate.out;
}

// ----------------------------------------------------------------------------
// Main Circuit
// ----------------------------------------------------------------------------
template ZKnight() {
    // ── PUBLIC INPUTS ──────────────────────────────────────────────────────
    signal input grid_width;                    // always 11
    signal input grid_height;                   // always 7
    signal input knight_a_start[2];             // [x, y]
    signal input knight_b_start[2];             // [x, y]
    signal input goal_a[2];                     // [x, y] — where Knight A must end
    signal input goal_b[2];                     // [x, y] — where Knight B must end
    signal input walls[26][2];                  // padded with {11, 7}
    signal input static_tnt[8][2];              // padded with {11, 7}
    signal input barrel_paths[2][16][2];        // [barrel][step][x/y]
    signal input barrel_path_lengths[2];        // actual lengths <= 16
    signal input tick_count;                    // actual ticks used <= 512
    signal input puzzle_id;

    // ── PRIVATE INPUT ──────────────────────────────────────────────────────
    signal input moves[512];                    // 0=Up, 1=Down, 2=Left, 3=Right, 4=NoOp

    // ── STATE ARRAYS ───────────────────────────────────────────────────────
    signal knightA[513][2];  // Position at each tick (0..512)
    signal knightB[513][2];
    signal barrelSteps[513][2];  // Barrel step indices at each tick

    // Initialize starting positions
    knightA[0][0] <== knight_a_start[0];
    knightA[0][1] <== knight_a_start[1];
    knightB[0][0] <== knight_b_start[0];
    knightB[0][1] <== knight_b_start[1];
    barrelSteps[0][0] <== 0;
    barrelSteps[0][1] <== 0;

    // ── PRE-DECLARE ALL SIGNALS FOR THE LOOP ───────────────────────────────
    component deltas[512];
    component clampAx[512];
    component clampAy[512];
    component clampBx[512];
    component clampBy[512];
    component wallCheckA[512];
    component wallCheckB[512];

    component knightCollision[512];
    component crossingCheckA[512];
    component crossingCheckB[512];
    component crossingAnd[512];
    component staticTNTCheckA[512][8];
    component staticTNTCheckB[512][8];
    component barrelCheckA[512][2];
    component barrelCheckB[512][2];

    component isPastEnd[512];

    signal nextStep[512][2];
    signal div[512][2];
    signal mod[512][2];
    component gteLength[512][2];

    signal barrelPos[512][2][2];
    signal stepSelectors[512][2][16];
    signal xSum[512][2][17];
    signal ySum[512][2][17];
    component stepEq[512][2][16];

    signal nextA[512][2];
    signal nextB[512][2];
    signal boundedA[512][2];
    signal boundedB[512][2];
    signal resolvedA[512][2];
    signal resolvedB[512][2];

    component posEquals[512];
    component oldAeqNewB[512];
    component oldBeqNewA[512];
    signal isCrossing[512];

    signal staticHitsA[512][9];
    signal staticHitsB[512][9];
    signal hitStaticTNT_A[512];
    signal hitStaticTNT_B[512];
    component staticHitA_gt[512];
    component staticHitB_gt[512];

    signal barrelHitsA[512][3];
    signal barrelHitsB[512][3];
    signal hitBarrel_A[512];
    signal hitBarrel_B[512];
    component barrelHitA_gt[512];
    component barrelHitB_gt[512];

    signal anyExplosion[512];
    signal shouldCheck[512];

    // ── MAIN TICK LOOP ─────────────────────────────────────────────────────
    for (var t = 0; t < 512; t++) {
        // ── Step 1: Check if past the end ──────────────────────────────
        isPastEnd[t] = GreaterEqThan(10);
        isPastEnd[t].in[0] <== t;
        isPastEnd[t].in[1] <== tick_count;

        // ── Step 2: Barrel advancement (every 2 ticks, skip tick 0) ────
        // Use compile-time var since t is loop constant (saves ~512 constraints)
        var shouldAdvanceHere = (t > 0 && t % 2 == 0) ? 1 : 0;

        // For each barrel
        for (var b = 0; b < 2; b++) {
            // nextStep = currentStep + shouldAdvanceHere
            nextStep[t][b] <== barrelSteps[t][b] + shouldAdvanceHere;

            // wrappedStep = nextStep % barrel_path_lengths[b]
            // div = nextStep >= path_length ? 1 : 0
            gteLength[t][b] = GreaterEqThan(8);
            gteLength[t][b].in[0] <== nextStep[t][b];
            gteLength[t][b].in[1] <== barrel_path_lengths[b];

            div[t][b] <== gteLength[t][b].out;
            mod[t][b] <== nextStep[t][b] - div[t][b] * barrel_path_lengths[b];

            barrelSteps[t+1][b] <== mod[t][b];
        }

        // Get barrel positions based on POST-advancement steps (Bug fix)
        // Per spec (ZKNIGHT_CONTEXT.md Section 5), barrels advance BEFORE collision checks
        for (var b = 0; b < 2; b++) {
            xSum[t][b][0] <== 0;
            ySum[t][b][0] <== 0;

            for (var s = 0; s < 16; s++) {
                stepEq[t][b][s] = IsEqual();
                stepEq[t][b][s].in[0] <== barrelSteps[t+1][b];  // Use post-advancement step
                stepEq[t][b][s].in[1] <== s;
                stepSelectors[t][b][s] <== stepEq[t][b][s].out;

                xSum[t][b][s+1] <== xSum[t][b][s] + stepSelectors[t][b][s] * barrel_paths[b][s][0];
                ySum[t][b][s+1] <== ySum[t][b][s] + stepSelectors[t][b][s] * barrel_paths[b][s][1];
            }

            barrelPos[t][b][0] <== xSum[t][b][16];
            barrelPos[t][b][1] <== ySum[t][b][16];
        }

        // ── Step 3: Compute intended next positions ────────────────────
        deltas[t] = DeltaFromMove();
        deltas[t].move <== moves[t];

        nextA[t][0] <== knightA[t][0] + deltas[t].dx_a;
        nextA[t][1] <== knightA[t][1] + deltas[t].dy_a;
        nextB[t][0] <== knightB[t][0] + deltas[t].dx_b;
        nextB[t][1] <== knightB[t][1] + deltas[t].dy_b;

        // ── Step 4: Clamp to grid bounds ───────────────────────────────
        clampAx[t] = Clamp();
        clampAx[t].val <== nextA[t][0];
        clampAx[t].min <== 0;
        clampAx[t].max <== grid_width - 1;

        clampAy[t] = Clamp();
        clampAy[t].val <== nextA[t][1];
        clampAy[t].min <== 0;
        clampAy[t].max <== grid_height - 1;

        clampBx[t] = Clamp();
        clampBx[t].val <== nextB[t][0];
        clampBx[t].min <== 0;
        clampBx[t].max <== grid_width - 1;

        clampBy[t] = Clamp();
        clampBy[t].val <== nextB[t][1];
        clampBy[t].min <== 0;
        clampBy[t].max <== grid_height - 1;

        boundedA[t][0] <== clampAx[t].out;
        boundedA[t][1] <== clampAy[t].out;
        boundedB[t][0] <== clampBx[t].out;
        boundedB[t][1] <== clampBy[t].out;

        // ── Step 5: Wall blocking ──────────────────────────────────────
        wallCheckA[t] = IsBlockedByWall();
        wallCheckA[t].pos[0] <== boundedA[t][0];
        wallCheckA[t].pos[1] <== boundedA[t][1];
        for (var i = 0; i < 26; i++) {
            wallCheckA[t].walls[i][0] <== walls[i][0];
            wallCheckA[t].walls[i][1] <== walls[i][1];
        }

        wallCheckB[t] = IsBlockedByWall();
        wallCheckB[t].pos[0] <== boundedB[t][0];
        wallCheckB[t].pos[1] <== boundedB[t][1];
        for (var i = 0; i < 26; i++) {
            wallCheckB[t].walls[i][0] <== walls[i][0];
            wallCheckB[t].walls[i][1] <== walls[i][1];
        }

        // If blocked, stay at current position; else use bounded position
        resolvedA[t][0] <== wallCheckA[t].blocked * (knightA[t][0] - boundedA[t][0]) + boundedA[t][0];
        resolvedA[t][1] <== wallCheckA[t].blocked * (knightA[t][1] - boundedA[t][1]) + boundedA[t][1];
        resolvedB[t][0] <== wallCheckB[t].blocked * (knightB[t][0] - boundedB[t][0]) + boundedB[t][0];
        resolvedB[t][1] <== wallCheckB[t].blocked * (knightB[t][1] - boundedB[t][1]) + boundedB[t][1];

        // ── Step 6: Collision checks (only if not past end) ────────────
        // Knight-knight collision
        posEquals[t] = PositionEquals();
        posEquals[t].a[0] <== resolvedA[t][0];
        posEquals[t].a[1] <== resolvedA[t][1];
        posEquals[t].b[0] <== resolvedB[t][0];
        posEquals[t].b[1] <== resolvedB[t][1];

        // Crossing detection: oldA == newB AND oldB == newA
        oldAeqNewB[t] = PositionEquals();
        oldAeqNewB[t].a[0] <== knightA[t][0];
        oldAeqNewB[t].a[1] <== knightA[t][1];
        oldAeqNewB[t].b[0] <== resolvedB[t][0];
        oldAeqNewB[t].b[1] <== resolvedB[t][1];

        oldBeqNewA[t] = PositionEquals();
        oldBeqNewA[t].a[0] <== knightB[t][0];
        oldBeqNewA[t].a[1] <== knightB[t][1];
        oldBeqNewA[t].b[0] <== resolvedA[t][0];
        oldBeqNewA[t].b[1] <== resolvedA[t][1];

        crossingAnd[t] = AND();
        crossingAnd[t].a <== oldAeqNewB[t].equal;
        crossingAnd[t].b <== oldBeqNewA[t].equal;

        isCrossing[t] <== crossingAnd[t].out;

        // Static TNT collisions
        staticHitsA[t][0] <== 0;
        staticHitsB[t][0] <== 0;

        for (var i = 0; i < 8; i++) {
            staticTNTCheckA[t][i] = PositionEquals();
            staticTNTCheckA[t][i].a[0] <== resolvedA[t][0];
            staticTNTCheckA[t][i].a[1] <== resolvedA[t][1];
            staticTNTCheckA[t][i].b[0] <== static_tnt[i][0];
            staticTNTCheckA[t][i].b[1] <== static_tnt[i][1];

            staticTNTCheckB[t][i] = PositionEquals();
            staticTNTCheckB[t][i].a[0] <== resolvedB[t][0];
            staticTNTCheckB[t][i].a[1] <== resolvedB[t][1];
            staticTNTCheckB[t][i].b[0] <== static_tnt[i][0];
            staticTNTCheckB[t][i].b[1] <== static_tnt[i][1];

            staticHitsA[t][i+1] <== staticHitsA[t][i] + staticTNTCheckA[t][i].equal;
            staticHitsB[t][i+1] <== staticHitsB[t][i] + staticTNTCheckB[t][i].equal;
        }

        staticHitA_gt[t] = GreaterThan(8);
        staticHitA_gt[t].in[0] <== staticHitsA[t][8];
        staticHitA_gt[t].in[1] <== 0;
        hitStaticTNT_A[t] <== staticHitA_gt[t].out;

        staticHitB_gt[t] = GreaterThan(8);
        staticHitB_gt[t].in[0] <== staticHitsB[t][8];
        staticHitB_gt[t].in[1] <== 0;
        hitStaticTNT_B[t] <== staticHitB_gt[t].out;

        // Barrel collisions
        barrelHitsA[t][0] <== 0;
        barrelHitsB[t][0] <== 0;

        for (var b = 0; b < 2; b++) {
            barrelCheckA[t][b] = PositionEquals();
            barrelCheckA[t][b].a[0] <== resolvedA[t][0];
            barrelCheckA[t][b].a[1] <== resolvedA[t][1];
            barrelCheckA[t][b].b[0] <== barrelPos[t][b][0];
            barrelCheckA[t][b].b[1] <== barrelPos[t][b][1];

            barrelCheckB[t][b] = PositionEquals();
            barrelCheckB[t][b].a[0] <== resolvedB[t][0];
            barrelCheckB[t][b].a[1] <== resolvedB[t][1];
            barrelCheckB[t][b].b[0] <== barrelPos[t][b][0];
            barrelCheckB[t][b].b[1] <== barrelPos[t][b][1];

            barrelHitsA[t][b+1] <== barrelHitsA[t][b] + barrelCheckA[t][b].equal;
            barrelHitsB[t][b+1] <== barrelHitsB[t][b] + barrelCheckB[t][b].equal;
        }

        barrelHitA_gt[t] = GreaterThan(8);
        barrelHitA_gt[t].in[0] <== barrelHitsA[t][2];
        barrelHitA_gt[t].in[1] <== 0;
        hitBarrel_A[t] <== barrelHitA_gt[t].out;

        barrelHitB_gt[t] = GreaterThan(8);
        barrelHitB_gt[t].in[0] <== barrelHitsB[t][2];
        barrelHitB_gt[t].in[1] <== 0;
        hitBarrel_B[t] <== barrelHitB_gt[t].out;

        // Any explosion?
        anyExplosion[t] <== posEquals[t].equal + isCrossing[t] + hitStaticTNT_A[t] + hitStaticTNT_B[t] + hitBarrel_A[t] + hitBarrel_B[t];

        // Assert no explosion (only if not past end)
        shouldCheck[t] <== 1 - isPastEnd[t].out;

        // If shouldCheck == 1, then anyExplosion must be 0
        shouldCheck[t] * anyExplosion[t] === 0;

        // ── Step 7: Advance state ──────────────────────────────────────
        knightA[t+1][0] <== resolvedA[t][0];
        knightA[t+1][1] <== resolvedA[t][1];
        knightB[t+1][0] <== resolvedB[t][0];
        knightB[t+1][1] <== resolvedB[t][1];
    }

    // ── TERMINAL ASSERTION ─────────────────────────────────────────────────
    // At tick_count, knights must have reached their goals
    signal finalA[2];
    signal finalB[2];

    signal tickSelectors[513];
    signal finalAx[514];
    signal finalAy[514];
    signal finalBx[514];
    signal finalBy[514];
    component tickEq[513];

    finalAx[0] <== 0;
    finalAy[0] <== 0;
    finalBx[0] <== 0;
    finalBy[0] <== 0;

    for (var t = 0; t <= 512; t++) {
        tickEq[t] = IsEqual();
        tickEq[t].in[0] <== tick_count;
        tickEq[t].in[1] <== t;
        tickSelectors[t] <== tickEq[t].out;

        finalAx[t+1] <== finalAx[t] + tickSelectors[t] * knightA[t][0];
        finalAy[t+1] <== finalAy[t] + tickSelectors[t] * knightA[t][1];
        finalBx[t+1] <== finalBx[t] + tickSelectors[t] * knightB[t][0];
        finalBy[t+1] <== finalBy[t] + tickSelectors[t] * knightB[t][1];
    }

    finalA[0] <== finalAx[513];
    finalA[1] <== finalAy[513];
    finalB[0] <== finalBx[513];
    finalB[1] <== finalBy[513];

    // Assert win condition: A reached goal_a, B reached goal_b
    component winCheckA = PositionEquals();
    winCheckA.a[0] <== finalA[0];
    winCheckA.a[1] <== finalA[1];
    winCheckA.b[0] <== goal_a[0];
    winCheckA.b[1] <== goal_a[1];

    component winCheckB = PositionEquals();
    winCheckB.a[0] <== finalB[0];
    winCheckB.a[1] <== finalB[1];
    winCheckB.b[0] <== goal_b[0];
    winCheckB.b[1] <== goal_b[1];

    winCheckA.equal === 1;
    winCheckB.equal === 1;

    // ── PUBLIC OUTPUTS ─────────────────────────────────────────────────────
    signal output out_puzzle_id;
    signal output out_tick_count;
    signal output out_win;

    out_puzzle_id <== puzzle_id;
    out_tick_count <== tick_count;
    out_win <== 1;
}

// Main component
component main {public [
    grid_width,
    grid_height,
    knight_a_start,
    knight_b_start,
    goal_a,
    goal_b,
    walls,
    static_tnt,
    barrel_paths,
    barrel_path_lengths,
    tick_count,
    puzzle_id
]} = ZKnight();
