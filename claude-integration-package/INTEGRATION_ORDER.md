# INTEGRATION ORDER
## Feature Implementation Sequence

Features MUST be implemented in this order. Each feature depends on the previous.

---

## PHASE 1: QIV CORE (Features 1-5)
**Goal:** Establish response uniqueness infrastructure

### Feature 01: Entropy Pool
**Priority:** CRITICAL - Foundation for all variance
**Estimated Time:** 30 minutes
**Dependencies:** None
**Risk Level:** LOW

```
Files to create:
  src/services/vera/qiv/entropyPool.js

Files to modify:
  (none - standalone module)

Tests required:
  - Unit: Entropy harvesting from all 6 sources
  - Unit: Entropy mixing produces different output
  - Unit: No timing side-channels (constant-time ops)
```

### Feature 02: Mutation Engine
**Priority:** CRITICAL - Generates variance vectors
**Estimated Time:** 45 minutes
**Dependencies:** Feature 01 (entropyPool)
**Risk Level:** LOW

```
Files to create:
  src/services/vera/qiv/mutationEngine.js

Files to modify:
  (none - standalone module)

Tests required:
  - Unit: Mutation vectors are bounded [0, 1]
  - Unit: Genetic operators produce expected distributions
  - Unit: Same entropy → same mutation (deterministic)
```

### Feature 03: Drift Accumulator
**Priority:** HIGH - Tracks per-user evolution
**Estimated Time:** 45 minutes
**Dependencies:** Feature 02 (mutationEngine)
**Risk Level:** MEDIUM (requires storage)

```
Files to create:
  src/services/vera/qiv/driftAccumulator.js

Files to modify:
  src/stores/userStore.js (add drift state)

Tests required:
  - Unit: Drift increases over interactions
  - Unit: Drift persists across sessions
  - Integration: Drift loads correctly on app start
```

### Feature 04: Uniqueness Guarantee
**Priority:** HIGH - Prevents duplicate responses
**Estimated Time:** 30 minutes
**Dependencies:** None (can parallel with 01-03)
**Risk Level:** LOW

```
Files to create:
  src/services/vera/qiv/uniquenessGuarantee.js

Files to modify:
  (none - standalone module)

Tests required:
  - Unit: Bloom filter detects duplicates
  - Unit: False positive rate < 1%
  - Unit: Hash function is consistent
```

### Feature 05: Variance Classifier
**Priority:** HIGH - Categorizes response types
**Estimated Time:** 20 minutes
**Dependencies:** Feature 02 (mutationEngine)
**Risk Level:** LOW

```
Files to create:
  src/services/vera/qiv/varianceClassifier.js

Files to modify:
  (none - standalone module)

Tests required:
  - Unit: Distribution is 75/15/10
  - Unit: Safety bounds are respected
  - Unit: Prompt modifiers are appropriate
```

---

## PHASE 2: QIV INTEGRATION (Feature 6)
**Goal:** Connect QIV to Vera's response generation

### Feature 06: QIV Integration
**Priority:** CRITICAL - Actually uses the system
**Estimated Time:** 2 hours
**Dependencies:** Features 01-05
**Risk Level:** HIGH (modifies core Vera logic)

```
Files to create:
  src/services/vera/qiv/index.js (orchestrator)

Files to modify:
  api/vera/chat.ts (inject QIV into response generation)
  src/services/vera/index.js (add QIV to context builder)

Tests required:
  - Integration: QIV modifies API parameters
  - Integration: Responses differ with same input
  - E2E: Full reading flow works
  - Ablation: Compare with/without QIV
```

---

## PHASE 3: PERSISTENCE (Feature 7)
**Goal:** Store soul state in database

### Feature 07: Soul Persistence
**Priority:** MEDIUM - Required for cross-session identity
**Estimated Time:** 1.5 hours
**Dependencies:** Feature 06
**Risk Level:** MEDIUM (database changes)

```
Files to create:
  src/services/vera/qiv/persistence.js
  supabase/migrations/XXXX_add_qiv_state.sql

Files to modify:
  src/services/supabase.js (add QIV queries)
  src/stores/userStore.js (load/save QIV state)

Tests required:
  - Unit: QIV state serializes correctly
  - Integration: State persists to Supabase
  - Integration: State loads on app start
  - E2E: Same user gets consistent drift
```

---

## PHASE 4: METRICS (Feature 8)
**Goal:** Enable A/B testing of QIV

### Feature 08: Ablation Metrics
**Priority:** MEDIUM - Required for production validation
**Estimated Time:** 1 hour
**Dependencies:** Feature 06
**Risk Level:** LOW

```
Files to create:
  src/services/vera/qiv/metrics.js

Files to modify:
  src/services/analytics/index.js (add QIV events)

Tests required:
  - Unit: Metrics fire correctly
  - Integration: Events reach analytics backend
  - E2E: Dashboard shows QIV metrics
```

---

## IMPLEMENTATION CHECKLIST

### Before Starting Each Feature
- [ ] Read feature README in `features/XX_name/`
- [ ] Verify previous feature tests pass
- [ ] Create feature branch: `git checkout -b feat/qiv-XX-name`
- [ ] Note start time

### After Completing Each Feature
- [ ] Run feature unit tests
- [ ] Run integration tests
- [ ] Run full test suite: `npm test`
- [ ] Check bundle size: `npm run analyze`
- [ ] Verify build: `npm run build`
- [ ] Commit with conventional message
- [ ] Note completion time
- [ ] Merge to dev branch

### After All Features Complete
- [ ] Run complete E2E test suite
- [ ] Performance benchmark (startup time, frame rate)
- [ ] Manual QA walkthrough
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production (with feature flag)

---

## ESTIMATED TOTAL TIME

| Phase | Features | Time |
|-------|----------|------|
| Phase 1 | 01-05 | 2.5 hours |
| Phase 2 | 06 | 2 hours |
| Phase 3 | 07 | 1.5 hours |
| Phase 4 | 08 | 1 hour |
| Testing & QA | - | 2 hours |
| **Total** | **8 features** | **~9 hours** |

---

## ABORT CONDITIONS

Stop integration and notify human if:

1. Bundle size exceeds 6MB (current ~4MB)
2. Startup time exceeds 5 seconds
3. Frame rate drops below 30fps on mobile
4. More than 3 features fail initial tests
5. Core Vera functionality breaks (chat, readings)
6. Authentication/payment flows affected

---

*Proceed to `features/01_entropy_pool/README.md`*
