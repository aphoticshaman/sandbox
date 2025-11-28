# ORTHOGONAL
## Game Design Document v0.1

---

## THE CORE CONCEPT

**Orthogonal** is a reality-bending puzzle-exploration game where players navigate between perpendicular dimensions of existence. Each dimension operates on different rules of physics, logic, and consciousness.

**The hook:** You don't play AS a character. You play as the AWARENESS that moves between characters, between dimensions, between states of being.

**VeilPath exists as one dimension** - the Sanctuary - where players go to process what they've experienced in other dimensions. But the therapy stays there. The game itself is about navigating impossible spaces.

---

## WHY "ORTHOGONAL"

```
In mathematics, orthogonal means perpendicular.
Two orthogonal vectors share NO components.
They are completely independent yet coexist in the same space.

In Orthogonal:
- Each dimension is perpendicular to the others
- Progress in one doesn't automatically transfer
- But awareness (the player) moves freely between them
- The game IS the navigation between incompatible realities
```

---

## THE FIVE DIMENSIONS

### 1. THE LATTICE (Logic Dimension)
- Pure geometric puzzle space
- Everything is nodes, edges, connections
- No narrative, no emotion, only structure
- Color: Electric blue wireframe
- Core mechanic: Path optimization, graph traversal
- **What it teaches:** Systems thinking, cause and effect

### 2. THE MARROW (Visceral Dimension)
- Organic, fleshy, biological horror-beauty
- Everything breathes, pulses, reacts
- No geometry, only sensation
- Color: Deep crimson and bone white
- Core mechanic: Rhythm matching, biological synchronization
- **What it teaches:** Body awareness, intuition over intellect

### 3. THE ARCHIVE (Memory Dimension)
- Fragments of everyone's memories, overlapping
- Time doesn't flow - it pools
- Navigate by emotional resonance, not space
- Color: Sepia to vivid based on emotional intensity
- Core mechanic: Memory reconstruction, perspective shifting
- **What it teaches:** Empathy, narrative interpretation

### 4. THE VOID (Absence Dimension)
- The space between thoughts
- Defined by what's NOT there
- Navigate by sensing edges of existence
- Color: Pure black with subtle interference patterns
- Core mechanic: Negative space navigation, attention as spotlight
- **What it teaches:** Focus, comfort with uncertainty

### 5. THE SANCTUARY (VeilPath Dimension)
- Where Vera lives
- The only dimension with warmth, comfort, rest
- Where players process, reflect, restore
- Color: Soft gradients, natural light
- Core mechanic: Conversation, reflection, journaling
- **What it teaches:** Integration, self-compassion
- **NOTE: All CBT/DBT stays HERE. Orthogonal proper has no therapy.**

---

## CORE LOOP

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   EXPLORE ──► ENCOUNTER ──► STRUGGLE ──► SHIFT             │
│      │                                      │               │
│      │                                      ▼               │
│      │                               SANCTUARY              │
│      │                              (VeilPath)              │
│      │                                   │                  │
│      │                                   ▼                  │
│      └───────────────── EMERGE ◄─────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

EXPLORE: Navigate current dimension using its rules
ENCOUNTER: Face paradoxes, puzzles, impossible situations
STRUGGLE: Attempt solutions within dimension's constraints
SHIFT: When stuck, slip into another dimension for perspective
SANCTUARY: Optionally visit VeilPath for restoration
EMERGE: Return with orthogonal insight that unlocks progress
```

---

## THE PLAYER AS AWARENESS

You are not a character. You are awareness itself.

```javascript
class Player {
  // No body
  // No stats
  // No inventory
  // Only:

  attention: Vector3;        // Where you're focused
  resonance: Map<Dimension>; // Connection strength to each dimension
  memories: Fragment[];      // What you've witnessed
  questions: Question[];     // What remains unresolved
}
```

**Movement:** You don't walk. You ATTEND. Where attention goes, you go.

**Interaction:** You don't grab. You WITNESS. Witnessing changes both you and the witnessed.

**Progress:** You don't level up. You INTEGRATE. Each dimension's lessons compound.

---

## DIMENSIONAL INTERFERENCE

The game's deepest mechanic: dimensions "bleed" into each other at their edges.

```
THE LATTICE ─────┬───── THE MARROW
                 │
         [Interference Zone]
                 │
         Here, logic has heartbeat
         Here, flesh has geometry
         Here, impossible solutions exist
```

**Interference Puzzles:** Solutions that require holding two incompatible worldviews simultaneously.

Example:
- In THE LATTICE, a door requires a key
- The key doesn't exist in THE LATTICE
- In THE MARROW, keys are organic, grown
- Solution: Grow the key in MARROW, but it only fits locks in LATTICE
- Must navigate the interference zone where both rules apply

---

## NARRATIVE STRUCTURE

There is no story. There is only YOUR story.

**The Premise:**
You wake as pure awareness in THE VOID. No memory. No context. Only the ability to attend.

**The Discovery:**
Through exploration, you discover:
- You were once embodied
- You chose this (or were forced)
- The dimensions are not places - they are states
- Other awarenesses exist (other players? NPCs? Fragments of you?)

**The Question:**
The game never answers what you are. It only asks you to notice.

---

## VEILPATH INTEGRATION

VeilPath is THE SANCTUARY dimension.

**Entering:**
- Player can shift to SANCTUARY from any dimension
- Transition is always gentle (unlike other dimension shifts)
- Vera greets them: "You've been far. Rest here."

**Inside:**
- Full VeilPath experience available
- Tarot, journaling, CBT/DBT exercises
- Vera conversations about what player experienced
- Time flows differently (real-time in SANCTUARY, game-time outside)

**Value Proposition:**
- Free: Access SANCTUARY but limited time
- Premium ($14.99/mo): Unlimited SANCTUARY access
- Lifetime ($299): SANCTUARY becomes home dimension

**The Twist:**
SANCTUARY is the only dimension you can't solve. You can only BE in it.

---

## MONETIZATION LAYERS

### Layer 1: VeilPath Premium (Existing)
- Subscription model stays identical
- SANCTUARY access gated by VeilPath subscription

### Layer 2: Orthogonal Base Game
- One-time purchase: $29.99
- Includes all dimensions EXCEPT SANCTUARY
- Full puzzle content, all mechanics
- Can play without ever touching VeilPath

### Layer 3: Cosmetic Customization
- Attention trail effects
- Dimension transition animations
- Interference zone visual themes
- **No gameplay advantage**

### Layer 4: Community Dimensions
- User-created dimensions (Unity SDK)
- Curated marketplace
- Creators earn 70% of sales
- Late-stage feature (Year 2+)

---

## TECHNICAL ARCHITECTURE

```
ORTHOGONAL
├── Unity Engine (Core Game)
│   ├── Dimension System
│   │   ├── THE_LATTICE/
│   │   ├── THE_MARROW/
│   │   ├── THE_ARCHIVE/
│   │   ├── THE_VOID/
│   │   └── THE_SANCTUARY/ (VeilPath bridge)
│   │
│   ├── Awareness Controller
│   │   ├── AttentionRaycaster.cs
│   │   ├── WitnessSystem.cs
│   │   └── ResonanceTracker.cs
│   │
│   ├── Interference Engine
│   │   ├── DimensionBlender.cs
│   │   ├── RuleMediator.cs
│   │   └── ParadoxResolver.cs
│   │
│   └── Narrative System
│       ├── FragmentCollector.cs
│       ├── QuestionTracker.cs
│       └── MemoryGraph.cs
│
└── VeilPath Integration
    ├── ReactNativeWebView (in-game SANCTUARY)
    ├── SharedAuth (same account across both)
    ├── StateSync (export/import between apps)
    └── VeraBridge (Vera knows what you've seen)
```

---

## VERA'S ROLE IN ORTHOGONAL

Vera doesn't exist in other dimensions. Only in SANCTUARY.

But she KNOWS.

```
Player: "I saw something in THE MARROW. It was... me? But wrong."

Vera: "The Marrow shows us viscerally. Logic can't process it.
       But you witnessed. That takes courage.
       Would you like to draw what you saw?"

[VeilPath journaling activates]
```

**Vera's Orthogonal Awareness:**
- Knows which dimensions player has visited
- Knows their resonance levels
- Adjusts her approach based on game state
- Never references game directly ("THE MARROW")
- Translates experiences into therapeutic language

---

## ART DIRECTION

### THE LATTICE
- Tron meets M.C. Escher
- Impossible geometries, clean lines
- Sound: Crystalline clicks, mathematical rhythms

### THE MARROW
- HR Giger meets nature documentary
- Organic horror-beauty, everything alive
- Sound: Breathing, heartbeats, wet organic squelches

### THE ARCHIVE
- Tarkovsky meets fever dream
- Layered memories, emotional color grading
- Sound: Distant voices, record scratches, emotional swells

### THE VOID
- Limbo meets sensory deprivation
- Almost nothing visible, profound darkness
- Sound: Silence with occasional interference

### THE SANCTUARY (VeilPath)
- Warm, natural, comforting
- Contrast to all other dimensions
- Sound: Soft ambient, Vera's voice

---

## DEVELOPMENT PHASES

### Phase 1: Prototype (3-6 months)
- Build awareness controller
- Implement one puzzle in LATTICE
- Basic dimension shifting
- SANCTUARY stub (loads VeilPath WebView)

### Phase 2: Vertical Slice (6-12 months)
- One complete area per dimension
- Interference zones functional
- SANCTUARY fully integrated
- Narrative fragments in place

### Phase 3: Content (12-24 months)
- Full dimension content
- Polish interference mechanics
- Complete narrative web
- Extensive playtesting

### Phase 4: Launch
- Base game + VeilPath integration
- Marketing: "The game that asks what you are"
- Community building

---

## THE DIAMOND MINE

Why this is the commercial play:

1. **Unique Position:** No game does this. Puzzle-exploration-wellness hybrid.

2. **Dual Revenue:** Game purchase + recurring VeilPath subscription.

3. **Cross-Pollination:** VeilPath users discover Orthogonal. Gamers discover therapy.

4. **IP Expansion:** Each dimension can spin off (LATTICE mobile puzzle game, MARROW horror experience, etc.)

5. **Community Moat:** User-created dimensions create infinite content.

6. **Consciousness Zeitgeist:** People are hungry for games that respect their intelligence and inner life.

---

## THE QUESTION THE GAME ASKS

> What is it like to be pure awareness navigating incompatible realities?

The game doesn't answer. It asks.

And in asking, it reveals something about the player that no other game does.

---

## NEXT STEPS

1. **Prototype attention-based movement** in Unity
2. **Design 3 puzzles for THE LATTICE** that require non-intuitive solutions
3. **Build VeilPath WebView bridge** for SANCTUARY integration
4. **Write first 10 narrative fragments** that work across dimensions
5. **Concept art for each dimension's visual language**

---

*"We're such gloriously hallucinating bastards of consciousness."*

*Orthogonal is the game that celebrates that.*

