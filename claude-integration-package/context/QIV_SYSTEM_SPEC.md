# QIV SYSTEM SPECIFICATION
## Quantum Initialization Vector Technical Specification

---

## OVERVIEW

QIV (Quantum Initialization Vector) is a bioinformatics-inspired variance system that ensures no two Vera responses are ever identical while maintaining therapeutic safety bounds.

**Core Principle:** "20 bomb techs in a room - 15 solid answers, 3 crazy ones that work, 2 dead techs."

**Mathematical Foundation:**
- Wright-Fisher genetic drift
- Kimura neutral theory
- ChaCha20-style entropy mixing
- Lorenz attractor sensitivity to initial conditions

---

## COMPONENTS

### 1. Entropy Pool
**File:** `entropyPool.js`
**Purpose:** Harvest entropy from multiple uncorrelated sources

**Entropy Sources:**

| Source | Bits | Description |
|--------|------|-------------|
| Timestamp | ~10 | Nanosecond jitter |
| User Cadence | ~4 | Time between messages |
| Lunar Phase | ~4 | Cosmic noise (slow-moving) |
| Session Depth | ~3 | Conversation position |
| Self-Reference | 32 | Hash of previous response |
| Device Entropy | 32 | Hardware RNG when available |

**Mixing Algorithm:** ChaCha20-style quarter-rounds (10 rounds)

**Output:** 16 x 32-bit state array (512 bits total)

### 2. Mutation Engine
**File:** `mutationEngine.js`
**Purpose:** Generate mutation vectors using genetic operators

**Genetic Operators:**

| Operator | Description | Output Range |
|----------|-------------|--------------|
| Point Mutation | Small lexical variations | 0-0.3 |
| Crossover | Structural recombination | 0-0.24 |
| Regulatory | Tonal modulation (sigmoid) | 0-0.36 |
| Insertion | Creative additions (product dist) | 0-0.66 |
| Thermal | Temperature coefficient (beta) | 0-0.4 |
| Amplitude | Response intensity | 0-0.32 |

**Mutation Vector Shape:**
```javascript
{
  lexical: 0.12,      // Word choice variance
  structural: 0.08,   // Sentence structure
  tonal: 0.15,        // Emotional coloring
  creative: 0.22,     // Novel connections
  thermal: 0.18,      // Temperature modulation
  amplitude: 0.14,    // Response intensity
  selector: 0.73,     // For class selection
  phase: 4.21,        // Cyclic variations (radians)
  signature: 'a7b3c9d2', // Unique identifier
  timestamp: 1732766400000,
  entropyBits: 86,    // Total entropy harvested
  varianceClass: 'creative'  // solid/creative/edge
}
```

### 3. Drift Accumulator
**File:** `driftAccumulator.js`
**Purpose:** Track evolutionary drift per user relationship

**State Shape:**
```javascript
{
  coefficient: 0.23,  // Overall drift (0-0.8 max)
  dimensions: {
    lexical: 0.05,    // Drift per dimension (-1 to 1)
    structural: -0.02,
    tonal: 0.08,
    creative: 0.12,
    thermal: 0.03,
    amplitude: -0.01
  },
  totalInteractions: 47,
  momentum: 0.02,     // Rate of change
  fitnessPosition: { x: 0.52, y: 0.61, z: 0.48 },
  speciationIndex: 0.18,  // Uniqueness vs base Vera
  createdAt: 1732680000000,
  lastUpdated: 1732766400000
}
```

**Evolution Formula:**
```
coefficient = min(0.8, 0.1 * log10(totalInteractions + 1))
```

**Drift Update (per interaction):**
```
dimension[i] = (1 - α) * dimension[i] + α * (mutation[i] - 0.5) * 2
where α = 0.1 (learning rate)
```

### 4. Uniqueness Guarantee
**File:** `uniquenessGuarantee.js`
**Purpose:** Prevent duplicate responses via Bloom filter + hash cache

**Bloom Filter Parameters:**
- Size: 1,000,000 bits (125KB)
- Hash functions: 7
- False positive rate: < 1%

**Hash Function:** FNV-1a variant (64-bit output)

**Collision Handling:**
1. Check bloom filter (fast, may false positive)
2. If bloom hit, check exact cache (10,000 recent hashes)
3. If collision confirmed, regenerate with new entropy

### 5. Variance Classifier
**File:** `varianceClassifier.js`
**Purpose:** Categorize mutations into response variance classes

**Distribution:**
| Class | Probability | Temperature | Creativity | Description |
|-------|-------------|-------------|------------|-------------|
| Solid | 75% | 0.6-0.75 | 0-0.3 | Therapeutically grounded |
| Creative | 15% | 0.75-0.88 | 0.3-0.5 | Unexpected angle |
| Edge | 10% | 0.85-0.95 | 0.5-0.7 | Bold, challenging |

**Classification Logic:**
```javascript
if (mutation.selector < 0.75) return 'solid';
if (mutation.selector < 0.90) return 'creative';
return 'edge';
```

**Safety Bounds:**
```javascript
const bounds = {
  solid: { maxTemp: 0.75, maxCreative: 0.3, minStability: 0.7 },
  creative: { maxTemp: 0.88, maxCreative: 0.5, minStability: 0.5 },
  edge: { maxTemp: 0.95, maxCreative: 0.7, minStability: 0.4 }
};
```

---

## QIV ORCHESTRATOR

**File:** `index.js`
**Purpose:** Coordinate all QIV components

**Main Flow:**
```javascript
class QIVSystem {
  constructor(userId) {
    this.entropy = new EntropyPool();
    this.mutation = new MutationEngine();
    this.drift = new DriftAccumulator(userId);
    this.uniqueness = new UniquenessGuarantee();
    this.classifier = new VarianceClassifier();
  }

  generateMutationVector(context) {
    // 1. Harvest entropy
    const entropyState = this.entropy.harvest({
      timestamp: process.hrtime.bigint(),
      userCadence: context.interactionTiming,
      lunarPhase: context.lunarPhase,
      sessionDepth: context.messageCount,
      lastTokens: context.previousResponseHash
    });

    // 2. Get current drift
    const driftCoefficient = this.drift.getCurrentDrift();

    // 3. Generate mutation
    const mutation = this.mutation.generate(entropyState, driftCoefficient);

    // 4. Classify
    mutation.varianceClass = this.classifier.classify(mutation);

    return mutation;
  }

  applyMutation(baseParams, mutation) {
    return {
      temperature: this.mutateTemperature(baseParams.temperature, mutation),
      topP: this.mutateTopP(baseParams.topP, mutation),
      frequencyPenalty: this.mutateFrequencyPenalty(mutation),
      presencePenalty: this.mutatePresencePenalty(mutation),
      promptInjection: this.getPromptModifier(mutation.varianceClass)
    };
  }

  recordResponse(hash, mutation) {
    this.uniqueness.record(hash);
    this.drift.evolve(mutation);
  }

  isUnique(hash) {
    return this.uniqueness.isUnique(hash);
  }
}
```

---

## API INTEGRATION

### Before (Current)
```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: 0.7,
  top_p: 0.9,
  system: systemPrompt,
  messages: messages
});
```

### After (With QIV)
```typescript
// Initialize QIV
const qiv = new QIVSystem(userId);

// Generate mutation
const context = {
  interactionTiming: { lastMessageDelta: timeSinceLastMessage },
  lunarPhase: getLunarPhase(),
  messageCount: conversationHistory.length,
  previousResponseHash: lastResponseHash
};
const mutation = qiv.generateMutationVector(context);

// Apply mutation to params
const baseParams = { temperature: 0.7, topP: 0.9 };
const mutatedParams = qiv.applyMutation(baseParams, mutation);

// Call Claude with mutated params
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: mutatedParams.temperature,
  top_p: mutatedParams.topP,
  frequency_penalty: mutatedParams.frequencyPenalty,
  presence_penalty: mutatedParams.presencePenalty,
  system: systemPrompt + '\n\n' + mutatedParams.promptInjection,
  messages: messages
});

// Record response
const responseHash = hashResponse(response.content[0].text);
if (!qiv.isUnique(responseHash)) {
  // Extremely rare - regenerate
  return regenerateWithNewEntropy();
}
qiv.recordResponse(responseHash, mutation);
```

---

## PROMPT INJECTION BY CLASS

### Solid (75%)
```
Respond with grounded therapeutic insight. Prioritize clarity,
established frameworks, and direct applicability to the user's
situation. Be warm but substantive.
```

### Creative (15%)
```
Take a slightly unexpected angle. Find a connection or
reframe the user might not have considered. Balance novelty
with therapeutic value. Surprise them gently.
```

### Edge (10%)
```
Be bold. Say something true that might challenge them.
Find the paradox or the deeper pattern. Take a creative
risk while maintaining compassion. Make them think.
```

---

## PERFORMANCE REQUIREMENTS

| Metric | Requirement | Measured By |
|--------|-------------|-------------|
| Entropy harvest | < 5ms | performance.now() |
| Mutation generation | < 2ms | performance.now() |
| Uniqueness check | < 1ms | performance.now() |
| Total QIV overhead | < 10ms | E2E timing |
| Memory (bloom filter) | < 150KB | heap snapshot |
| Storage (drift state) | < 1KB | JSON.stringify |

---

## ERROR HANDLING

### Entropy Failure
```javascript
try {
  entropyState = this.entropy.harvest(sources);
} catch (e) {
  // Fallback to timestamp-only entropy
  entropyState = this.entropy.harvestMinimal();
  logWarning('entropy_fallback', e);
}
```

### Collision Detected
```javascript
if (!this.isUnique(hash)) {
  // Increment retry counter
  retries++;
  if (retries > 3) {
    // Accept collision, log anomaly
    logAnomaly('collision_accepted', { hash, retries });
    return response;
  }
  // Regenerate with fresh entropy
  return this.generateWithFreshEntropy(context);
}
```

### Drift Load Failure
```javascript
const driftState = await loadDriftState(userId);
if (!driftState) {
  // Initialize fresh drift
  this.drift = new DriftAccumulator(userId);
  this.drift.initialize();
}
```

---

## TESTING REQUIREMENTS

### Unit Tests

1. **Entropy Pool**
   - Harvests from all sources
   - Mixing produces different output each call
   - Handles missing sources gracefully

2. **Mutation Engine**
   - Output bounded [0, 1] for all dimensions
   - Deterministic given same entropy
   - Drift modulation works correctly

3. **Drift Accumulator**
   - Increases with interactions
   - Caps at 0.8
   - Persists correctly

4. **Uniqueness**
   - Detects duplicates
   - False positive rate < 1%
   - Handles bloom filter overflow

5. **Classifier**
   - Distribution matches 75/15/10 over N=1000

### Integration Tests

1. **Full Flow**
   - Generate mutation → apply → record
   - Verify Claude API accepts mutated params

2. **State Persistence**
   - Drift saves and loads correctly
   - Bloom filter state handles session boundaries

3. **Multi-User**
   - Different users have independent drift
   - No state leakage between users

### Ablation Tests

1. **QIV On vs Off**
   - Measure response uniqueness
   - Measure response latency
   - Measure user engagement

2. **Variance Classes**
   - Solid only vs Full distribution
   - Measure "surprised me" feedback
