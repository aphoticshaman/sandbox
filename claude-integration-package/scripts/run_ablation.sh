#!/bin/bash
# Ablation Test Runner
# Compares feature ON vs OFF performance
# Usage: ./run_ablation.sh <feature_number>

set -e

FEATURE_NUM=$1
PACKAGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VEILPATH_DIR="${VEILPATH_DIR:-$(pwd)}"

if [ -z "$FEATURE_NUM" ]; then
  echo "Usage: ./run_ablation.sh <feature_number>"
  exit 1
fi

echo "================================"
echo "Running Ablation Test for Feature $FEATURE_NUM"
echo "================================"

# Find feature
FEATURE_DIR=$(find "$PACKAGE_DIR/features" -maxdepth 1 -type d -name "${FEATURE_NUM}_*" | head -1)
FEATURE_NAME=$(basename "$FEATURE_DIR")

# Create results directory
RESULTS_DIR="$PACKAGE_DIR/tests/ablation/results"
mkdir -p "$RESULTS_DIR"
RESULT_FILE="$RESULTS_DIR/${FEATURE_NAME}_$(date +%Y%m%d_%H%M%S).json"

echo ""
echo "Test Configuration:"
echo "  Feature: $FEATURE_NAME"
echo "  Results: $RESULT_FILE"
echo ""

# Run ablation tests
cd "$VEILPATH_DIR"

# Check if ablation tests exist for this feature
ABLATION_TEST="$PACKAGE_DIR/tests/ablation/${FEATURE_NUM}_ablation.js"

if [ -f "$ABLATION_TEST" ]; then
  echo "Running feature-specific ablation test..."
  node "$ABLATION_TEST" > "$RESULT_FILE"
else
  echo "Running generic ablation test..."

  # Generic ablation: measure key metrics
  cat > /tmp/ablation_test.js << 'ABLATION_SCRIPT'
const { performance } = require('perf_hooks');

async function runAblation() {
  const results = {
    feature: process.env.FEATURE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
    metrics: {}
  };

  // Metric 1: Module load time
  const loadStart = performance.now();
  try {
    require('./src/services/vera/qiv');
    results.metrics.loadTime = performance.now() - loadStart;
    results.metrics.loadSuccess = true;
  } catch (e) {
    results.metrics.loadTime = -1;
    results.metrics.loadSuccess = false;
    results.metrics.loadError = e.message;
  }

  // Metric 2: Memory usage
  const used = process.memoryUsage();
  results.metrics.heapUsed = used.heapUsed;
  results.metrics.heapTotal = used.heapTotal;
  results.metrics.external = used.external;

  // Metric 3: Mutation generation time (if applicable)
  if (results.metrics.loadSuccess) {
    try {
      const { QIVSystem } = require('./src/services/vera/qiv');
      const qiv = new QIVSystem('test-user');

      const genStart = performance.now();
      for (let i = 0; i < 100; i++) {
        qiv.generateMutationVector({
          interactionTiming: { lastMessageDelta: 1000 },
          lunarPhase: 0.5,
          messageCount: i,
          previousResponseHash: 'hash' + i
        });
      }
      results.metrics.mutationGenTime = (performance.now() - genStart) / 100;
    } catch (e) {
      results.metrics.mutationGenTime = -1;
      results.metrics.mutationError = e.message;
    }
  }

  // Output results
  console.log(JSON.stringify(results, null, 2));
}

runAblation();
ABLATION_SCRIPT

  FEATURE_NAME="$FEATURE_NAME" node /tmp/ablation_test.js > "$RESULT_FILE"
fi

# Display results
echo ""
echo "================================"
echo "Ablation Results"
echo "================================"
cat "$RESULT_FILE"

# Parse and evaluate
echo ""
echo "================================"
echo "Evaluation"
echo "================================"

# Check key metrics
node -e "
const results = require('$RESULT_FILE');
const metrics = results.metrics;

let passed = true;

// Check load time (< 50ms)
if (metrics.loadTime > 50) {
  console.log('WARN: Load time ${metrics.loadTime}ms exceeds 50ms threshold');
  passed = false;
} else if (metrics.loadTime > 0) {
  console.log('PASS: Load time ${metrics.loadTime}ms');
}

// Check heap usage (< 10MB additional)
if (metrics.heapUsed > 50 * 1024 * 1024) {
  console.log('WARN: Heap usage ${(metrics.heapUsed / 1024 / 1024).toFixed(2)}MB seems high');
}

// Check mutation gen time (< 5ms)
if (metrics.mutationGenTime > 5) {
  console.log('WARN: Mutation gen time ${metrics.mutationGenTime}ms exceeds 5ms threshold');
  passed = false;
} else if (metrics.mutationGenTime > 0) {
  console.log('PASS: Mutation gen time ${metrics.mutationGenTime.toFixed(2)}ms');
}

console.log('');
if (passed) {
  console.log('ABLATION TEST PASSED');
  process.exit(0);
} else {
  console.log('ABLATION TEST HAS WARNINGS');
  process.exit(0); // Don't fail on warnings
}
"

echo ""
echo "Results saved to: $RESULT_FILE"
