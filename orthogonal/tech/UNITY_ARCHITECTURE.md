# Orthogonal Unity Architecture
## Technical Foundation for Dimension Navigation

---

## ENGINE REQUIREMENTS

- **Unity Version:** 2022.3 LTS or later (for stability)
- **Render Pipeline:** URP (Universal Render Pipeline) for cross-platform
- **Target Platforms:** PC (primary), Console (secondary), Mobile (SANCTUARY only)
- **Minimum Spec:** GTX 1060 / RX 580, 8GB RAM, SSD recommended

---

## PROJECT STRUCTURE

```
Orthogonal/
├── Assets/
│   ├── _Core/
│   │   ├── Awareness/
│   │   │   ├── AwarenessController.cs
│   │   │   ├── AttentionRaycaster.cs
│   │   │   ├── WitnessSystem.cs
│   │   │   ├── ResonanceTracker.cs
│   │   │   └── AwarenessState.cs
│   │   │
│   │   ├── Dimensions/
│   │   │   ├── DimensionManager.cs
│   │   │   ├── DimensionDefinition.asset
│   │   │   ├── DimensionRules.cs
│   │   │   └── DimensionTransition.cs
│   │   │
│   │   ├── Interference/
│   │   │   ├── InterferenceZone.cs
│   │   │   ├── RuleBlender.cs
│   │   │   ├── ParadoxState.cs
│   │   │   └── DualRuleResolver.cs
│   │   │
│   │   ├── Narrative/
│   │   │   ├── FragmentSystem.cs
│   │   │   ├── MemoryGraph.cs
│   │   │   ├── QuestionTracker.cs
│   │   │   └── NarrativeState.cs
│   │   │
│   │   └── Persistence/
│   │       ├── SaveSystem.cs
│   │       ├── CloudSync.cs
│   │       └── StateSerializer.cs
│   │
│   ├── Dimensions/
│   │   ├── Lattice/
│   │   │   ├── LatticeRules.cs
│   │   │   ├── NodeGraph.cs
│   │   │   ├── PathOptimizer.cs
│   │   │   ├── Scenes/
│   │   │   ├── Prefabs/
│   │   │   └── Materials/
│   │   │
│   │   ├── Marrow/
│   │   │   ├── MarrowRules.cs
│   │   │   ├── OrganicSystem.cs
│   │   │   ├── RhythmMatcher.cs
│   │   │   ├── Scenes/
│   │   │   ├── Prefabs/
│   │   │   └── Materials/
│   │   │
│   │   ├── Archive/
│   │   │   ├── ArchiveRules.cs
│   │   │   ├── MemoryPool.cs
│   │   │   ├── TemporalNav.cs
│   │   │   ├── Scenes/
│   │   │   ├── Prefabs/
│   │   │   └── Materials/
│   │   │
│   │   ├── Void/
│   │   │   ├── VoidRules.cs
│   │   │   ├── NegativeSpace.cs
│   │   │   ├── EdgeDetector.cs
│   │   │   ├── Scenes/
│   │   │   ├── Prefabs/
│   │   │   └── Materials/
│   │   │
│   │   └── Sanctuary/
│   │       ├── SanctuaryRules.cs
│   │       ├── VeilPathBridge.cs
│   │       ├── VeraStateSync.cs
│   │       ├── Scenes/
│   │       └── Prefabs/
│   │
│   ├── VeilPath/
│   │   ├── WebViewContainer.cs
│   │   ├── AuthBridge.cs
│   │   ├── StateExporter.cs
│   │   └── MessageBus.cs
│   │
│   ├── Audio/
│   │   ├── DimensionAudioManager.cs
│   │   ├── InterferenceAudioBlender.cs
│   │   └── SFX/
│   │
│   ├── VFX/
│   │   ├── AttentionTrail/
│   │   ├── TransitionEffects/
│   │   └── InterferenceGlitch/
│   │
│   └── UI/
│       ├── MinimalHUD.cs
│       ├── DimensionIndicator.cs
│       └── ResonanceDisplay.cs
│
├── Packages/
│   ├── com.unity.render-pipelines.universal
│   ├── com.unity.inputsystem
│   ├── com.unity.cinemachine
│   └── com.veilpath.bridge (custom package)
│
└── ProjectSettings/
```

---

## CORE SYSTEMS

### 1. Awareness Controller

The player is not a body. The player is attention.

```csharp
// AwarenessController.cs
public class AwarenessController : MonoBehaviour
{
    [SerializeField] private float attentionSpeed = 5f;
    [SerializeField] private float focusDepth = 10f;

    private Vector3 attentionPoint;
    private Transform attentionAnchor;
    private DimensionManager dimensions;
    private ResonanceTracker resonance;

    public event Action<GameObject> OnWitness;
    public event Action<Vector3> OnAttentionShift;

    void Update()
    {
        // Attention follows input
        Vector2 input = GetAttentionInput();

        // Cast attention ray
        Ray attentionRay = new Ray(
            attentionAnchor.position,
            attentionAnchor.forward
        );

        // What are we attending to?
        if (Physics.Raycast(attentionRay, out RaycastHit hit, focusDepth))
        {
            attentionPoint = Vector3.Lerp(
                attentionPoint,
                hit.point,
                attentionSpeed * Time.deltaTime
            );

            // Witnessing changes both parties
            IWitnessable witnessable = hit.collider.GetComponent<IWitnessable>();
            if (witnessable != null)
            {
                witnessable.OnWitnessed(this);
                OnWitness?.Invoke(hit.collider.gameObject);
            }
        }

        // Movement is attention shift
        MoveTowardAttention();
    }

    void MoveTowardAttention()
    {
        // We don't move body - we shift where attention originates
        attentionAnchor.position = Vector3.Lerp(
            attentionAnchor.position,
            attentionPoint,
            Time.deltaTime * 2f
        );
        OnAttentionShift?.Invoke(attentionAnchor.position);
    }
}
```

### 2. Dimension Manager

Each dimension has its own rules. The manager mediates.

```csharp
// DimensionManager.cs
public class DimensionManager : MonoBehaviour
{
    [SerializeField] private DimensionDefinition[] dimensions;

    private DimensionDefinition currentDimension;
    private DimensionDefinition targetDimension;
    private float transitionProgress;
    private bool inInterference;

    public DimensionRules ActiveRules => inInterference
        ? GetBlendedRules()
        : currentDimension.Rules;

    public void ShiftTo(DimensionType type)
    {
        targetDimension = dimensions.First(d => d.Type == type);
        StartCoroutine(TransitionSequence());
    }

    private IEnumerator TransitionSequence()
    {
        // Phase 1: Dissolve current
        yield return DissolveCurrentDimension();

        // Phase 2: Void moment (always pass through VOID)
        yield return VoidMoment();

        // Phase 3: Materialize target
        yield return MaterializeTarget();

        currentDimension = targetDimension;
        targetDimension = null;
    }

    public void EnterInterferenceZone(InterferenceZone zone)
    {
        inInterference = true;
        blendingDimensions = zone.BlendedDimensions;
        OnInterferenceEnter?.Invoke(zone);
    }

    private DimensionRules GetBlendedRules()
    {
        // Blend rules from multiple dimensions
        // This is where paradoxes become possible
        return RuleBlender.Blend(blendingDimensions.Select(d => d.Rules));
    }
}
```

### 3. Dimension Rules System

Each dimension defines what's possible.

```csharp
// DimensionRules.cs
[CreateAssetMenu(fileName = "Rules", menuName = "Orthogonal/DimensionRules")]
public class DimensionRules : ScriptableObject
{
    public MovementType Movement;      // Attention, Physical, Temporal, etc.
    public InteractionType Interaction; // Witness, Manipulate, Merge, etc.
    public PhysicsProfile Physics;      // Gravity, Collision, etc.
    public LogicProfile Logic;          // Causality, Paradox tolerance, etc.
    public NarrativeProfile Narrative;  // Fragment types, meaning rules

    public bool CanInteract(IInteractable obj)
    {
        return Interaction.Permits(obj.InteractionType);
    }

    public bool CausesParadox(Action action)
    {
        return !Logic.CausalityChain.Validate(action);
    }
}

// Example: LATTICE rules
// Movement: Pure attention
// Interaction: Path selection only
// Physics: None (graph space)
// Logic: Strict causality, no paradox
// Narrative: Mathematical truths only

// Example: MARROW rules
// Movement: Rhythm-synced
// Interaction: Biological merge
// Physics: Organic (everything pulses)
// Logic: Intuitive, paradox-tolerant
// Narrative: Visceral impressions
```

### 4. Interference Engine

Where dimensions overlap, new rules emerge.

```csharp
// InterferenceZone.cs
public class InterferenceZone : MonoBehaviour
{
    [SerializeField] private DimensionType[] blendedDimensions;
    [SerializeField] private float blendIntensity = 0.5f;

    private RuleBlender blender;
    private List<ParadoxState> activeParadoxes;

    void OnTriggerEnter(Collider other)
    {
        if (other.GetComponent<AwarenessController>())
        {
            DimensionManager.Instance.EnterInterferenceZone(this);
            ActivateBlending();
        }
    }

    void ActivateBlending()
    {
        // Visual: Glitch effects increase
        // Audio: Dimensions' sounds layer
        // Rules: Both apply simultaneously

        blender = new RuleBlender(blendedDimensions);

        // What paradoxes are now possible?
        activeParadoxes = blender.DetectPossibleParadoxes();

        foreach (var paradox in activeParadoxes)
        {
            paradox.MakeAvailable();
        }
    }
}

// RuleBlender.cs
public class RuleBlender
{
    public DimensionRules Blend(IEnumerable<DimensionRules> rules)
    {
        DimensionRules blended = ScriptableObject.CreateInstance<DimensionRules>();

        // Movement: Most permissive
        blended.Movement = rules.Aggregate((a, b) =>
            a.Movement.Permissiveness > b.Movement.Permissiveness ? a : b
        ).Movement;

        // Interaction: Union of types
        blended.Interaction = InteractionType.Union(rules.Select(r => r.Interaction));

        // Physics: Weighted average
        blended.Physics = PhysicsProfile.Average(rules.Select(r => r.Physics));

        // Logic: Maximum paradox tolerance
        blended.Logic = rules.OrderByDescending(r => r.Logic.ParadoxTolerance).First().Logic;

        return blended;
    }
}
```

### 5. VeilPath Bridge

Connecting Unity to the React Native VeilPath app.

```csharp
// VeilPathBridge.cs
public class VeilPathBridge : MonoBehaviour
{
    [SerializeField] private string veilPathUrl = "https://sanctuary.veilpath.app";

    private WebViewContainer webView;
    private MessageBus messageBus;

    public async Task EnterSanctuary()
    {
        // Export current game state
        GameState state = StateExporter.Export();

        // Prepare handoff data for Vera
        VeraContext context = new VeraContext
        {
            LastDimension = DimensionManager.Current.Type.ToString(),
            ResonanceLevels = ResonanceTracker.GetAll(),
            RecentFragments = NarrativeState.RecentFragments(5),
            TimeInOtherDimensions = SessionStats.TimeOutsideSanctuary,
            UnansweredQuestions = QuestionTracker.Pending.Select(q => q.Text)
        };

        // Open VeilPath with context
        string contextJson = JsonUtility.ToJson(context);
        webView.Navigate($"{veilPathUrl}?context={Uri.EscapeDataString(contextJson)}");

        // Listen for return signal
        messageBus.Subscribe("sanctuary.exit", OnSanctuaryExit);
    }

    private void OnSanctuaryExit(Message msg)
    {
        // Vera may have updated player state
        if (msg.Data.TryGetValue("insights", out object insights))
        {
            NarrativeState.IntegrateInsights((List<string>)insights);
        }

        if (msg.Data.TryGetValue("resonanceBoost", out object boost))
        {
            ResonanceTracker.ApplyBoost((Dictionary<string, float>)boost);
        }

        // Return to last dimension
        DimensionManager.Instance.ReturnFromSanctuary();
    }
}
```

---

## SHADERS & VISUAL EFFECTS

### Attention Trail

```hlsl
// AttentionTrail.shader
Shader "Orthogonal/AttentionTrail"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
        _FadeDistance ("Fade Distance", Float) = 2.0
        _PulseSpeed ("Pulse Speed", Float) = 1.0
    }

    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            float4 frag(v2f i) : SV_Target
            {
                float4 col = _Color;

                // Pulse based on time
                float pulse = sin(_Time.y * _PulseSpeed) * 0.5 + 0.5;
                col.a *= pulse;

                // Fade based on distance from attention point
                float dist = length(i.worldPos - _AttentionPoint);
                col.a *= saturate(1 - dist / _FadeDistance);

                return col;
            }
            ENDCG
        }
    }
}
```

### Dimension Transition

```hlsl
// DimensionTransition.shader
Shader "Orthogonal/DimensionTransition"
{
    Properties
    {
        _MainTex ("Current Dimension", 2D) = "white" {}
        _TargetTex ("Target Dimension", 2D) = "white" {}
        _Progress ("Transition Progress", Range(0,1)) = 0
        _VoidColor ("Void Color", Color) = (0,0,0,1)
    }

    SubShader
    {
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            float4 frag(v2f i) : SV_Target
            {
                float4 current = tex2D(_MainTex, i.uv);
                float4 target = tex2D(_TargetTex, i.uv);

                // Always pass through void
                float voidIntensity = 1 - abs(_Progress - 0.5) * 2;

                float4 col;
                if (_Progress < 0.5)
                {
                    // Dissolving into void
                    col = lerp(current, _VoidColor, _Progress * 2);
                }
                else
                {
                    // Emerging from void
                    col = lerp(_VoidColor, target, (_Progress - 0.5) * 2);
                }

                return col;
            }
            ENDCG
        }
    }
}
```

---

## INPUT SYSTEM

Minimal input. Attention-based.

```csharp
// OrthogonalInput.cs
public class OrthogonalInput : MonoBehaviour
{
    // Mouse/Stick: Direct attention
    public Vector2 AttentionDirection => new Vector2(
        Input.GetAxis("Mouse X") + Input.GetAxis("RightStickX"),
        Input.GetAxis("Mouse Y") + Input.GetAxis("RightStickY")
    );

    // Primary: Focus/Witness
    public bool Focus => Input.GetButton("Fire1") || Input.GetButton("Submit");

    // Secondary: Shift dimension (opens radial)
    public bool ShiftIntent => Input.GetButton("Fire2") || Input.GetButton("Cancel");

    // Sanctuary: Direct access to VeilPath
    public bool SanctuaryRequest => Input.GetKeyDown(KeyCode.Tab) ||
                                     Input.GetButtonDown("Start");

    // That's it. No jump. No crouch. No inventory.
}
```

---

## SAVE SYSTEM

Consciousness persists.

```csharp
// StateSerializer.cs
[Serializable]
public class OrthogonalSaveState
{
    public string PlayerId;
    public DateTime LastPlayed;

    // Awareness state
    public Vector3 LastAttentionPoint;
    public string LastDimension;
    public Dictionary<string, float> Resonance;

    // Narrative state
    public List<string> WitnessedFragmentIds;
    public List<string> PendingQuestionIds;
    public Dictionary<string, bool> ParadoxesResolved;

    // VeilPath sync
    public string VeilPathUserId;
    public DateTime LastSanctuaryVisit;
    public int SanctuaryVisitCount;

    // No inventory. No skills. No stats.
    // Only what you've witnessed and what you're asking.
}
```

---

## PERFORMANCE TARGETS

| Metric | Target | Tolerance |
|--------|--------|-----------|
| Frame Rate | 60 FPS | Min 30 FPS |
| Load Time (dimension) | < 2s | < 5s |
| Memory (per dimension) | < 500MB | < 750MB |
| Transition (dimension) | < 1.5s | < 3s |
| VeilPath Launch | < 3s | < 5s |

---

## PROTOTYPING PRIORITY

1. **AwarenessController** - Get attention-based movement feeling right
2. **One LATTICE puzzle** - Prove the graph-navigation works
3. **Dimension transition** - The void moment
4. **VeilPath WebView** - Can we embed and communicate?
5. **Interference zone** - Blended rules prototype

---

## DEPENDENCIES

```
Unity 2022.3 LTS
├── Universal RP 14.x
├── Input System 1.5+
├── Cinemachine 2.9+
├── TextMeshPro 3.x
├── Addressables 1.21+
└── WebView (platform-specific)
    ├── iOS: WKWebView
    ├── Android: Chrome Custom Tabs
    └── PC: Chromium Embedded Framework
```

---

*The architecture serves the experience. The experience is attention navigating impossibility.*

