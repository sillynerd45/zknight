#!/bin/bash
# Verify that trusted setup completed successfully

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ZK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ZK_DIR="$ZK_DIR/../zknight-frontend/public/zk"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ZKnight Trusted Setup Verification${NC}"
echo -e "${BLUE}========================================${NC}\n"

ERRORS=0

# Check required files
check_file() {
    local file="$1"
    local name="$2"
    local required="$3"

    if [ -f "$file" ]; then
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        echo -e "${GREEN}✓${NC} $name ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "$size bytes"))"
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗${NC} $name — MISSING (required)"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${YELLOW}⚠${NC} $name — missing (optional)"
        fi
    fi
}

echo "ZK Directory Files:"
check_file "$ZK_DIR/pot19_final.ptau" "Powers of Tau (pot19)" "false"
check_file "$ZK_DIR/pot19_pp.ptau" "Phase 2 prepared" "false"
check_file "$ZK_DIR/zknight_0000.zkey" "Initial zkey" "false"
check_file "$ZK_DIR/zknight_final.zkey" "Final proving key" "true"
check_file "$ZK_DIR/vk.json" "Verification key" "true"
check_file "$ZK_DIR/build/zknight.r1cs" "R1CS circuit" "true"
check_file "$ZK_DIR/build/zknight_js/zknight.wasm" "WASM circuit" "true"

echo ""
echo "Frontend Assets:"
check_file "$FRONTEND_ZK_DIR/zknight.wasm" "Frontend WASM" "true"
check_file "$FRONTEND_ZK_DIR/zknight_final.zkey" "Frontend proving key" "true"

echo ""

# Run verification if files exist
if [ -f "$ZK_DIR/zknight_final.zkey" ] && [ -f "$ZK_DIR/build/zknight.r1cs" ] && [ -f "$ZK_DIR/pot19_pp.ptau" ]; then
    echo -e "${YELLOW}Verifying zkey integrity...${NC}"
    if snarkjs zkey verify \
        "$ZK_DIR/build/zknight.r1cs" \
        "$ZK_DIR/pot19_pp.ptau" \
        "$ZK_DIR/zknight_final.zkey" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} ZKey verification passed\n"
    else
        echo -e "${RED}✗${NC} ZKey verification failed\n"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Skipping zkey verification (missing files)\n"
fi

# Test proof if possible
if [ -f "$ZK_DIR/vk.json" ] && [ -f "$ZK_DIR/test_proof.json" ] && [ -f "$ZK_DIR/test_public.json" ]; then
    echo -e "${YELLOW}Verifying test proof...${NC}"
    if snarkjs groth16 verify \
        "$ZK_DIR/vk.json" \
        "$ZK_DIR/test_public.json" \
        "$ZK_DIR/test_proof.json" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Test proof verified\n"
    else
        echo -e "${RED}✗${NC} Test proof verification failed\n"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} No test proof found (run setup to generate)\n"
fi

# Summary
echo -e "${BLUE}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Trusted Setup Complete and Valid${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    echo "Ready for:"
    echo "  • Soroban contract integration (vk.json)"
    echo "  • Frontend proving (zknight.wasm + zknight_final.zkey)"
    echo ""
    echo "Next: Build step 09_SOROBAN_CONTRACT.md"
    exit 0
else
    echo -e "${RED}✗ Trusted Setup Incomplete or Invalid${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    echo "Found $ERRORS error(s). Run: npm run setup"
    exit 1
fi
