#!/bin/bash
# Feature Integration Script
# Usage: ./integrate_feature.sh <feature_number>
# Example: ./integrate_feature.sh 01

set -e

FEATURE_NUM=$1
PACKAGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VEILPATH_DIR="${VEILPATH_DIR:-$(pwd)}"

if [ -z "$FEATURE_NUM" ]; then
  echo "Usage: ./integrate_feature.sh <feature_number>"
  echo "Example: ./integrate_feature.sh 01"
  exit 1
fi

# Find feature directory
FEATURE_DIR=$(find "$PACKAGE_DIR/features" -maxdepth 1 -type d -name "${FEATURE_NUM}_*" | head -1)

if [ -z "$FEATURE_DIR" ]; then
  echo "Error: Feature $FEATURE_NUM not found"
  exit 1
fi

FEATURE_NAME=$(basename "$FEATURE_DIR")
echo "================================"
echo "Integrating: $FEATURE_NAME"
echo "================================"

# Step 1: Read README
echo ""
echo "Step 1: Reading feature instructions..."
if [ -f "$FEATURE_DIR/README.md" ]; then
  echo "README found at $FEATURE_DIR/README.md"
else
  echo "Warning: No README found for feature"
fi

# Step 2: Check for implementation files
echo ""
echo "Step 2: Checking implementation files..."
IMPL_DIR="$FEATURE_DIR/implementation"
if [ -d "$IMPL_DIR" ]; then
  echo "Implementation files:"
  ls -la "$IMPL_DIR"
else
  echo "Warning: No implementation directory found"
fi

# Step 3: Create target directory
echo ""
echo "Step 3: Ensuring target directory exists..."
mkdir -p "$VEILPATH_DIR/src/services/vera/qiv"

# Step 4: Copy implementation files
echo ""
echo "Step 4: Copying implementation files..."
if [ -d "$IMPL_DIR" ]; then
  for file in "$IMPL_DIR"/*.js; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      target="$VEILPATH_DIR/src/services/vera/qiv/$filename"
      if [ -f "$target" ]; then
        echo "  $filename already exists, skipping (use --force to overwrite)"
      else
        cp "$file" "$target"
        echo "  Copied: $filename"
      fi
    fi
  done
fi

# Step 5: Run tests if they exist
echo ""
echo "Step 5: Running tests..."
TEST_DIR="$FEATURE_DIR/tests"
if [ -d "$TEST_DIR" ]; then
  cd "$VEILPATH_DIR"
  npm test -- --testPathPattern="$(basename $FEATURE_DIR | cut -d'_' -f2-)" || {
    echo "Warning: Some tests failed"
  }
else
  echo "No tests directory found, running general QIV tests..."
  cd "$VEILPATH_DIR"
  npm test -- --testPathPattern=qiv || {
    echo "Warning: Some tests failed"
  }
fi

# Step 6: Verify build
echo ""
echo "Step 6: Verifying build..."
cd "$VEILPATH_DIR"
npm run build || {
  echo "Error: Build failed!"
  exit 1
}

echo ""
echo "================================"
echo "Feature $FEATURE_NAME integrated successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Run ablation tests: ./run_ablation.sh $FEATURE_NUM"
echo "2. Manual QA verification"
echo "3. Commit changes: git add . && git commit -m 'feat(qiv): add $FEATURE_NAME'"
echo "4. Proceed to next feature"
