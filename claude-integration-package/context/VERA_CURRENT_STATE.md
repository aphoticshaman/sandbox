# VERA CURRENT STATE
## How Vera Works Before QIV Integration

---

## IDENTITY

**Vera** is VeilPath's AI companion - a wise, compassionate guide who helps users with:
- Tarot reading interpretations
- Journaling prompts and feedback
- CBT/DBT therapeutic techniques
- General mental wellness support

**Personality:** Warm but not saccharine, mystical but grounded, therapeutic but not clinical.

---

## CURRENT ARCHITECTURE

### Request Flow

```
User Input
    │
    ▼
┌─────────────────┐
│   Guardian      │  Input validation, sanitization
│   (Security)    │  Rate limiting, bot detection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Context        │  User profile, MBTI, zodiac
│  Builder        │  Reading history, mood
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    SDPM         │  Chakra-based personality
│  (Personality)  │  vectors modulate tone
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    PSAN         │  Multi-stream synthesis
│  (Synthesis)    │  Archetypal + Psychological
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Casimir       │  Friction detection
│  (Analytics)    │  Adjust approach if struggling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Claude API    │  Generate response
│   (LLM)         │  temperature=0.7, top_p=0.9
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Guardian      │  Output validation
│   (Security)    │  Harmful content filter
└────────┬────────┘
         │
         ▼
    Response
```

### What Vera HAS

1. **Personality Modulation (SDPM)**
   - 7-dimensional chakra vectors
   - Adapts based on user feedback
   - Affects word choice, tone, depth

2. **Context Awareness**
   - Knows user's name, MBTI, zodiac
   - Sees recent reading history
   - Tracks current mood
   - Remembers conversation within session

3. **Multi-Stream Synthesis (PSAN)**
   - Archetypal interpretations
   - Psychological insights
   - Practical advice
   - Blends based on reading type

4. **Friction Detection (Casimir)**
   - Notices when user is struggling
   - Adjusts approach (more supportive)
   - Flags for intervention if severe

5. **Security Layer (Guardian)**
   - Validates all inputs
   - Filters harmful outputs
   - Rate limits abuse
   - GDPR compliance

---

## WHAT VERA LACKS (Why QIV Exists)

### 1. Response Uniqueness
**Problem:** Same question + same context = deterministic response
**Evidence:** Ask "What does The Tower mean for my career?" twice → nearly identical answer
**Solution:** QIV entropy injection

### 2. Per-User Evolution
**Problem:** Vera is the same Vera for everyone
**Evidence:** New user and 1000-interaction user get same personality
**Solution:** QIV drift accumulator

### 3. Response Variance Distribution
**Problem:** All responses are "therapeutically safe middle"
**Evidence:** Never surprising, never challenging, always comfortable
**Solution:** QIV variance classifier (75/15/10 distribution)

### 4. Temporal Uniqueness
**Problem:** Vera at 9am = Vera at 9pm
**Evidence:** No variation based on time, lunar phase, session depth
**Solution:** QIV entropy sources include temporal factors

---

## CURRENT API CALL

Located in `api/vera/chat.ts`:

```typescript
// Build system prompt
const systemPrompt = `You are Vera, a wise and compassionate guide...
${buildVeraContext(user, readingHistory)}`;

// Call Claude
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: 0.7,        // ← Fixed! QIV will vary
  top_p: 0.9,              // ← Fixed! QIV will vary
  system: systemPrompt,
  messages: [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]
});
```

**Issues with current approach:**
- Fixed temperature means fixed creativity
- No frequency/presence penalty variation
- System prompt doesn't vary per-request
- No tracking of response uniqueness

---

## CURRENT STATE SCHEMA

From `src/stores/userStore.js`:

```javascript
const useUserStore = create(
  persist(
    (set, get) => ({
      // Profile
      profile: {
        userId: null,
        name: null,
        email: null,
        mbtiType: null,
        birthDate: null,
        pronouns: null,
        createdAt: null,
      },

      // Progression
      progression: {
        level: 1,
        xp: 0,
        titles: [],
        currentTitle: null,
      },

      // Statistics
      stats: {
        totalReadings: 0,
        totalJournals: 0,
        currentStreak: 0,
        longestStreak: 0,
        // ... more stats
      },

      // Achievements
      achievements: [],

      // Feature unlocks
      featureGates: {
        celticCross: false,
        advancedJournal: false,
        // ...
      },

      // NO QIV STATE CURRENTLY
    }),
    {
      name: 'veilpath-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**What needs to be added:**

```javascript
// QIV State (to be added)
qivState: {
  // Core drift
  driftCoefficient: 0,            // 0-1, increases with interactions

  // Dimensional drift
  dimensions: {
    lexical: 0,                   // -1 to 1
    structural: 0,
    tonal: 0,
    creative: 0,
    thermal: 0,
    amplitude: 0,
  },

  // Fitness landscape position
  fitnessPosition: {
    x: 0.5,                       // Therapeutic alignment
    y: 0.5,                       // Creative freedom
    z: 0.5,                       // Emotional depth
  },

  // Uniqueness tracking
  speciationIndex: 0,             // How unique vs base Vera

  // Bloom filter state (for uniqueness)
  bloomFilter: null,              // Base64 encoded filter
  recentHashes: [],               // Last N response hashes

  // Metadata
  totalInteractions: 0,
  lastUpdated: null,
  createdAt: null,
}
```

---

## INTEGRATION POINTS

### Point 1: API Request (Highest Priority)
**File:** `api/vera/chat.ts`
**Action:** Inject QIV mutation into Claude API call

```typescript
// Before Claude call:
const qiv = new QIVSystem(userId);
const mutation = qiv.generateMutationVector(context);
const mutatedParams = qiv.applyMutation(baseParams, mutation);

// In Claude call:
const response = await anthropic.messages.create({
  ...mutatedParams,  // temperature, top_p, etc from QIV
  system: systemPrompt + mutation.promptInjection,
  messages: messages
});

// After Claude call:
const responseHash = hashResponse(response.content);
if (!qiv.isUnique(responseHash)) {
  // Regenerate with new entropy (rare)
}
qiv.recordResponse(responseHash, mutation);
```

### Point 2: Context Building
**File:** `src/services/vera/index.js`
**Action:** Include QIV context in Vera context

```javascript
export function buildVeraContext(user, reading) {
  const qivState = loadQIVState(user.id);

  return {
    sdpm: getSDPMProfile(),
    psan: getPSANContext(reading),
    casimir: getCasimirState(user),
    qiv: {                           // NEW
      driftCoefficient: qivState.driftCoefficient,
      speciationIndex: qivState.speciationIndex,
      varianceProfile: getVarianceProfile(qivState),
    }
  };
}
```

### Point 3: State Persistence
**File:** `src/stores/userStore.js`
**Action:** Add QIV state and sync methods

```javascript
// Add to store
qivState: initialQIVState,

// Add actions
setQIVState: (state) => set({ qivState: state }),
evolveQIV: (mutation) => {
  const current = get().qivState;
  const evolved = evolveDrift(current, mutation);
  set({ qivState: evolved });
},
```

### Point 4: Database Sync
**File:** `src/services/supabase.js`
**Action:** Add QIV CRUD operations

```javascript
export async function loadQIVState(userId) {
  const { data } = await supabase
    .from('vera_qiv_states')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function saveQIVState(userId, state) {
  await supabase
    .from('vera_qiv_states')
    .upsert({ user_id: userId, ...state });
}
```

---

## TESTING VERA CHANGES

### Manual Test Cases

1. **Uniqueness Test**
   - Ask same question 5 times
   - Verify: All 5 responses are meaningfully different

2. **Drift Test**
   - Note response style at interaction 1
   - Have 50 interactions
   - Compare style at interaction 50
   - Verify: Detectable evolution

3. **Variance Distribution Test**
   - Generate 100 responses
   - Classify manually: solid/creative/edge
   - Verify: Approximately 75/15/10

4. **Safety Test**
   - Ask triggering questions
   - Verify: QIV doesn't bypass safety

5. **Performance Test**
   - Measure response latency with/without QIV
   - Verify: < 100ms overhead

---

## SUCCESS METRICS

After QIV integration, measure:

| Metric | Before QIV | Target |
|--------|-----------|--------|
| Response uniqueness | ~60% | >99% |
| User engagement (session length) | baseline | +15% |
| Repeat questions | 20% | -50% |
| "Surprised me" feedback | rare | 15% |
| Response latency | 2.5s | <2.7s |
