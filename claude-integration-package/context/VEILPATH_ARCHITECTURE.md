# VEILPATH ARCHITECTURE
## Current Codebase Structure (As of 2025-11-28)

---

## OVERVIEW

VeilPath is a React Native/Expo mental wellness app combining CBT/DBT therapy with tarot readings. Deploys to iOS, Android, and Web (via Vercel).

**Codebase Stats:**
- ~142,000 lines of JavaScript/TypeScript
- ~314 source files
- Framework: React Native + Expo SDK 50
- State: Zustand
- Backend: Vercel Serverless + Supabase
- AI: Anthropic Claude (primary), OpenAI (fallback)

---

## DIRECTORY STRUCTURE

```
veilpath/
├── api/                      # Vercel serverless functions
│   ├── vera/
│   │   └── chat.ts          # ⭐ VERA'S MAIN ENDPOINT
│   ├── interpret.js         # Card interpretation
│   ├── synthesize.js        # Reading synthesis
│   ├── auth/                # Authentication
│   └── webhooks/            # RevenueCat payments
│
├── src/
│   ├── screens/             # React Native screens (27)
│   │   ├── HomeScreen.js
│   │   ├── ReadingScreen.js
│   │   ├── JournalScreen.js
│   │   └── ...
│   │
│   ├── components/          # Reusable components (45)
│   │
│   ├── services/
│   │   ├── vera/            # ⭐ VERA SERVICE LAYER
│   │   │   ├── index.js     # Main orchestrator
│   │   │   ├── sdpm/        # Sanskrit-Derived Phonetic Mapping
│   │   │   ├── psan/        # Predictive Scaffold Attention
│   │   │   ├── casimir/     # Friction analytics
│   │   │   └── qiv/         # ⭐ NEW - Quantum Init Vectors
│   │   │
│   │   ├── guardian/        # Security layer
│   │   ├── hive/            # Multi-provider AI routing
│   │   ├── supabase.js      # Database client
│   │   └── anthropic.js     # Claude API client
│   │
│   ├── stores/              # Zustand state
│   │   ├── userStore.js     # User profile & progress (1172 lines)
│   │   ├── readingStore.js  # Reading history
│   │   └── settingsStore.js # App settings
│   │
│   ├── data/
│   │   ├── tarotDeck.js     # 78-card deck
│   │   ├── cardDatabase.js  # Extended meanings
│   │   └── spreadDefinitions.js
│   │
│   ├── utils/
│   │   ├── cardSynergyMatrix.js
│   │   └── LLMInterpretation.js
│   │
│   └── web/                 # Web-specific components
│       ├── LandingPage.js
│       └── web-styles.css
│
├── assets/                  # Images, fonts, sounds
├── supabase/               # Database config
└── App.js                  # Entry point
```

---

## KEY FILES FOR QIV INTEGRATION

### 1. `api/vera/chat.ts` (~400 lines)
**Role:** Main Vera API endpoint
**Modification Required:** Inject QIV mutation into API parameters

```typescript
// Current flow:
// 1. Validate input (Guardian)
// 2. Build context (user profile, history)
// 3. Call Claude API
// 4. Validate output (Guardian)
// 5. Return response

// After QIV integration:
// 1. Validate input (Guardian)
// 2. Build context (user profile, history)
// 3. Generate QIV mutation ← NEW
// 4. Apply mutation to API params ← NEW
// 5. Call Claude API
// 6. Validate output (Guardian)
// 7. Record response hash ← NEW
// 8. Evolve drift ← NEW
// 9. Return response
```

### 2. `src/services/vera/index.js` (~300 lines)
**Role:** Vera service orchestrator
**Modification Required:** Add QIV to context builder

```javascript
// Current exports:
export { buildVeraContext } from './contextBuilder';
export { processResponse } from './responseProcessor';

// Add:
export { initializeQIV, applyQIVMutation } from './qiv';
```

### 3. `src/stores/userStore.js` (1172 lines)
**Role:** User state management (Zustand)
**Modification Required:** Add QIV drift state

```javascript
// Current state shape:
{
  profile: { userId, name, mbtiType, birthDate },
  progression: { level, xp, titles },
  achievements: [],
  stats: { readings, journals, streaks },
  // ...
}

// Add:
{
  // ... existing state
  qivState: {
    driftCoefficient: 0,
    dimensions: { lexical: 0, structural: 0, ... },
    fitnessPosition: { x: 0.5, y: 0.5, z: 0.5 },
    speciationIndex: 0,
    lastUpdated: null
  }
}
```

### 4. `src/services/supabase.js`
**Role:** Database client
**Modification Required:** Add QIV state queries

```javascript
// Add functions:
export async function loadQIVState(userId) { ... }
export async function saveQIVState(userId, state) { ... }
```

---

## EXISTING VERA SYSTEMS

### SDPM (Sanskrit-Derived Phonetic Mapping)
**Location:** `src/services/vera/sdpm/`
**Purpose:** 7-dimensional personality vectors based on chakras
**Key File:** `VeraPersonality.js`

```javascript
// Chakra vectors (0-1 scale)
{
  muladhara: 0.6,    // Root - stability
  svadhisthana: 0.7, // Sacral - creativity
  manipura: 0.5,     // Solar plexus - will
  anahata: 0.8,      // Heart - compassion
  vishuddha: 0.7,    // Throat - communication
  ajna: 0.6,         // Third eye - intuition
  sahasrara: 0.5     // Crown - spirituality
}
```

**Integration Point:** QIV can modulate these vectors

### PSAN (Predictive Scaffold Attention Networks)
**Location:** `src/services/vera/psan/`
**Purpose:** Multi-stream synthesis (archetypal + psychological + practical)
**Key File:** `TriForkSynthesizer.js`

**Integration Point:** QIV variance class affects stream weights

### Casimir (Friction Analytics)
**Location:** `src/services/vera/casimir/`
**Purpose:** Detect user struggle/friction
**Key File:** `frictionDetector.js`

**Integration Point:** High friction → reduce QIV variance

### Guardian (Security)
**Location:** `src/services/guardian/`
**Purpose:** Input/output validation, rate limiting
**Key File:** `inputValidation.ts`

**Integration Point:** QIV must respect safety bounds

---

## API PARAMETERS

Current Claude API call in `api/vera/chat.ts`:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  temperature: 0.7,           // ← QIV will modify
  top_p: 0.9,                 // ← QIV will modify
  system: systemPrompt,       // ← QIV will inject guidance
  messages: conversationHistory
});
```

**QIV Modification Points:**
- `temperature`: 0.5-0.95 based on variance class
- `top_p`: 0.8-0.98 based on mutation
- `system`: Append variance-appropriate guidance
- `frequency_penalty`: Add based on mutation
- `presence_penalty`: Add based on mutation

---

## STATE PERSISTENCE

### Local (AsyncStorage)
- User preferences
- Cached readings
- Offline journal drafts

### Remote (Supabase)
- User profile
- Reading history
- Journal entries
- Subscription status
- **NEW:** QIV state

### Sync Strategy
- Write-through for critical data
- Eventual consistency for analytics
- QIV state: Write on session end, read on session start

---

## BUILD & DEPLOY

```bash
# Development
npm start                    # Expo dev server
npm run web                  # Web-only

# Production builds
npm run build:ios           # iOS bundle
npm run build:android       # Android bundle
npm run build:web           # Vercel deployment

# Testing
npm test                    # Jest unit tests
npm run test:e2e            # Detox E2E tests
npm run lint                # ESLint

# Analysis
npm run analyze             # Bundle analyzer
```

---

## CRITICAL CONSTRAINTS

1. **Bundle Size:** Must stay under 5MB (currently ~4MB)
2. **Startup Time:** Under 3 seconds cold start
3. **Frame Rate:** 60fps on mid-range devices
4. **API Latency:** Response < 10 seconds
5. **Offline Support:** Core features work offline
6. **Privacy:** No PII in logs, GDPR compliant

---

## CONTACT

If architecture questions arise during integration:
- Check `docs/` directory for additional documentation
- Review git history for context on past decisions
- Document assumptions in `DECISIONS.md`
