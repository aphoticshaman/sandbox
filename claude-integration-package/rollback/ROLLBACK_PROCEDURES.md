# ROLLBACK PROCEDURES
## How to Undo Each Feature if Issues Occur

---

## GENERAL ROLLBACK STRATEGY

The QIV system is designed to be modular and reversible:

1. **Core modules (Features 01-05)** are standalone - deleting them doesn't break existing code
2. **Integration (Feature 06)** modifies existing files - requires git revert
3. **Persistence (Feature 07)** adds database tables - requires migration rollback
4. **Metrics (Feature 08)** adds analytics - can be disabled via feature flag

---

## QUICK ROLLBACK (Full QIV Removal)

If you need to completely remove QIV:

```bash
# 1. Revert API changes
git checkout api/vera/chat.ts
git checkout src/services/vera/index.js

# 2. Remove QIV directory (modules are standalone)
rm -rf src/services/vera/qiv

# 3. Revert user store changes
git checkout src/stores/userStore.js

# 4. Remove database migration (if applied)
# Run: supabase migration rollback

# 5. Verify build
npm run build
```

---

## PER-FEATURE ROLLBACK

### Feature 01: Entropy Pool

**Risk Level:** LOW (standalone module)

**Rollback:**
```bash
rm src/services/vera/qiv/entropyPool.js
```

**Verification:**
```bash
# Ensure no imports of entropyPool
grep -r "entropyPool" src/
# Should return no results (after removing mutation engine)
```

---

### Feature 02: Mutation Engine

**Risk Level:** LOW (standalone module)

**Rollback:**
```bash
rm src/services/vera/qiv/mutationEngine.js
```

**Dependencies to check:**
- If drift accumulator is implemented, it imports mutation engine
- Remove drift accumulator first, or update its imports

---

### Feature 03: Drift Accumulator

**Risk Level:** MEDIUM (has state persistence)

**Rollback:**
```bash
# 1. Remove the module
rm src/services/vera/qiv/driftAccumulator.js

# 2. Revert userStore changes (if made)
git checkout src/stores/userStore.js

# 3. Clear persisted state (AsyncStorage)
# In app: AsyncStorage.removeItem('veilpath-qiv-drift')
```

**Data cleanup:**
```javascript
// Run this to clear drift state from all users
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.getAllKeys()
  .then(keys => keys.filter(k => k.includes('qiv')))
  .then(qivKeys => AsyncStorage.multiRemove(qivKeys));
```

---

### Feature 04: Uniqueness Guarantee

**Risk Level:** LOW (standalone module, in-memory state)

**Rollback:**
```bash
rm src/services/vera/qiv/uniquenessGuarantee.js
```

**Notes:**
- Bloom filter state is in-memory only (unless persisted in Feature 07)
- No cleanup needed for local state

---

### Feature 05: Variance Classifier

**Risk Level:** LOW (standalone module)

**Rollback:**
```bash
rm src/services/vera/qiv/varianceClassifier.js
```

---

### Feature 06: QIV Integration (CRITICAL)

**Risk Level:** HIGH (modifies production API)

**Rollback:**
```bash
# 1. Revert API file
git checkout api/vera/chat.ts

# 2. Revert Vera service index
git checkout src/services/vera/index.js

# 3. Keep or remove QIV modules (optional)
# They won't be called if API is reverted

# 4. Verify API still works
curl -X POST http://localhost:3000/api/vera/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "userId": "test"}'
```

**If git checkout fails (files were modified further):**
```bash
# Manually remove QIV integration code

# In api/vera/chat.ts, remove:
# - QIVSystem import
# - QIV context building
# - Mutation generation
# - Mutated params application
# - Response hash recording

# Restore original Claude API call:
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: 0.7,
  top_p: 0.9,
  system: systemPrompt,
  messages: messages
});
```

---

### Feature 07: Soul Persistence

**Risk Level:** MEDIUM (database changes)

**Rollback:**
```bash
# 1. Remove persistence module
rm src/services/vera/qiv/persistence.js

# 2. Revert supabase changes
git checkout src/services/supabase.js

# 3. Rollback database migration
cd supabase
supabase migration rollback

# OR manually drop the table:
# DROP TABLE IF EXISTS vera_qiv_states;
```

**Data considerations:**
- QIV state data will be lost
- This is acceptable - drift will rebuild naturally
- No user data is lost, only Vera's evolution state

---

### Feature 08: Ablation Metrics

**Risk Level:** LOW (analytics only)

**Rollback:**
```bash
# 1. Remove metrics module
rm src/services/vera/qiv/metrics.js

# 2. Revert analytics integration
git checkout src/services/analytics/index.js

# 3. Optional: Disable QIV metrics in analytics dashboard
# (Depends on analytics platform)
```

---

## EMERGENCY PROCEDURES

### If Production is Broken

1. **Immediate:** Deploy previous known-good version
   ```bash
   git checkout <last-good-commit>
   npm run build && npm run deploy
   ```

2. **Short-term:** Disable QIV via environment variable
   ```bash
   # In .env or Vercel dashboard:
   QIV_ENABLED=false
   ```

3. **In code (api/vera/chat.ts):**
   ```typescript
   const qivEnabled = process.env.QIV_ENABLED !== 'false';

   if (qivEnabled) {
     // QIV code path
   } else {
     // Original code path (no QIV)
   }
   ```

### If Response Quality Degraded

1. **Reduce variance:** Set all responses to 'solid' class
   ```typescript
   // In varianceClassifier.js, temporarily:
   classify(mutation) {
     return 'solid'; // Force all solid
   }
   ```

2. **Lower mutation impact:**
   ```typescript
   // In QIVSystem.applyMutation, reduce effect:
   return {
     temperature: base.temperature + (mutation.thermal * 0.05), // Was 0.15
     // etc.
   };
   ```

### If Memory Issues

1. **Reduce bloom filter size:**
   ```javascript
   // In uniquenessGuarantee.js:
   this.filterSize = 100000; // Was 1000000
   ```

2. **Clear bloom filter more frequently:**
   ```javascript
   // Add to recordResponse:
   if (this.recentHashes.length > 1000) {
     this.reset();
   }
   ```

---

## VERIFICATION AFTER ROLLBACK

After any rollback, verify:

```bash
# 1. Build succeeds
npm run build

# 2. Tests pass
npm test

# 3. API responds correctly
curl -X POST http://localhost:3000/api/vera/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test"}' \
  | jq .

# 4. App starts without errors
npm start

# 5. Console has no QIV-related errors
# (Check browser/device console)
```

---

## SUPPORT

If rollback procedures fail or issues persist:

1. Document the error in `ROLLBACK_ISSUES.md`
2. Save all relevant logs
3. Note exact git commit hash
4. Escalate to human operator
