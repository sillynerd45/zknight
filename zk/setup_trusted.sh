#!/bin/bash
# ZKnight Trusted Setup Script
# Automates the full Groth16 trusted setup process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
ZK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$ZK_DIR/build"
FRONTEND_ZK_DIR="$ZK_DIR/../zknight-frontend/public/zk"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ZKnight Groth16 Trusted Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}[1/9] Checking prerequisites...${NC}"
if ! command -v snarkjs &> /dev/null; then
    echo -e "${RED}Error: snarkjs not found. Install with: npm install -g snarkjs${NC}"
    exit 1
fi

# Check for download tool (wget or curl)
DOWNLOAD_CMD=""
if command -v wget &> /dev/null; then
    DOWNLOAD_CMD="wget"
elif command -v curl &> /dev/null; then
    DOWNLOAD_CMD="curl"
else
    echo -e "${RED}Error: Neither wget nor curl found. Please install one of them.${NC}"
    exit 1
fi
echo "Using download tool: $DOWNLOAD_CMD"

if [ ! -f "$BUILD_DIR/zknight.r1cs" ]; then
    echo -e "${RED}Error: Circuit not compiled. Run circuit compilation first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prerequisites OK${NC}\n"

# Step 1: Download Powers of Tau (Hermez ceremony pot19)
echo -e "${YELLOW}[2/9] Downloading Powers of Tau (pot19)...${NC}"
if [ -f "$ZK_DIR/pot19_final.ptau" ]; then
    echo -e "${GREEN}✓ pot19_final.ptau already exists, skipping download${NC}\n"
else
    echo "Downloading ~1.4GB file (this may take several minutes)..."

    # Try multiple sources (Hermez S3 URL sometimes blocks access)
    SOURCES=(
        "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_19.ptau"
        "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_19.ptau"
    )

    DOWNLOAD_SUCCESS=false
    for SOURCE_URL in "${SOURCES[@]}"; do
        echo "Trying: $SOURCE_URL"
        if [ "$DOWNLOAD_CMD" = "wget" ]; then
            if wget "$SOURCE_URL" -O "$ZK_DIR/pot19_final.ptau" --progress=bar:force 2>/dev/null; then
                DOWNLOAD_SUCCESS=true
                break
            fi
        else
            if curl -L --progress-bar "$SOURCE_URL" -o "$ZK_DIR/pot19_final.ptau" 2>/dev/null; then
                # Check if download was successful (file should be large)
                FILESIZE=$(stat -f%z "$ZK_DIR/pot19_final.ptau" 2>/dev/null || stat -c%s "$ZK_DIR/pot19_final.ptau" 2>/dev/null || echo "0")
                if [ "$FILESIZE" -gt 1000000000 ]; then
                    DOWNLOAD_SUCCESS=true
                    break
                else
                    rm -f "$ZK_DIR/pot19_final.ptau"
                fi
            fi
        fi
    done

    if [ "$DOWNLOAD_SUCCESS" = false ]; then
        echo -e "${RED}Error: Failed to download from all sources.${NC}"
        echo -e "${YELLOW}Please download manually:${NC}"
        echo "  1. Visit: https://github.com/iden3/snarkjs#7-prepare-phase-2"
        echo "  2. Download powersOfTau28_hez_final_19.ptau"
        echo "  3. Save to: $ZK_DIR/pot19_final.ptau"
        echo "  4. Re-run: npm run setup"
        exit 1
    fi

    echo -e "${GREEN}✓ Download complete${NC}\n"
fi

# Verify file size (should be at least 500MB)
POT_SIZE=$(stat -f%z "$ZK_DIR/pot19_final.ptau" 2>/dev/null || stat -c%s "$ZK_DIR/pot19_final.ptau" 2>/dev/null)
if [ "$POT_SIZE" -lt 500000000 ]; then
    echo -e "${RED}Error: pot19_final.ptau file size is suspiciously small ($POT_SIZE bytes)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ File size OK ($(numfmt --to=iec-i --suffix=B $POT_SIZE 2>/dev/null || echo "$POT_SIZE bytes"))${NC}\n"

# Step 2: Prepare Phase 2
echo -e "${YELLOW}[3/9] Preparing Phase 2 (this takes several minutes)...${NC}"
if [ -f "$ZK_DIR/pot19_pp.ptau" ]; then
    # Validate existing file — section 12 must have non-zero size
    echo "Validating existing pot19_pp.ptau..."
    PTAU_INFO=$(snarkjs fi "$ZK_DIR/pot19_pp.ptau" 2>&1)
    if echo "$PTAU_INFO" | grep -q '!!' ; then
        echo -e "${RED}pot19_pp.ptau is corrupt! Deleting and regenerating...${NC}"
        echo "$PTAU_INFO"
        rm -f "$ZK_DIR/pot19_pp.ptau"
    else
        echo -e "${GREEN}✓ pot19_pp.ptau already exists and is valid, skipping${NC}\n"
    fi
fi

if [ ! -f "$ZK_DIR/pot19_pp.ptau" ]; then
    echo "Running with --max-old-space-size=32768 (32GB)..."
    echo "This step takes 5-15 minutes. You should see verbose FFT progress below."
    NODE_OPTIONS="--max-old-space-size=32768" snarkjs powersoftau prepare phase2 \
        "$ZK_DIR/pot19_final.ptau" \
        "$ZK_DIR/pot19_pp.ptau" \
        -v

    # Validate the output
    echo "Validating generated pot19_pp.ptau..."
    PTAU_INFO=$(snarkjs fi "$ZK_DIR/pot19_pp.ptau" 2>&1)
    if echo "$PTAU_INFO" | grep -q '!!' ; then
        echo -e "${RED}ERROR: pot19_pp.ptau was generated but is corrupt!${NC}"
        echo "$PTAU_INFO"
        echo -e "${RED}This usually means the process ran out of memory.${NC}"
        echo -e "${RED}Close other applications and try again.${NC}"
        rm -f "$ZK_DIR/pot19_pp.ptau"
        exit 1
    fi
    echo -e "${GREEN}✓ Phase 2 preparation complete and validated${NC}\n"
fi

# Step 3: Groth16 Setup
echo -e "${YELLOW}[4/9] Running Groth16 setup (circuit-specific)...${NC}"
if [ -f "$ZK_DIR/zknight_0000.zkey" ]; then
    echo -e "${GREEN}✓ zknight_0000.zkey already exists, skipping${NC}\n"
else
    echo "This step takes 15-30 minutes. Progress will be shown below."
    echo "First 2-5 minutes: Loading files (silent)"
    echo "Then: Computing setup (you'll see section progress)"
    echo ""
    NODE_OPTIONS="--max-old-space-size=32768" snarkjs groth16 setup \
        "$BUILD_DIR/zknight.r1cs" \
        "$ZK_DIR/pot19_pp.ptau" \
        "$ZK_DIR/zknight_0000.zkey"
    echo -e "${GREEN}✓ Groth16 setup complete${NC}\n"
fi

# Step 4: Contribute randomness
echo -e "${YELLOW}[5/9] Contributing randomness to Phase 2...${NC}"
if [ -f "$ZK_DIR/zknight_final.zkey" ]; then
    echo -e "${GREEN}✓ zknight_final.zkey already exists, skipping${NC}\n"
else
    # Generate random entropy from system
    ENTROPY=$(date +%s%N | sha256sum | head -c 64)
    echo "Using entropy: ${ENTROPY:0:32}..."
    snarkjs zkey contribute \
        "$ZK_DIR/zknight_0000.zkey" \
        "$ZK_DIR/zknight_final.zkey" \
        --name="ZKnight Solo Contributor" \
        -e="$ENTROPY"
    echo -e "${GREEN}✓ Randomness contribution complete${NC}\n"
fi

# Step 5: Verify zkey
echo -e "${YELLOW}[6/9] Verifying final zkey...${NC}"
snarkjs zkey verify \
    "$BUILD_DIR/zknight.r1cs" \
    "$ZK_DIR/pot19_pp.ptau" \
    "$ZK_DIR/zknight_final.zkey"
echo -e "${GREEN}✓ ZKey verification passed${NC}\n"

# Step 6: Export verification key
echo -e "${YELLOW}[7/9] Exporting verification key...${NC}"
snarkjs zkey export verificationkey \
    "$ZK_DIR/zknight_final.zkey" \
    "$ZK_DIR/vk.json"
echo -e "${GREEN}✓ Verification key exported to vk.json${NC}\n"

# Step 7: Generate and verify test proof
echo -e "${YELLOW}[8/9] Generating test proof (measuring proving time)...${NC}"
START_TIME=$(date +%s%N)
snarkjs groth16 fullprove \
    "$ZK_DIR/test_input.json" \
    "$BUILD_DIR/zknight_js/zknight.wasm" \
    "$ZK_DIR/zknight_final.zkey" \
    "$ZK_DIR/test_proof.json" \
    "$ZK_DIR/test_public.json"
END_TIME=$(date +%s%N)
PROVE_TIME_MS=$(( (END_TIME - START_TIME) / 1000000 ))
echo -e "${GREEN}✓ Test proof generated in ${PROVE_TIME_MS}ms${NC}"

echo "Verifying test proof..."
snarkjs groth16 verify \
    "$ZK_DIR/vk.json" \
    "$ZK_DIR/test_public.json" \
    "$ZK_DIR/test_proof.json"
echo -e "${GREEN}✓ Test proof verified successfully${NC}\n"

# Step 8: Copy artifacts to frontend
echo -e "${YELLOW}[9/9] Copying WASM and zkey to frontend...${NC}"
mkdir -p "$FRONTEND_ZK_DIR"
cp "$BUILD_DIR/zknight_js/zknight.wasm" "$FRONTEND_ZK_DIR/"
cp "$ZK_DIR/zknight_final.zkey" "$FRONTEND_ZK_DIR/"
echo -e "${GREEN}✓ Files copied to zknight-frontend/public/zk/${NC}\n"

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Trusted Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Output files:"
echo "  • Proving key:        zk/zknight_final.zkey"
echo "  • Verification key:   zk/vk.json"
echo "  • Circuit WASM:       zk/build/zknight_js/zknight.wasm"
echo "  • Frontend assets:    zknight-frontend/public/zk/"
echo ""
echo "Proving performance:"
echo "  • Test proof time:    ${PROVE_TIME_MS}ms"
echo "  • Expected browser:   ~2-5x slower ($(( PROVE_TIME_MS * 2 ))-$(( PROVE_TIME_MS * 5 ))ms)"
echo ""
echo -e "${YELLOW}Note: Large files (*.ptau, *.zkey) should be added to .gitignore${NC}"
echo -e "${YELLOW}Next step: Build Soroban contract (09_SOROBAN_CONTRACT.md)${NC}"
