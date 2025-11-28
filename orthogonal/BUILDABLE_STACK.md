# ORTHOGONAL: The Buildable Stack
## What We Can Actually Develop Right Now

---

## THE REALIZATION

Unity SDK? Can't touch it.
But we can build everything AROUND it.

**The Play:**
1. Build web-based prototype (Three.js) - fully testable
2. Build dimension design tools - outputs Unity-ready assets
3. Build meta-awareness tracking backend - works with anything
4. Build DSL + transpiler - write once, deploy to Unity/Web/Godot
5. Build asset pipeline - from our tools to Unity project

When a Unity dev picks this up, they get a complete system.
When we demo in browser, investors see it working.

---

## STACK ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORTHOGONAL TOOLCHAIN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LATTICE-SCRIPT (DSL)                                    │   │
│  │  Domain-specific language for dimension design           │   │
│  │  .lattice files → parse → AST → codegen                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│              ┌─────────────┼─────────────┐                     │
│              ▼             ▼             ▼                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐    │
│  │ Web Runtime   │ │ Unity Export  │ │ Godot Export      │    │
│  │ (Three.js)    │ │ (C# + Assets) │ │ (GDScript)        │    │
│  │ PLAYABLE NOW  │ │ For Unity Dev │ │ For Godot Dev     │    │
│  └───────────────┘ └───────────────┘ └───────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  META-AWARENESS ENGINE (TypeScript)                      │   │
│  │  Tracks, measures, adapts to player awareness level      │   │
│  │  Works standalone, integrates with any frontend          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DIMENSION STUDIO (React Web App)                        │   │
│  │  Visual editor for designing dimensions                  │   │
│  │  Live preview, exports to all targets                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VEILPATH BRIDGE (Already exists in VeilPath)            │   │
│  │  SANCTUARY integration - just needs Orthogonal hooks     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## COMPONENT 1: LATTICE-SCRIPT DSL

A domain-specific language for designing dimensions.

### Why a DSL?
- Write dimension logic ONCE
- Generate code for any target
- Designers don't need to code
- Version control friendly
- Testable without game engine

### Example Syntax

```lattice
// dimensions/lattice.dimension

dimension LATTICE {
  name: "The Lattice"
  visual: {
    palette: ["#0066FF", "#00CCCC", "#FFFFFF"]
    background: "#000000"
    style: wireframe
  }

  rules {
    movement: attention_based
    physics: none
    time: static
    paradox_tolerance: 0.0
  }

  // Define a node
  node START {
    position: [0, 0, 0]
    type: spawn
    content: empty
  }

  node KEY_NODE {
    position: [5, 0, 0]
    type: container
    content: key("main_door")
    on_witness: {
      emit("key_found")
      flash(0.5)
    }
  }

  node LOCKED_EXIT {
    position: [10, 0, 0]
    type: gate
    requires: key("main_door")
    on_unlock: transition("MARROW")
  }

  // Define edges
  edge START -> KEY_NODE {
    type: open
    weight: 1.0
  }

  edge KEY_NODE -> LOCKED_EXIT {
    type: locked
    key: "main_door"
  }

  // Meta-awareness hooks
  meta {
    on_revisit(START, 3): {
      suggest_witness_mode()
      log_event("player_lost")
    }

    on_witness_duration(5.0): {
      reveal_hidden_edge(KEY_NODE -> SECRET)
      award_insight("patience")
    }
  }
}
```

### Transpiler Outputs

**Web (Three.js):**
```typescript
// Generated: dimensions/lattice.ts
export const LATTICE: DimensionConfig = {
  name: "The Lattice",
  nodes: [
    { id: "START", position: [0, 0, 0], type: "spawn", content: null },
    { id: "KEY_NODE", position: [5, 0, 0], type: "container", content: { key: "main_door" } },
    // ...
  ],
  edges: [
    { from: "START", to: "KEY_NODE", type: "open", weight: 1.0 },
    // ...
  ],
  meta: {
    hooks: [ /* ... */ ]
  }
};
```

**Unity (C#):**
```csharp
// Generated: Dimensions/Lattice/LatticeConfig.cs
[CreateAssetMenu(menuName = "Orthogonal/Dimensions/Lattice")]
public class LatticeConfig : DimensionConfig
{
    public override string Name => "The Lattice";

    public override NodeData[] Nodes => new NodeData[] {
        new NodeData("START", Vector3.zero, NodeType.Spawn, null),
        new NodeData("KEY_NODE", new Vector3(5, 0, 0), NodeType.Container, new KeyContent("main_door")),
        // ...
    };
    // ...
}
```

### Implementation (I Can Build This)

```
orthogonal-tools/
├── packages/
│   └── lattice-script/
│       ├── src/
│       │   ├── lexer.ts       # Tokenize .lattice files
│       │   ├── parser.ts      # Build AST
│       │   ├── ast.ts         # Type definitions
│       │   ├── semantic.ts    # Validate semantics
│       │   ├── codegen/
│       │   │   ├── web.ts     # Three.js output
│       │   │   ├── unity.ts   # C# output
│       │   │   └── godot.ts   # GDScript output
│       │   └── cli.ts         # Command line interface
│       ├── tests/
│       └── package.json
```

---

## COMPONENT 2: WEB RUNTIME (Three.js)

A fully playable Orthogonal prototype in the browser.

### Tech Stack
- **Three.js**: 3D rendering
- **TypeScript**: Type safety
- **React**: UI layer
- **Zustand**: State management (same as VeilPath)
- **Vite**: Build tool

### Core Systems

```typescript
// src/core/awareness.ts
export class AwarenessController {
  private position: Vector3;
  private attention: Ray;
  private witnessMode: number = 0;

  update(delta: number) {
    // Attention follows mouse/pointer
    this.attention = this.calculateAttentionRay();

    // Raycast for witnessable objects
    const hit = this.raycast(this.attention);
    if (hit && hit.object.userData.witnessable) {
      this.onWitness(hit.object);
    }

    // Movement toward attention point
    if (hit) {
      this.moveToward(hit.point, delta);
    }
  }

  engageWitnessMode(active: boolean) {
    this.witnessMode = active ?
      Math.min(1, this.witnessMode + 0.02) :
      Math.max(0, this.witnessMode - 0.05);
  }
}

// src/core/dimension.ts
export class DimensionManager {
  private current: Dimension;
  private transitioning: boolean = false;

  async shiftTo(target: DimensionType) {
    this.transitioning = true;

    // Phase 1: Dissolve
    await this.current.dissolve();

    // Phase 2: Void moment
    await this.voidMoment();

    // Phase 3: Materialize
    this.current = await this.loadDimension(target);
    await this.current.materialize();

    this.transitioning = false;
  }
}

// src/dimensions/lattice/index.ts
export class LatticeDimension implements Dimension {
  private graph: Graph;
  private nodes: Map<string, LatticNode>;
  private edges: Map<string, LatticeEdge>;

  render(scene: Scene) {
    // Wireframe nodes
    this.nodes.forEach(node => {
      const geometry = new IcosahedronGeometry(0.5, 0);
      const edges = new EdgesGeometry(geometry);
      const line = new LineSegments(edges, this.getNodeMaterial(node));
      line.position.copy(node.position);
      scene.add(line);
    });

    // Edges as lines
    this.edges.forEach(edge => {
      const points = [edge.from.position, edge.to.position];
      const geometry = new BufferGeometry().setFromPoints(points);
      const line = new Line(geometry, this.getEdgeMaterial(edge));
      scene.add(line);
    });
  }

  update(delta: number, awareness: AwarenessController) {
    // Update node states based on awareness
    // Handle mutations
    // Process meta-awareness hooks
  }
}
```

### File Structure

```
orthogonal-web/
├── src/
│   ├── core/
│   │   ├── awareness.ts
│   │   ├── dimension.ts
│   │   ├── meta-tracking.ts
│   │   └── input.ts
│   │
│   ├── dimensions/
│   │   ├── lattice/
│   │   │   ├── index.ts
│   │   │   ├── nodes.ts
│   │   │   ├── puzzles.ts
│   │   │   └── shaders/
│   │   │
│   │   ├── void/
│   │   └── sanctuary/
│   │
│   ├── rendering/
│   │   ├── post-processing.ts
│   │   ├── transitions.ts
│   │   └── shaders/
│   │
│   ├── ui/
│   │   ├── HUD.tsx
│   │   ├── DimensionIndicator.tsx
│   │   └── SanctuaryPortal.tsx
│   │
│   ├── stores/
│   │   ├── gameStore.ts
│   │   ├── awarenessStore.ts
│   │   └── progressStore.ts
│   │
│   └── App.tsx
│
├── public/
│   └── dimensions/    # Compiled .lattice files
│
├── package.json
└── vite.config.ts
```

---

## COMPONENT 3: META-AWARENESS ENGINE

The brain of the operation. Tracks, measures, adapts.

### Standalone Module

```typescript
// packages/meta-awareness/src/index.ts

export interface MetaState {
  // Current levels
  witnessActivation: number;      // 0-1
  flowState: number;              // 0-1
  metaAwarenessLevel: number;     // 0-4

  // Accumulated
  totalWitnessTime: number;
  witnessTimingAccuracy: number;
  questionsHeld: Question[];
  paradoxesTolerance: number;

  // Session
  sessionDuration: number;
  dimensionHistory: DimensionType[];
  insights: Insight[];
}

export class MetaAwarenessEngine {
  private state: MetaState;
  private hooks: MetaHook[];

  // Core tracking
  onWitness(target: Witnessable, duration: number) {
    this.state.totalWitnessTime += duration;

    // Was this a useful witness moment?
    const useful = this.evaluateWitnessUtility(target);
    if (useful) {
      this.state.witnessTimingAccuracy =
        (this.state.witnessTimingAccuracy * 0.9) + (1 * 0.1);
    }

    this.evaluateMetaLevel();
    this.triggerHooks('witness', { target, duration, useful });
  }

  onParadoxEncounter(paradox: Paradox, resolved: boolean) {
    if (resolved) {
      this.state.paradoxesTolerance =
        Math.min(1, this.state.paradoxesTolerance + 0.1);
    }
    this.evaluateMetaLevel();
  }

  onQuestionSurfaced(question: Question) {
    this.state.questionsHeld.push(question);
    // Don't evaluate yet - see if they can hold it
  }

  onQuestionAnxiety(question: Question) {
    // Player keeps revisiting unresolved question
    // Indicates low tolerance - don't penalize, just note
    question.anxietyLevel++;
  }

  // Evaluation
  private evaluateMetaLevel() {
    const { witnessTimingAccuracy, paradoxesTolerance, questionsHeld } = this.state;

    // Level 0: Not witnessing
    // Level 1: Witnessing but not well-timed
    // Level 2: Good witness timing
    // Level 3: Paradox tolerance + question holding
    // Level 4: All above while in flow

    let level = 0;

    if (this.state.totalWitnessTime > 60) level = 1;
    if (witnessTimingAccuracy > 0.6) level = 2;
    if (paradoxesTolerance > 0.5 && questionsHeld.length >= 3) level = 3;
    if (level === 3 && this.state.flowState > 0.7) level = 4;

    this.state.metaAwarenessLevel = level;
  }

  // Difficulty adaptation
  getDifficultyMultiplier(): number {
    return 1 + (this.state.metaAwarenessLevel * 0.25);
  }

  shouldRevealHiddenContent(): boolean {
    return this.state.metaAwarenessLevel >= 2;
  }

  // Export for VeilPath integration
  exportForVera(): VeraContext {
    return {
      metaLevel: this.state.metaAwarenessLevel,
      questionsHeld: this.state.questionsHeld.map(q => q.text),
      insights: this.state.insights,
      sessionDuration: this.state.sessionDuration,
      dominantDimension: this.calculateDominantDimension()
    };
  }
}
```

### Integration Points

Works with:
- **Web Runtime**: Direct import
- **Unity**: WebSocket or REST API
- **VeilPath**: Same as web, or via SANCTUARY bridge

---

## COMPONENT 4: DIMENSION STUDIO

Visual editor for designing dimensions without code.

### Web-Based React App

```
orthogonal-studio/
├── src/
│   ├── editor/
│   │   ├── Canvas.tsx          # Three.js preview
│   │   ├── NodeEditor.tsx      # Place/configure nodes
│   │   ├── EdgeEditor.tsx      # Connect nodes
│   │   ├── RulesPanel.tsx      # Dimension rules
│   │   ├── MetaPanel.tsx       # Meta-awareness hooks
│   │   └── PreviewPlayer.tsx   # Test in browser
│   │
│   ├── export/
│   │   ├── toLatticeScript.ts  # Export to DSL
│   │   ├── toUnityPackage.ts   # Export Unity assets
│   │   └── toJSON.ts           # Export raw data
│   │
│   └── App.tsx
```

### Features

1. **Visual Node Placement**
   - Drag nodes in 3D space
   - Connect with edges
   - Configure properties in sidebar

2. **Live Preview**
   - Play dimension in browser
   - See meta-awareness tracking
   - Test puzzles

3. **Export Options**
   - .lattice file (for transpiler)
   - Unity package (.unitypackage)
   - JSON (for custom pipelines)

4. **VeilPath Integration**
   - Test SANCTUARY transition
   - Mock Vera responses
   - Verify context handoff

---

## COMPONENT 5: ASSET PIPELINE

Convert our outputs to Unity-ready assets.

### Unity Package Generator

```typescript
// packages/unity-export/src/index.ts

export async function generateUnityPackage(
  dimensions: DimensionConfig[],
  options: ExportOptions
): Promise<Buffer> {
  const packageDir = await createTempDir();

  // Generate C# scripts
  for (const dimension of dimensions) {
    const csharp = generateCSharp(dimension);
    await writeFile(`${packageDir}/Scripts/${dimension.name}Config.cs`, csharp);
  }

  // Generate ScriptableObject assets
  for (const dimension of dimensions) {
    const asset = generateScriptableObject(dimension);
    await writeFile(`${packageDir}/Resources/${dimension.name}.asset`, asset);
  }

  // Generate prefabs (YAML format Unity uses)
  const prefabs = generatePrefabs(dimensions);
  for (const prefab of prefabs) {
    await writeFile(`${packageDir}/Prefabs/${prefab.name}.prefab`, prefab.yaml);
  }

  // Generate shaders
  const shaders = generateShaders(dimensions);
  for (const shader of shaders) {
    await writeFile(`${packageDir}/Shaders/${shader.name}.shader`, shader.hlsl);
  }

  // Package as .unitypackage
  return await createUnityPackage(packageDir);
}
```

### What Gets Generated

```
OrthogonalDimensions.unitypackage
├── Scripts/
│   ├── LatticeConfig.cs
│   ├── MarrowConfig.cs
│   └── ...
├── Resources/
│   ├── Lattice.asset
│   ├── Marrow.asset
│   └── ...
├── Prefabs/
│   ├── LatticeNode.prefab
│   ├── LatticeEdge.prefab
│   └── ...
├── Shaders/
│   ├── Wireframe.shader
│   ├── DimensionTransition.shader
│   └── ...
└── package.json (Unity package manifest)
```

Unity dev imports, it "just works" with the core runtime we've documented.

---

## BUILD ORDER

What I build first:

### Phase 1: Foundation (This Week)
1. **LatticeScript lexer/parser** - Define the DSL
2. **Web codegen** - Generate Three.js code
3. **Basic web runtime** - Awareness controller + LATTICE render

### Phase 2: Playable (Next 2 Weeks)
4. **First puzzle** - Complete LATTICE "First Principles"
5. **Meta-awareness engine** - Basic tracking
6. **Witness mode** - Visual + mechanic

### Phase 3: Integration (Week 3-4)
7. **SANCTUARY stub** - VeilPath WebView
8. **Dimension transitions** - LATTICE → VOID → back
9. **Unity export** - Generate importable package

### Phase 4: Studio (Month 2)
10. **Dimension Studio** - Visual editor
11. **Full meta-tracking** - All metrics
12. **Polish** - Make it demo-ready

---

## WHAT THIS ENABLES

1. **Demo in browser** - Show investors, players, anyone
2. **Unity handoff** - Dev gets complete package
3. **Parallel development** - We build tools, Unity dev builds game
4. **Iteration speed** - Change DSL, regenerate everything
5. **Multi-platform** - Same source, multiple targets

---

*"We can't run Unity. But we can build everything Unity needs to run."*

