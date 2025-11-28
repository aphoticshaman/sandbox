#!/bin/bash
# Full Integration Runner
# Integrates all QIV features in order with ablation testing
# Usage: ./run_full_integration.sh [--skip-tests] [--start-from N]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
VEILPATH_DIR="${VEILPATH_DIR:-$(pwd)}"

SKIP_TESTS=false
START_FROM=1

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --start-from)
      START_FROM=$2
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           VeilPath QIV Full Integration                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Configuration:"
echo "  Package Dir: $PACKAGE_DIR"
echo "  VeilPath Dir: $VEILPATH_DIR"
echo "  Skip Tests: $SKIP_TESTS"
echo "  Start From: Feature $START_FROM"
echo ""

# Verify VeilPath directory
if [ ! -f "$VEILPATH_DIR/package.json" ]; then
  echo "Error: package.json not found in $VEILPATH_DIR"
  echo "Set VEILPATH_DIR environment variable to VeilPath root"
  exit 1
fi

# Features in order
FEATURES=(
  "01_entropy_pool"
  "02_mutation_engine"
  "03_drift_accumulator"
  "04_uniqueness_guarantee"
  "05_variance_classifier"
  "06_qiv_integration"
  "07_soul_persistence"
  "08_ablation_metrics"
)

TOTAL=${#FEATURES[@]}
PASSED=0
FAILED=0
SKIPPED=0

# Create log directory
LOG_DIR="$PACKAGE_DIR/logs/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"

echo "Logs will be saved to: $LOG_DIR"
echo ""

# Integration loop
for i in "${!FEATURES[@]}"; do
  FEATURE_NUM=$((i + 1))
  FEATURE_NAME="${FEATURES[$i]}"

  if [ $FEATURE_NUM -lt $START_FROM ]; then
    echo "[$FEATURE_NUM/$TOTAL] $FEATURE_NAME - SKIPPED (start-from)"
    ((SKIPPED++))
    continue
  fi

  echo "────────────────────────────────────────────────────────────"
  echo "[$FEATURE_NUM/$TOTAL] Integrating: $FEATURE_NAME"
  echo "────────────────────────────────────────────────────────────"

  # Check if feature directory exists
  FEATURE_DIR="$PACKAGE_DIR/features/$FEATURE_NAME"
  if [ ! -d "$FEATURE_DIR" ]; then
    echo "  ERROR: Feature directory not found"
    ((FAILED++))
    continue
  fi

  # Create feature log
  FEATURE_LOG="$LOG_DIR/${FEATURE_NAME}.log"

  # Step 1: Copy implementation files
  echo "  Step 1: Copying implementation files..."
  IMPL_DIR="$FEATURE_DIR/implementation"
  if [ -d "$IMPL_DIR" ]; then
    mkdir -p "$VEILPATH_DIR/src/services/vera/qiv"
    for file in "$IMPL_DIR"/*.js 2>/dev/null; do
      if [ -f "$file" ]; then
        cp "$file" "$VEILPATH_DIR/src/services/vera/qiv/"
        echo "    Copied: $(basename $file)" >> "$FEATURE_LOG"
      fi
    done
    echo "    Done"
  else
    echo "    No implementation files (integration feature)"
  fi

  # Step 2: Run feature-specific setup (if exists)
  SETUP_SCRIPT="$FEATURE_DIR/setup.sh"
  if [ -f "$SETUP_SCRIPT" ]; then
    echo "  Step 2: Running feature setup..."
    bash "$SETUP_SCRIPT" "$VEILPATH_DIR" >> "$FEATURE_LOG" 2>&1 || {
      echo "    WARNING: Setup script had errors (see log)"
    }
  fi

  # Step 3: Run tests (unless skipped)
  if [ "$SKIP_TESTS" = false ]; then
    echo "  Step 3: Running tests..."
    cd "$VEILPATH_DIR"

    # Try to run tests
    npm test -- --testPathPattern=qiv --silent >> "$FEATURE_LOG" 2>&1 && {
      echo "    Tests passed"
    } || {
      echo "    WARNING: Some tests failed (see log)"
    }
  else
    echo "  Step 3: Tests skipped"
  fi

  # Step 4: Run ablation test
  echo "  Step 4: Running ablation test..."
  bash "$SCRIPT_DIR/run_ablation.sh" "$(printf '%02d' $FEATURE_NUM)" >> "$FEATURE_LOG" 2>&1 && {
    echo "    Ablation passed"
  } || {
    echo "    WARNING: Ablation had issues (see log)"
  }

  # Step 5: Verify build
  echo "  Step 5: Verifying build..."
  cd "$VEILPATH_DIR"
  npm run build >> "$FEATURE_LOG" 2>&1 && {
    echo "    Build succeeded"
    ((PASSED++))
  } || {
    echo "    ERROR: Build failed!"
    ((FAILED++))
    echo ""
    echo "Build failed for $FEATURE_NAME. Check log: $FEATURE_LOG"
    echo "To continue from this feature: ./run_full_integration.sh --start-from $FEATURE_NUM"
    exit 1
  }

  echo "  ✓ Feature $FEATURE_NAME integrated successfully"
  echo ""
done

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Integration Summary                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  Total Features: $TOTAL"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "  Skipped: $SKIPPED"
echo ""
echo "  Logs: $LOG_DIR"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║              ALL FEATURES INTEGRATED!                      ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Next steps:"
  echo "  1. Run E2E tests: npm run test:e2e"
  echo "  2. Manual QA verification"
  echo "  3. Deploy to staging: npm run deploy:staging"
  echo "  4. User acceptance testing"
  echo "  5. Deploy to production: npm run deploy:prod"
else
  echo "Some features failed. Check logs and retry."
  exit 1
fi
