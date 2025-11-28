# Feature 01: Entropy Pool
## Harvest entropy from multiple uncorrelated sources

---

## OVERVIEW

The entropy pool collects randomness from 6 sources to seed the mutation engine. This is the foundation of QIV - without good entropy, responses become predictable.

**Files to create:**
- `src/services/vera/qiv/entropyPool.js`

**Files to modify:**
- None (standalone module)

**Dependencies:**
- None

**Estimated time:** 30 minutes

---

## IMPLEMENTATION

### Step 1: Create Directory

```bash
mkdir -p src/services/vera/qiv
```

### Step 2: Create entropyPool.js

Copy the implementation from `implementation/entropyPool.js` in this directory.

### Step 3: Verify Implementation

```bash
# Create test file
touch src/services/vera/qiv/__tests__/entropyPool.test.js
```

Add tests:
```javascript
import { EntropyPool } from '../entropyPool';

describe('EntropyPool', () => {
  let pool;

  beforeEach(() => {
    pool = new EntropyPool();
  });

  test('harvest produces 16-element state array', () => {
    const state = pool.harvest({
      timestamp: BigInt(Date.now() * 1000000),
      userCadence: { lastMessageDelta: 5000 },
      lunarPhase: 0.5,
      sessionDepth: 3,
      lastTokens: 'abc123'
    });

    expect(state.state).toHaveLength(16);
    expect(state.totalEntropy).toBeGreaterThan(0);
  });

  test('consecutive harvests produce different states', () => {
    const state1 = pool.harvest({ timestamp: BigInt(Date.now() * 1000000) });
    const state2 = pool.harvest({ timestamp: BigInt(Date.now() * 1000000 + 1000) });

    expect(state1.state).not.toEqual(state2.state);
  });

  test('handles missing sources gracefully', () => {
    const state = pool.harvest({});
    expect(state.state).toHaveLength(16);
  });

  test('entropy estimate is reasonable', () => {
    const state = pool.harvest({
      timestamp: BigInt(Date.now() * 1000000),
      userCadence: { lastMessageDelta: 5000 },
      lunarPhase: 0.5,
      sessionDepth: 3,
      lastTokens: 'abc123def456'
    });

    // Should have at least 40 bits from these sources
    expect(state.totalEntropy).toBeGreaterThan(40);
  });
});
```

### Step 4: Run Tests

```bash
npm test -- --testPathPattern=entropyPool
```

---

## VERIFICATION CHECKLIST

- [ ] File created at correct path
- [ ] All 6 entropy sources implemented
- [ ] ChaCha-style mixing (10 rounds)
- [ ] Output is 16 x 32-bit array
- [ ] Entropy estimate calculation works
- [ ] Handles missing sources
- [ ] All tests pass
- [ ] No console errors

---

## COMMON ISSUES

### Issue: BigInt not supported
**Solution:** Use `typeof timestamp === 'bigint'` check and fallback

### Issue: process.hrtime not available (browser)
**Solution:** Use `performance.now() * 1000000` as fallback

### Issue: crypto.subtle not available
**Solution:** Use simpleHash fallback (already implemented)

---

## NEXT STEP

Once all tests pass, proceed to `../02_mutation_engine/README.md`
