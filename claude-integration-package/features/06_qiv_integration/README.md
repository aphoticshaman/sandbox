# Feature 06: QIV Integration
## Connect QIV System to Vera's Response Generation

---

## OVERVIEW

This is the **critical integration point** where QIV actually affects Vera's responses. All previous features were standalone modules - this feature connects them to the production API.

**Files to create:**
- `src/services/vera/qiv/index.js` (orchestrator - already exists, verify)

**Files to modify:**
- `api/vera/chat.ts` (inject QIV into Claude API call)
- `src/services/vera/index.js` (add QIV to context builder)

**Dependencies:**
- Features 01-05 (all QIV core modules)

**Risk Level:** HIGH - modifies core Vera logic

**Estimated time:** 2 hours

---

## PRE-FLIGHT CHECKS

Before starting this feature:

```bash
# 1. Verify all core modules exist
ls src/services/vera/qiv/
# Should show: entropyPool.js, mutationEngine.js, driftAccumulator.js,
#              uniquenessGuarantee.js, varianceClassifier.js

# 2. Run all unit tests
npm test -- --testPathPattern=qiv

# 3. Verify current API works
curl -X POST http://localhost:3000/api/vera/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Vera", "userId": "test-user"}'
```

---

## IMPLEMENTATION

### Step 1: Update QIV Index (Orchestrator)

The orchestrator in `implementation/index.js` should already exist. Verify it imports all modules correctly.

### Step 2: Modify api/vera/chat.ts

**Location:** `api/vera/chat.ts`

**Find the Claude API call section (around line 80-120):**

```typescript
// BEFORE
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: 0.7,
  top_p: 0.9,
  system: systemPrompt,
  messages: messages
});
```

**Replace with:**

```typescript
// AFTER - WITH QIV INTEGRATION

// Import at top of file
import { QIVSystem } from '../src/services/vera/qiv';

// ... existing code ...

// Before Claude API call:
const qiv = new QIVSystem(userId);

// Build QIV context
const qivContext = {
  interactionTiming: {
    lastMessageDelta: Date.now() - (lastMessageTimestamp || Date.now()),
    messageTimeVariance: calculateMessageVariance(conversationHistory)
  },
  lunarPhase: getLunarPhase(), // Add helper or use 0.5 for now
  messageCount: conversationHistory.length,
  previousResponseHash: lastResponseHash || ''
};

// Generate mutation
const mutation = qiv.generateMutationVector(qivContext);

// Apply mutation to base params
const baseParams = { temperature: 0.7, topP: 0.9 };
const mutatedParams = qiv.applyMutation(baseParams, mutation);

// Build enhanced system prompt
const enhancedSystemPrompt = systemPrompt + '\n\n' +
  `[Response Guidance: ${mutatedParams.promptInjection}]`;

// Call Claude with mutated parameters
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: mutatedParams.temperature,
  top_p: mutatedParams.topP,
  frequency_penalty: mutatedParams.frequencyPenalty || 0,
  presence_penalty: mutatedParams.presencePenalty || 0,
  system: enhancedSystemPrompt,
  messages: messages
});

// After response, record for uniqueness tracking
const responseText = response.content[0].text;
const responseHash = await qiv.uniqueness.hashResponse(responseText);

// Check uniqueness (very rare to fail)
if (!qiv.isUnique(responseHash)) {
  console.warn('[QIV] Collision detected, regenerating...');
  // In production, would regenerate. For now, just log and continue.
}

// Record and evolve drift
qiv.recordResponse(responseHash, mutation);

// Store last response hash for next request
// (Implementation depends on session storage strategy)
```

### Step 3: Add Helper Functions

Add to `api/vera/chat.ts` or a utils file:

```typescript
// Lunar phase calculation (simplified)
function getLunarPhase(): number {
  const LUNAR_CYCLE = 29.53059; // days
  const KNOWN_NEW_MOON = new Date('2024-01-11').getTime();
  const now = Date.now();
  const daysSinceNewMoon = (now - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = (daysSinceNewMoon % LUNAR_CYCLE) / LUNAR_CYCLE;
  return phase;
}

// Message variance calculation
function calculateMessageVariance(history: Message[]): number {
  if (history.length < 2) return 0;

  const deltas: number[] = [];
  for (let i = 1; i < history.length; i++) {
    if (history[i].timestamp && history[i-1].timestamp) {
      deltas.push(history[i].timestamp - history[i-1].timestamp);
    }
  }

  if (deltas.length === 0) return 0;

  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length;
  return Math.sqrt(variance);
}
```

### Step 4: Update Vera Service Index

**Location:** `src/services/vera/index.js`

Add QIV exports:

```javascript
// Add to exports
export { QIVSystem } from './qiv';
export { EntropyPool } from './qiv/entropyPool';
export { MutationEngine } from './qiv/mutationEngine';
export { DriftAccumulator } from './qiv/driftAccumulator';

// Add to buildVeraContext
export function buildVeraContext(user, reading) {
  return {
    sdpm: getSDPMProfile(user),
    psan: getPSANContext(reading),
    casimir: getCasimirState(user),
    // NEW: Add QIV state
    qiv: {
      enabled: true,
      driftCoefficient: user.qivState?.driftCoefficient || 0,
      speciationIndex: user.qivState?.speciationIndex || 0
    }
  };
}
```

---

## TESTING

### Unit Test

```javascript
// src/services/vera/qiv/__tests__/integration.test.js

import { QIVSystem } from '../index';

describe('QIV Integration', () => {
  let qiv;

  beforeEach(() => {
    qiv = new QIVSystem('test-user-123');
  });

  test('generates mutation vector with all components', () => {
    const context = {
      interactionTiming: { lastMessageDelta: 5000 },
      lunarPhase: 0.5,
      messageCount: 5,
      previousResponseHash: 'abc123'
    };

    const mutation = qiv.generateMutationVector(context);

    expect(mutation).toHaveProperty('lexical');
    expect(mutation).toHaveProperty('thermal');
    expect(mutation).toHaveProperty('varianceClass');
    expect(['solid', 'creative', 'edge']).toContain(mutation.varianceClass);
  });

  test('applies mutation to base params', () => {
    const mutation = qiv.generateMutationVector({
      interactionTiming: { lastMessageDelta: 5000 },
      lunarPhase: 0.5,
      messageCount: 5,
      previousResponseHash: 'abc123'
    });

    const baseParams = { temperature: 0.7, topP: 0.9 };
    const mutated = qiv.applyMutation(baseParams, mutation);

    expect(mutated.temperature).toBeGreaterThanOrEqual(0.5);
    expect(mutated.temperature).toBeLessThanOrEqual(0.95);
    expect(mutated.promptInjection).toBeDefined();
  });

  test('records response and evolves drift', () => {
    const mutation = qiv.generateMutationVector({
      interactionTiming: { lastMessageDelta: 5000 },
      lunarPhase: 0.5,
      messageCount: 5,
      previousResponseHash: ''
    });

    const initialDrift = qiv.drift.getCurrentDrift();

    qiv.recordResponse('response-hash-123', mutation);

    const newDrift = qiv.drift.getCurrentDrift();
    expect(newDrift).toBeGreaterThanOrEqual(initialDrift);
  });
});
```

### Integration Test

```javascript
// tests/integration/qiv-api.test.js

describe('QIV API Integration', () => {
  test('API returns different responses for same input', async () => {
    const responses = [];

    for (let i = 0; i < 5; i++) {
      const res = await fetch('/api/vera/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What does The Fool mean?',
          userId: 'test-user-qiv'
        })
      });
      const data = await res.json();
      responses.push(data.response);
    }

    // All responses should be unique
    const unique = new Set(responses);
    expect(unique.size).toBe(5);
  });
});
```

### Ablation Test

```javascript
// tests/ablation/qiv-ablation.test.js

describe('QIV Ablation', () => {
  test('compare response quality with/without QIV', async () => {
    // This test requires manual evaluation
    // Run both versions and compare:
    // 1. Uniqueness rate
    // 2. Response latency
    // 3. Therapeutic appropriateness

    const withQIV = await getResponsesWithQIV(10);
    const withoutQIV = await getResponsesWithoutQIV(10);

    // Log for manual review
    console.log('=== WITH QIV ===');
    withQIV.forEach((r, i) => console.log(`${i}: ${r.substring(0, 100)}...`));

    console.log('=== WITHOUT QIV ===');
    withoutQIV.forEach((r, i) => console.log(`${i}: ${r.substring(0, 100)}...`));

    // Automated checks
    const qivUnique = new Set(withQIV).size;
    const noQivUnique = new Set(withoutQIV).size;

    expect(qivUnique).toBeGreaterThan(noQivUnique);
  });
});
```

---

## VERIFICATION CHECKLIST

- [ ] QIV orchestrator imports all modules
- [ ] api/vera/chat.ts modified correctly
- [ ] Helper functions added (getLunarPhase, calculateMessageVariance)
- [ ] Vera service index exports QIV
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Ablation test shows improvement
- [ ] No regressions in existing functionality
- [ ] Response latency < 100ms overhead
- [ ] Build succeeds

---

## ROLLBACK

If issues occur:

```bash
# Revert API changes
git checkout api/vera/chat.ts
git checkout src/services/vera/index.js

# QIV modules can remain (they're standalone)
```

---

## NEXT STEP

Once integration is verified, proceed to `../07_soul_persistence/README.md`
