# THE LATTICE
## First Dimension Design Document

---

## ESSENCE

THE LATTICE is pure logic. Pure structure. Pure mathematics.

No narrative. No emotion. No ambiguity.

Only nodes. Only edges. Only paths.

---

## VISUAL IDENTITY

```
     ●───────────●───────────●
     │╲         ╱│╲         ╱│
     │ ╲       ╱ │ ╲       ╱ │
     │  ╲     ╱  │  ╲     ╱  │
     │   ╲   ╱   │   ╲   ╱   │
     │    ╲ ╱    │    ╲ ╱    │
     ●─────●─────●─────●─────●
     │    ╱ ╲    │    ╱ ╲    │
     │   ╱   ╲   │   ╱   ╲   │
     │  ╱     ╲  │  ╱     ╲  │
     │ ╱       ╲ │ ╱       ╲ │
     │╱         ╲│╱         ╲│
     ●───────────●───────────●
```

**Color Palette:**
- Primary: Electric blue (#0066FF)
- Secondary: Deep cyan (#00CCCC)
- Accent: Pure white (#FFFFFF)
- Background: Infinite black (#000000)

**Materials:**
- All wireframe, no solid surfaces
- Lines glow softly, pulse with data
- Nodes emit light when active
- No textures, only geometry

**Lighting:**
- Self-illuminated lines
- No external light sources
- Bloom on intersection points
- Subtle god rays along edges

---

## SPATIAL RULES

### Geometry
- Euclidean in local space
- Non-Euclidean in global space
- What looks close may be far (graph distance ≠ visual distance)
- Impossible connections exist (node A connects to node B, but you can't see B from A)

### Movement
- Attention-based only
- No physics, no gravity
- You don't walk edges, you TRAVERSE them
- Traversal is instant once edge is selected
- Speed is constant (no acceleration)

### Visibility
- See everything connected to current node
- Second-degree connections fade
- Third-degree connections invisible
- No fog of war - pure structural visibility

---

## CORE MECHANICS

### 1. Path Selection

```
Current position: Node A
Connected nodes: [B, C, D, E]
Each edge has: WEIGHT (0-1), LOCKED (bool), TYPE (enum)

Player attention hovers over edge → Edge highlights
Player confirms focus → Traverse to target node
```

**Edge Types:**
| Type | Visual | Traversal |
|------|--------|-----------|
| OPEN | Solid line | Instant |
| WEIGHTED | Dashed line | Costs attention |
| LOCKED | Red line | Requires key |
| ONE_WAY | Arrow | Can't return |
| QUANTUM | Flickering | Destination uncertain |

### 2. Node Interaction

Nodes can contain:
- **Keys**: Unlock edges
- **Fragments**: Narrative pieces (rare in LATTICE)
- **Logic Gates**: Alter graph structure
- **Observers**: Change state when witnessed

```csharp
public enum NodeContent
{
    Empty,
    Key,           // Unlocks specific edge(s)
    Fragment,      // Narrative piece
    Gate_AND,      // Requires multiple activations
    Gate_OR,       // Any activation works
    Gate_NOT,      // Inverts state
    Observer,      // Changes when witnessed
    Portal         // Dimension shift point
}
```

### 3. Graph Mutation

THE LATTICE is not static. Witnessing changes it.

```
State 1: A ─── B ─── C

[Witness node B]

State 2: A ─── B ═══ C
              │
              D (new node appears)
```

**Mutation Triggers:**
- Witnessing specific nodes
- Traversing specific paths
- Time (some edges decay)
- External events (other dimension interference)

---

## PUZZLE TYPES

### Type 1: Shortest Path

**Goal:** Reach target node in minimum traversals
**Twist:** Graph changes as you move
**Solution:** Predict mutation patterns

```
Example:

Start: ●A
       │
       ●B───●C
       │    │
       ●D───●E (Target)

Naive path: A→B→D (dead end, D doesn't connect to E)
True path: A→B→C→E (C opens connection to E when witnessed)
```

### Type 2: State Propagation

**Goal:** Set all nodes to same state
**Mechanic:** Witnessing a node toggles it AND neighbors
**Twist:** Some nodes are locked, can't be toggled

```
Example:

○───●───○
│   │   │
●───○───●
│   │   │
○───●───○

○ = off, ● = on
Goal: All on
```

### Type 3: Key Collection

**Goal:** Collect keys to unlock target edge
**Mechanic:** Keys exist on nodes, edges block paths
**Twist:** Keys may be in paradox nodes (exist only when not observed)

```
Example:

●A─────[LOCKED]─────●B
│                    │
●C──●D──●E──●F──●G──●H
    ▲
    KEY

Path: A→C→D (get key)→E→F→G→H→B→UNLOCK→A→B
```

### Type 4: Observer Paradox

**Goal:** Reach a node that disappears when observed
**Mechanic:** Target node exists only when NOT in attention
**Solution:** Use peripheral awareness, indirect paths

```
Example:

Current: ●A
Target: ●X (disappears when A looks at it)

●A ─── ●B ─── ●C
              │
              ●X (visible from C, not from A or B)

Path: A→B→C→witness X from C→X appears→C→X
```

### Type 5: Time Loop

**Goal:** Navigate a graph that resets
**Mechanic:** After N traversals, return to start
**Solution:** Create permanent changes before reset

```
Example:

Turn 1: A→B (B witnessed, creates edge B→D)
Turn 2: B→C (return, one turn remaining)
Turn 3: C→A (reset triggers)
Turn 4: A→B→D (edge persists from previous loop)
```

---

## PROTOTYPE LEVEL: "FIRST PRINCIPLES"

A complete, self-contained puzzle area to prove the concept.

### Layout

```
                    ●─────●─────●
                   ╱│     │     │╲
                  ╱ │     │     │ ╲
                 ╱  │     │     │  ╲
                ●   ●─────●─────●   ●
                │╲ ╱│     │     │╲ ╱│
                │ ╳ │     │     │ ╳ │
                │╱ ╲│     │     │╱ ╲│
        START → ●───●─────●─────●───● ← EXIT
                │╲ ╱│     │     │╲ ╱│
                │ ╳ │     │     │ ╳ │
                │╱ ╲│     │     │╱ ╲│
                ●   ●─────●─────●   ●
                 ╲  │     │     │  ╱
                  ╲ │     │     │ ╱
                   ╲│     │     │╱
                    ●─────●─────●
```

### Puzzles in Sequence

1. **Intro**: Simply navigate from START to first waypoint (teach traversal)
2. **Weighted Edge**: Encounter edge that costs extra attention (teach resource)
3. **Locked Door**: Find key node, return, unlock (teach collection)
4. **Observer Collapse**: Node that changes when witnessed (teach paradox)
5. **Shortcut**: Graph mutation reveals faster path (teach mutation)
6. **Exit Gate**: Requires state propagation puzzle solution

### Tutorial Integration

No text. No prompts. Just structure teaching function.

- First edge is the only option → Learn to traverse
- Second node has two edges → Learn to choose
- Third area has a locked edge → Learn to explore
- Fourth puzzle requires backtracking → Learn graph memory
- Fifth puzzle requires prediction → Learn mutation patterns

---

## AUDIO DESIGN

### Ambient
- Pure sine waves, very low
- Different frequencies for different areas
- Creates sense of harmonic structure
- No rhythm, only drone

### Traversal
- Crystalline click on each edge
- Pitch based on edge weight
- Chord when reaching node
- Satisfying resonance on correct path

### Puzzle Events
- Key pickup: Bell tone
- Unlock: Ascending arpeggio
- Mutation: Glitch/pitch shift
- Observer trigger: Inverse echo
- Solution: Harmonic resolution

### Silence
- THE LATTICE is mostly silent
- Sound is event, not atmosphere
- Silence itself is a teaching tool

---

## FRAGMENTS IN THE LATTICE

Narrative fragments are rare here. What exists:

**Fragment L-001: "Structure"**
> "Before meaning, there was relation.
> Before relation, there was distinction.
> Before distinction, there was..."

**Fragment L-002: "The First Edge"**
> "To connect is to constrain.
> Every path enables by forbidding all others."

**Fragment L-003: "Observer"**
> "The structure changes when witnessed.
> Not because witnessing causes change.
> But because change IS witnessing."

These fragments are purely abstract. No narrative content. Only structure reflecting on itself.

---

## INTERFERENCE ZONES

Where THE LATTICE meets other dimensions:

### LATTICE ↔ MARROW Interference

```
LATTICE side: Rigid nodes, clean edges
MARROW side: Pulsing nodes, organic edges

Interference zone:
- Edges become veins
- Nodes become organs
- But graph logic still applies
- Puzzle: Navigate by heartbeat rhythm AND path logic
```

**Solution mechanic:** Edges only traversable when MARROW pulse aligns with LATTICE state

### LATTICE ↔ ARCHIVE Interference

```
LATTICE side: Abstract nodes
ARCHIVE side: Memory fragments

Interference zone:
- Nodes contain memories
- Edges are connections between memories
- Graph structure reveals narrative
- Puzzle: Reconstruct memory sequence via graph
```

**Solution mechanic:** Traverse nodes in correct memory order to unlock exit

### LATTICE ↔ VOID Interference

```
LATTICE side: Visible structure
VOID side: Pure emptiness

Interference zone:
- Some nodes invisible
- Some edges uncertain
- Must infer structure from partial information
- Puzzle: Navigate incomplete graph
```

**Solution mechanic:** Attention creates temporary visibility, strategy is when to look and when to move blind

---

## DEVELOPMENT NOTES

### Priority
THE LATTICE is the first dimension because:
1. Clearest mechanics (graph navigation)
2. Easiest to prototype (just nodes and edges)
3. Best for teaching core concepts
4. Most contrast with SANCTUARY

### Risk
- Could feel too abstract, too cold
- Solution: Beautiful execution of simplicity
- The sterile precision IS the experience

### Dependencies
- Awareness Controller (must feel right)
- Graph rendering (must be elegant)
- Sound design (must be satisfying)

### Success Criteria
- Player understands traversal in < 30 seconds
- First puzzle solved in < 2 minutes
- "First Principles" area completed in < 15 minutes
- Player wants to see what other dimensions feel like

---

*"In THE LATTICE, you learn that consciousness is navigation."*

