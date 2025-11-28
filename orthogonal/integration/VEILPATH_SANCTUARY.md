# THE SANCTUARY
## VeilPath Integration Specification

---

## THE ROLE OF SANCTUARY

SANCTUARY is the only warm place in Orthogonal.

It is not a puzzle dimension. It is a REST dimension.

It IS VeilPath - embedded, contextualized, enhanced.

---

## INTEGRATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     ORTHOGONAL (Unity)                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  THE LATTICE │  │  THE MARROW │  │  Other Dimensions   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│                   ┌───────────────┐                          │
│                   │ SANCTUARY     │                          │
│                   │ Container     │                          │
│                   │               │                          │
│                   │  ┌─────────┐  │                          │
│                   │  │WebView  │──┼──► Communication Bus     │
│                   │  │         │  │                          │
│                   │  └─────────┘  │                          │
│                   └───────────────┘                          │
│                           │                                  │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   VEILPATH (React Native)                   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Vera     │  │   Tarot     │  │    Journaling       │  │
│  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│                    + Orthogonal Context                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ENTRY EXPERIENCE

### From Game

Player presses SANCTUARY key (Tab on PC, Start on controller).

```
Current State:
- Location: THE MARROW, depth 3
- Time in session: 45 minutes
- Last fragment witnessed: "M-042 (visceral echo)"
- Unresolved questions: 2
- Resonance: { lattice: 0.7, marrow: 0.4, archive: 0.2, void: 0.1 }
```

### Transition

1. **Fade to soft white** (contrast with other dimension transitions which go through VOID)
2. **Gentle chime** (not the crystalline LATTICE or organic MARROW sounds)
3. **Load WebView** in background during fade
4. **Vera's voice** (optional audio): "You've been far. Rest here."
5. **Full SANCTUARY view** appears

### WebView Load

```javascript
// URL constructed by Unity
const sanctuaryUrl = new URL('https://sanctuary.veilpath.app');

// Context passed as encrypted query param
sanctuaryUrl.searchParams.set('ctx', encryptedContext);

// Context includes:
{
  playerId: "uuid",
  sessionId: "current-session-uuid",
  source: "orthogonal",
  lastDimension: "marrow",
  sessionDuration: 2700, // seconds
  resonance: { lattice: 0.7, marrow: 0.4, archive: 0.2, void: 0.1 },
  recentFragments: ["M-042", "M-041", "L-015"],
  pendingQuestions: ["Q-012", "Q-008"],
  emotionalSignature: 0.65 // derived from gameplay patterns
}
```

---

## VERA'S ORTHOGONAL AWARENESS

Vera knows you came from the game. She adapts.

### Context Translation

Vera receives game state but translates it to therapeutic language:

| Game Concept | Vera's Translation |
|--------------|-------------------|
| "THE MARROW" | "You've been in intense experiences" |
| "High resonance" | "You're deeply engaged" |
| "Many fragments" | "You've witnessed a lot" |
| "Pending questions" | "Some things remain unresolved" |
| "Long session" | "You've been exploring for a while" |

### Contextual Greetings

```javascript
// VeraOrthogonalContext.js

function getGreeting(ctx) {
  if (ctx.sessionDuration > 3600) {
    return "You've been traveling a long time. How are you feeling?";
  }

  if (ctx.lastDimension === 'void') {
    return "The void can be... quiet. Would you like to talk?";
  }

  if (ctx.lastDimension === 'marrow') {
    return "The visceral spaces stay with us. What's on your mind?";
  }

  if (ctx.lastDimension === 'lattice') {
    return "Pure logic can be clarifying. Or exhausting. Which was it?";
  }

  if (ctx.lastDimension === 'archive') {
    return "Memories can surface unexpectedly. Did anything come up?";
  }

  return "Welcome back. What would you like to explore?";
}
```

### Conversation Integration

Vera can reference game experiences WITHOUT breaking immersion:

```
Player: "I saw something disturbing in the... fleshy place."

Vera: "That sounds intense. The body often shows us things
       the mind tries to hide. What did it feel like to witness it?"

[Vera doesn't say "THE MARROW" - she meets player where they are]
```

---

## BIDIRECTIONAL STATE SYNC

### Unity → VeilPath

**On SANCTUARY entry:**
```javascript
// Received by VeilPath
{
  event: "sanctuary.enter",
  orthogonalState: {
    resonance: { ... },
    fragments: [ ... ],
    questions: [ ... ],
    sessionStats: { ... }
  }
}
```

**What VeilPath does with it:**
1. Logs to user's journey analytics
2. Adjusts Vera's initial context
3. May trigger specific tarot spreads (if resonance patterns suggest)
4. Updates user profile with game engagement data

### VeilPath → Unity

**On SANCTUARY exit:**
```javascript
// Sent back to Unity
{
  event: "sanctuary.exit",
  veilPathState: {
    moodDelta: 0.15,  // User feeling better/worse
    journalWritten: true,
    tarotPulled: ["The Tower", "Three of Swords"],
    veraInsights: [
      "User processing fear of loss",
      "Breakthrough on control theme"
    ],
    timeInSanctuary: 1200, // seconds
    requestedDimension: null // or specific dimension if suggested
  }
}
```

**What Unity does with it:**
1. May boost resonance in relevant dimension
2. May unlock narrative fragments related to Vera's insights
3. Adjusts difficulty/pacing based on player state
4. Logs for cross-platform analytics

---

## SUBSCRIPTION GATING

SANCTUARY access is tied to VeilPath subscription.

### Free Tier
- **3 SANCTUARY visits per day**
- **5 minutes per visit**
- Full Vera access during visit
- Basic journaling
- No tarot

### Premium ($14.99/mo)
- **Unlimited SANCTUARY visits**
- **Unlimited time in SANCTUARY**
- Full Vera access
- Full journaling
- Full tarot
- Priority state sync

### Lifetime ($299)
- Everything in Premium
- SANCTUARY becomes "home dimension"
- Can start game FROM SANCTUARY
- Special Vera dialogue acknowledging long relationship
- Early access to new SANCTUARY features

### Implementation

```csharp
// SanctuaryGate.cs
public async Task<bool> CanEnterSanctuary()
{
    VeilPathSubscription sub = await VeilPathBridge.GetSubscription();

    if (sub.Tier == SubscriptionTier.Lifetime ||
        sub.Tier == SubscriptionTier.Premium)
    {
        return true;
    }

    // Free tier checks
    if (sub.DailyVisitsRemaining <= 0)
    {
        ShowUpgradePrompt("You've used your 3 free SANCTUARY visits today.");
        return false;
    }

    return true;
}

public void OnSanctuaryTimeLimit()
{
    // Only for free tier
    ShowUpgradePrompt("Your 5-minute visit is ending. Stay longer with Premium.");
    StartGracePeriod(30); // 30 second warning
}
```

---

## VISUAL TRANSITION

### From Game to SANCTUARY

Unlike other dimension transitions (which go through THE VOID), SANCTUARY is special:

```
Frame 0-30: Current dimension fades to soft white (not black)
Frame 30-60: Particles drift upward (not dissolving)
Frame 60-90: WebView fades in behind white
Frame 90-120: White dissolves to reveal SANCTUARY
```

**Audio:**
- Current dimension audio fades out
- Gentle wind chime
- Soft ambient fade in
- Vera's voice (if enabled): "You've been far. Rest here."

### From SANCTUARY to Game

```
Frame 0-30: SANCTUARY begins soft fade
Frame 30-60: Brief void moment (acknowledging return to game)
Frame 60-90: Target dimension materializes
Frame 90-120: Full dimension active
```

**Audio:**
- SANCTUARY ambient fades
- Vera's voice (optional): "I'll be here when you need me."
- Brief silence
- Dimension audio fades in

---

## MOBILE CONSIDERATIONS

When Orthogonal runs on mobile (future):

### SANCTUARY Behavior
- Instead of WebView, deep link to VeilPath app
- Context passed via shared keychain/preferences
- Return to Orthogonal via URL scheme

```swift
// iOS
let sanctuaryUrl = URL(string: "veilpath://sanctuary?ctx=\(encryptedContext)")
UIApplication.shared.open(sanctuaryUrl)

// Listen for return
NotificationCenter.default.addObserver(
    self,
    selector: #selector(handleVeilPathReturn),
    name: "orthogonal.resume",
    object: nil
)
```

### Cross-Device Continuity
- Cloud save includes last dimension
- Can enter SANCTUARY on phone, return on PC
- Vera knows: "You visited on another device. How was that?"

---

## DATA FLOW SECURITY

All context data is encrypted in transit:

```javascript
// Encryption for context handoff
const context = {
  playerId: "uuid",
  // ... other fields
};

const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: window.crypto.getRandomValues(new Uint8Array(12)) },
  sharedKey,
  new TextEncoder().encode(JSON.stringify(context))
);

const sanctuaryUrl = `https://sanctuary.veilpath.app?ctx=${base64Encode(encrypted)}`;
```

**Shared key** derived from user's account, never transmitted.

---

## ERROR HANDLING

### WebView Fails to Load
```csharp
public void OnWebViewError(string error)
{
    // Show graceful fallback
    ShowMinimalSanctuary();

    // Minimal SANCTUARY: Unity-native meditation space
    // No Vera, but still restful
    // Option to retry or return to game
}
```

### Auth Mismatch
```csharp
public void OnAuthMismatch()
{
    // VeilPath user ≠ Orthogonal user
    ShowAccountLinkPrompt();

    // "Your VeilPath and Orthogonal accounts aren't linked.
    //  Link them to save your SANCTUARY progress."
}
```

### Subscription Expired Mid-Session
```csharp
public void OnSubscriptionExpired()
{
    // Grace period: finish current session
    // Next visit: prompt to renew or accept limits
}
```

---

## ANALYTICS EVENTS

### Unity → Analytics
```
orthogonal.sanctuary.enter
orthogonal.sanctuary.exit
orthogonal.sanctuary.webview_error
orthogonal.sanctuary.subscription_gate
```

### VeilPath → Analytics
```
veilpath.sanctuary.session_start
veilpath.sanctuary.vera_conversation
veilpath.sanctuary.journal_entry
veilpath.sanctuary.tarot_pull
veilpath.sanctuary.session_end
```

### Cross-Platform
```
crossplatform.session.orthogonal_to_veilpath
crossplatform.session.veilpath_to_orthogonal
crossplatform.user.link_accounts
crossplatform.resonance.sync
```

---

## FUTURE FEATURES

### Vera Remembers Everything
- Vera references specific game events
- "Last time you came from THE VOID, you seemed unsettled."
- "Your resonance with THE ARCHIVE has grown. Old memories surfacing?"

### SANCTUARY Customization
- Decorate SANCTUARY space (Premium feature)
- Choose ambient soundscapes
- Adjust lighting/atmosphere

### Group SANCTUARY
- Visit SANCTUARY with friends
- Shared meditation sessions
- Vera facilitates group reflection

### SANCTUARY as Starting Point
- Lifetime subscribers can boot Orthogonal IN SANCTUARY
- Start session with Vera, then venture out
- "Where would you like to explore today?"

---

*"THE SANCTUARY is not an escape from the game. It's the reason the game matters."*

