# Feature 07: Soul Persistence
## Store QIV State in Database for Cross-Session Identity

---

## OVERVIEW

This feature persists QIV drift state to Supabase so Vera's evolution survives app restarts and device changes.

**Files to create:**
- `src/services/vera/qiv/persistence.js`
- `supabase/migrations/XXXX_add_qiv_state.sql`

**Files to modify:**
- `src/services/supabase.js`
- `src/stores/userStore.js`

**Dependencies:**
- Feature 06 (QIV Integration)
- Supabase configured and accessible

**Risk Level:** MEDIUM (database changes)

**Estimated time:** 1.5 hours

---

## IMPLEMENTATION

### Step 1: Create Database Migration

Create `supabase/migrations/[timestamp]_add_qiv_state.sql`:

```sql
-- QIV State Persistence Table
CREATE TABLE IF NOT EXISTS vera_qiv_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core drift
  drift_coefficient DECIMAL(5,4) DEFAULT 0,

  -- Dimensional drift (JSONB for flexibility)
  dimensions JSONB DEFAULT '{
    "lexical": 0,
    "structural": 0,
    "tonal": 0,
    "creative": 0,
    "thermal": 0,
    "amplitude": 0
  }'::jsonb,

  -- Fitness position
  fitness_position JSONB DEFAULT '{
    "x": 0.5,
    "y": 0.5,
    "z": 0.5
  }'::jsonb,

  -- Metrics
  total_interactions INTEGER DEFAULT 0,
  speciation_index DECIMAL(5,4) DEFAULT 0,
  momentum DECIMAL(5,4) DEFAULT 0,

  -- Bloom filter state (base64 encoded)
  bloom_filter TEXT,
  recent_hashes TEXT[], -- Array of recent response hashes

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one state per user
  UNIQUE(user_id)
);

-- Index for fast lookup
CREATE INDEX idx_qiv_user_id ON vera_qiv_states(user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_qiv_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qiv_state_updated
  BEFORE UPDATE ON vera_qiv_states
  FOR EACH ROW
  EXECUTE FUNCTION update_qiv_timestamp();

-- Row Level Security
ALTER TABLE vera_qiv_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own QIV state"
  ON vera_qiv_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own QIV state"
  ON vera_qiv_states FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own QIV state"
  ON vera_qiv_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Step 2: Create Persistence Module

Create `src/services/vera/qiv/persistence.js`:

```javascript
import { supabase } from '../../supabase';

export class QIVPersistence {
  constructor(userId) {
    this.userId = userId;
    this.cache = null;
    this.dirty = false;
  }

  async load() {
    try {
      const { data, error } = await supabase
        .from('vera_qiv_states')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[QIV] Load error:', error);
        return null;
      }

      if (data) {
        this.cache = this.deserialize(data);
        return this.cache;
      }

      return null;
    } catch (e) {
      console.error('[QIV] Load exception:', e);
      return null;
    }
  }

  async save(state) {
    const serialized = this.serialize(state);

    try {
      const { error } = await supabase
        .from('vera_qiv_states')
        .upsert({
          user_id: this.userId,
          ...serialized
        });

      if (error) {
        console.error('[QIV] Save error:', error);
        return false;
      }

      this.cache = state;
      this.dirty = false;
      return true;
    } catch (e) {
      console.error('[QIV] Save exception:', e);
      return false;
    }
  }

  serialize(state) {
    return {
      drift_coefficient: state.coefficient,
      dimensions: state.dimensions,
      fitness_position: state.fitnessPosition,
      total_interactions: state.totalInteractions,
      speciation_index: state.speciationIndex,
      momentum: state.momentum,
      bloom_filter: state.bloomFilter || null,
      recent_hashes: state.recentHashes || []
    };
  }

  deserialize(data) {
    return {
      coefficient: data.drift_coefficient,
      dimensions: data.dimensions,
      fitnessPosition: data.fitness_position,
      totalInteractions: data.total_interactions,
      speciationIndex: data.speciation_index,
      momentum: data.momentum,
      bloomFilter: data.bloom_filter,
      recentHashes: data.recent_hashes || [],
      createdAt: data.created_at,
      lastUpdated: data.updated_at
    };
  }

  // Debounced save - call frequently, saves periodically
  markDirty() {
    this.dirty = true;
    this.scheduleSave();
  }

  scheduleSave() {
    if (this.saveTimeout) return;

    this.saveTimeout = setTimeout(async () => {
      if (this.dirty && this.cache) {
        await this.save(this.cache);
      }
      this.saveTimeout = null;
    }, 5000); // Save at most every 5 seconds
  }

  async flush() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.dirty && this.cache) {
      await this.save(this.cache);
    }
  }
}

export default QIVPersistence;
```

### Step 3: Update userStore.js

Add QIV state to the store:

```javascript
// In userStore.js, add to initial state:
qivState: null,

// Add actions:
loadQIVState: async () => {
  const userId = get().profile?.userId;
  if (!userId) return;

  const persistence = new QIVPersistence(userId);
  const state = await persistence.load();

  if (state) {
    set({ qivState: state });
  }
},

saveQIVState: async (state) => {
  const userId = get().profile?.userId;
  if (!userId) return;

  const persistence = new QIVPersistence(userId);
  await persistence.save(state);
  set({ qivState: state });
},

updateQIVDrift: (mutation) => {
  const current = get().qivState || initializeQIVState();
  const updated = evolveDrift(current, mutation);
  set({ qivState: updated });

  // Debounced save
  const userId = get().profile?.userId;
  if (userId) {
    const persistence = new QIVPersistence(userId);
    persistence.cache = updated;
    persistence.markDirty();
  }
},
```

### Step 4: Apply Migration

```bash
cd supabase
supabase migration up
```

---

## VERIFICATION

```bash
# 1. Check table exists
supabase db query "SELECT * FROM vera_qiv_states LIMIT 1"

# 2. Test save/load
node -e "
const { QIVPersistence } = require('./src/services/vera/qiv/persistence');
const p = new QIVPersistence('test-user-id');
p.save({ coefficient: 0.1, dimensions: {}, fitnessPosition: { x: 0.5, y: 0.5, z: 0.5 } })
  .then(() => p.load())
  .then(console.log);
"
```

---

## ROLLBACK

```bash
# 1. Remove module
rm src/services/vera/qiv/persistence.js

# 2. Revert userStore
git checkout src/stores/userStore.js

# 3. Drop table (CAUTION: loses all QIV state)
supabase db query "DROP TABLE IF EXISTS vera_qiv_states"
```
