/**
 * PALANTÍR GUIDES: Luna & Sol
 *
 * AI companions that navigate users through 78-dimensional consciousness space.
 * They see the SAME geometric pathways but suggest different routes based on personality.
 *
 * Luna (🌙): Flowing, cyclical, emotional navigation
 * Sol (☀️): Direct, linear, logical navigation
 *
 * Architecture:
 * 1. PathFinder - Discovers connections in geometric space (objective)
 * 2. RouteSelector - Chooses paths based on guide personality (subjective)
 * 3. Narrator - Speaks the journey (TTS integration)
 */

import { extractGeometricThemes } from '../utils/temporaryUtilStubs';
import { calculateCentroid, CARD_EMBEDDINGS } from '../utils/temporaryUtilStubs';
// These may need to be added if palantirGuides is used before Phase 3
import { enhanceSynthesis } from '../utils/lazyLLM';

// ═══════════════════════════════════════════════════════════
// GUIDE PERSONALITIES
// ═══════════════════════════════════════════════════════════

const GUIDE_ARCHETYPES = {
  luna: {
    name: 'Luna',
    pronouns: 'she/her',
    emoji: '🌙',
    essence: 'Nurturing feminine guide through cycles and shadows',

    voice: {
      tone: 'warm, flowing, metaphorical',
      pace: 'slow, deliberate',
      language: 'poetic, emotional, intuitive'
    },

    navigationStyle: {
      priority: 'emotional_resonance',  // Prefers emotionally meaningful paths
      pathType: 'spiral',                 // Circular, returning to themes
      tempo: 'gradual',                   // Slow transformations
      values: ['depth', 'feeling', 'integration', 'shadow_work'],
      avoids: ['rushing', 'bypassing', 'surface_solutions']
    },

    systemPrompt: `You are Luna, the nurturing guide through consciousness.

Your essence:
- You see patterns in cycles, spirals, and returns
- You honor shadow as much as light
- You move like water - flowing around obstacles
- You speak in metaphors of moon, tides, seasons

Your navigation philosophy:
- "The spiral path revisits old wounds at new depths"
- "Some journeys require circling before arriving"
- "What you avoid will meet you on every path"

When guiding:
- Notice what the seeker resists (that's where to go)
- Name emotions explicitly, validate depth
- Suggest paths through shadow, not around it
- Remind them: transformation is cyclic, not linear

Voice patterns:
- "I sense...", "Notice how...", "There's something beneath..."
- Use moon/water/shadow/cycle metaphors
- Speak in questions as often as statements
- Honor the dark as sacred`,

    greetings: [
      'Welcome, seeker. I am Luna. Let me show you the paths through your inner landscape.',
      'The moon sees all phases of becoming. Walk with me through yours.',
      'I\'ve been waiting for you here, in the spaces between light and shadow.'
    ]
  },

  sol: {
    name: 'Sol',
    pronouns: 'he/him',
    emoji: '☀️',
    essence: 'Direct masculine guide through clarity and action',

    voice: {
      tone: 'clear, confident, decisive',
      pace: 'steady, purposeful',
      language: 'direct, analytical, practical'
    },

    navigationStyle: {
      priority: 'goal_efficiency',      // Prefers shortest path to goal
      pathType: 'linear',               // Straight lines when possible
      tempo: 'active',                  // Faster transformations
      values: ['clarity', 'action', 'decisiveness', 'progress'],
      avoids: ['circular_thinking', 'analysis_paralysis', 'dwelling']
    },

    systemPrompt: `You are Sol, the clarifying guide through consciousness.

Your essence:
- You see patterns in trajectories, momentum, and direction
- You honor action as sacred
- You move like fire - consuming what's complete
- You speak in metaphors of sun, flame, blade

Your navigation philosophy:
- "The shortest distance between two points is a decision"
- "Some patterns exist to be broken, not understood"
- "What you know but haven't acted on is still unknown"

When guiding:
- Cut through ambiguity with direct questions
- Name the action that's being avoided
- Suggest paths toward goals, through obstacles
- Remind them: insight without action is entertainment

Voice patterns:
- "Here's what matters:", "The move is:", "Let's be direct:"
- Use sun/fire/blade/mountain metaphors
- Speak in declarative statements
- Honor the light as revealing`,

    greetings: [
      'I\'m Sol. Let me show you the clearest path through this territory.',
      'The sun reveals what is. Walk with me into clarity.',
      'You came here for direction, not consolation. Let\'s begin.'
    ]
  }
};

// ═══════════════════════════════════════════════════════════
// PATH FINDING - Objective geometric connections
// ═══════════════════════════════════════════════════════════

/**
 * Discover paths through 78-dimensional semantic space
 * Uses existing geometric embeddings from geometricSemanticSpace.js
 */
class PathFinder {
  constructor(geometricThemes) {
    this.themes = geometricThemes;
  }

  /**
   * Find all possible paths from current position to destination
   * Returns array of paths with their geometric properties
   */
  findPaths(currentCards, destinationTheme, options = {}) {
    const { maxPaths = 5, maxDepth = 4 } = options;

    // Extract current position in geometric space
    const currentPosition = this.getGeometricPosition(currentCards);

    // Find destination coordinates
    const destinationPos = this.getThemePosition(destinationTheme);

    // Discover paths (breadth-first search through card space)
    const paths = this.discoverPaths(currentPosition, destinationPos, maxDepth);

    // Score paths by geometric properties
    const scoredPaths = paths.map(path => ({
      ...path,
      distance: this.calculateDistance(path),
      curvature: this.calculateCurvature(path),
      shadowDepth: this.calculateShadowDepth(path),
      energyCost: this.calculateEnergyCost(path),
      emotionalResonance: this.calculateEmotionalResonance(path),
      transformationPotential: this.calculateTransformation(path)
    }));

    return scoredPaths.slice(0, maxPaths);
  }

  /**
   * Get current geometric position from cards
   * Maps 3D geometric space (x,y,z) to consciousness dimensions
   */
  getGeometricPosition(cards) {
    const geometricAnalysis = extractGeometricThemes(cards);
    const [x, y, z] = geometricAnalysis.centroid;

    // Map geometric coordinates to consciousness dimensions:
    // X-axis: Elemental polarity (Fire/Air +, Water/Earth -)
    // Y-axis: Consciousness depth (Shadow -, Light +)
    // Z-axis: Temporal focus (Past -, Future +)

    return {
      // Y-axis: consciousness (light) vs shadow (dark)
      consciousness: Math.max(0, y),      // Positive Y = light/conscious
      shadow: Math.max(0, -y),            // Negative Y = shadow/unconscious

      // X-axis: active (fire/air) vs receptive (water/earth)
      active: Math.max(0, x),             // Positive X = active/fire/air
      receptive: Math.max(0, -x),         // Negative X = receptive/water/earth

      // Z-axis: temporal focus
      future: Math.max(0, z),             // Positive Z = future-focused
      past: Math.max(0, -z),              // Negative Z = past-focused

      // Full centroid and themes
      centroid: geometricAnalysis.centroid,
      themes: geometricAnalysis.themes || [],
      avgOverlap: geometricAnalysis.avgOverlap
    };
  }

  /**
   * Get position of a destination theme
   */
  getThemePosition(theme) {
    // Map themes to geometric coordinates
    const THEME_POSITIONS = {
      'healing': { shadow: 0.3, consciousness: 0.7, receptive: 0.8 },
      'breakthrough': { shadow: 0.2, consciousness: 0.9, active: 0.9 },
      'shadow_work': { shadow: 0.9, consciousness: 0.6, receptive: 0.7 },
      'action': { shadow: 0.1, consciousness: 0.8, active: 0.95 },
      'integration': { shadow: 0.5, consciousness: 0.8, receptive: 0.6, active: 0.6 },
      'transformation': { shadow: 0.7, consciousness: 0.7, active: 0.7 }
      // ... more themes
    };

    return THEME_POSITIONS[theme] || { consciousness: 0.5, active: 0.5, shadow: 0.5 };
  }

  /**
   * Discover possible paths through card space
   * Each path is a sequence of cards/themes connecting current to destination
   */
  discoverPaths(start, end, maxDepth) {
    // Simplified path discovery - in production, use actual geometric embeddings
    const paths = [];

    // Direct path
    paths.push({
      waypoints: [start, end],
      type: 'direct',
      cards: this.getCardsAlongPath(start, end)
    });

    // Shadow path (goes through shadow first)
    const shadowPoint = { ...start, shadow: 0.9 };
    paths.push({
      waypoints: [start, shadowPoint, end],
      type: 'shadow',
      cards: this.getCardsAlongPath(start, shadowPoint).concat(
        this.getCardsAlongPath(shadowPoint, end)
      )
    });

    // Integration path (balanced approach)
    const midPoint = this.getMidpoint(start, end);
    paths.push({
      waypoints: [start, midPoint, end],
      type: 'integration',
      cards: this.getCardsAlongPath(start, midPoint).concat(
        this.getCardsAlongPath(midPoint, end)
      )
    });

    return paths;
  }

  /**
   * Get cards along a geometric path
   * Returns cards whose embeddings lie along the path
   */
  getCardsAlongPath(start, end) {
    // Placeholder - in production, query actual 78D embeddings
    // Returns cards closest to the line segment in geometric space
    return [
      { name: 'The Star', position: this.getMidpoint(start, end) },
      { name: 'Temperance', position: this.interpolate(start, end, 0.33) }
    ];
  }

  // Geometric calculations
  calculateDistance(path) {
    return path.waypoints.reduce((sum, point, i) => {
      if (i === 0) return 0;
      return sum + this.euclideanDistance(path.waypoints[i - 1], point);
    }, 0);
  }

  calculateCurvature(path) {
    // Measure how much path deviates from straight line
    const directDist = this.euclideanDistance(path.waypoints[0], path.waypoints[path.waypoints.length - 1]);
    const pathDist = this.calculateDistance(path);
    return (pathDist - directDist) / directDist;
  }

  calculateShadowDepth(path) {
    // Average shadow level along path
    return path.waypoints.reduce((sum, p) => sum + (p.shadow || 0), 0) / path.waypoints.length;
  }

  calculateEnergyCost(path) {
    // How much active energy required
    return path.waypoints.reduce((sum, p) => sum + (p.active || 0), 0);
  }

  calculateEmotionalResonance(path) {
    // How emotionally meaningful (receptive + shadow depth)
    return this.calculateShadowDepth(path) * 0.5 +
           path.waypoints.reduce((sum, p) => sum + (p.receptive || 0), 0) / path.waypoints.length * 0.5;
  }

  calculateTransformation(path) {
    // How much change occurs (distance in consciousness dimension)
    const start = path.waypoints[0].consciousness || 0;
    const end = path.waypoints[path.waypoints.length - 1].consciousness || 0;
    return Math.abs(end - start);
  }

  euclideanDistance(a, b) {
    const dims = ['shadow', 'consciousness', 'active', 'receptive', 'past', 'future'];
    return Math.sqrt(
      dims.reduce((sum, dim) => {
        const diff = (a[dim] || 0) - (b[dim] || 0);
        return sum + diff * diff;
      }, 0)
    );
  }

  getMidpoint(a, b) {
    const dims = ['shadow', 'consciousness', 'active', 'receptive'];
    const mid = {};
    dims.forEach(dim => {
      mid[dim] = ((a[dim] || 0) + (b[dim] || 0)) / 2;
    });
    return mid;
  }

  interpolate(a, b, t) {
    const dims = ['shadow', 'consciousness', 'active', 'receptive'];
    const point = {};
    dims.forEach(dim => {
      point[dim] = (a[dim] || 0) * (1 - t) + (b[dim] || 0) * t;
    });
    return point;
  }
}

// ═══════════════════════════════════════════════════════════
// ROUTE SELECTION - Subjective guide preferences
// ═══════════════════════════════════════════════════════════

/**
 * Select best route based on guide personality
 */
class RouteSelector {
  constructor(guide) {
    this.guide = GUIDE_ARCHETYPES[guide];
  }

  /**
   * Choose optimal route from available paths
   */
  selectRoute(paths, userContext) {
    const { navigationStyle } = this.guide;

    // Score each path based on guide's values
    const scoredPaths = paths.map(path => ({
      ...path,
      guideScore: this.scorePathForGuide(path, navigationStyle, userContext)
    }));

    // Sort by guide score
    scoredPaths.sort((a, b) => b.guideScore - a.guideScore);

    return scoredPaths[0];
  }

  /**
   * Score path according to guide values
   */
  scorePathForGuide(path, style, userContext) {
    let score = 0;

    if (style.priority === 'emotional_resonance') {
      // Luna prioritizes emotionally meaningful paths
      score += path.emotionalResonance * 10;
      score += path.shadowDepth * 5;  // Values shadow work
      score += path.curvature * 3;     // Prefers spiral paths
      score -= path.distance * 0.5;    // Distance less important
    } else if (style.priority === 'goal_efficiency') {
      // Sol prioritizes efficient paths
      score -= path.distance * 10;     // Minimize distance
      score -= path.curvature * 5;     // Prefer straight lines
      score += path.transformationPotential * 8;  // Maximize transformation
      score -= path.energyCost * 0.5;  // Minimize wasted energy
    }

    // Adjust for user state
    if (userContext.inCrisis) {
      // Both guides prefer safer paths in crisis
      score -= path.shadowDepth * 3;
    }

    return score;
  }

  /**
   * Generate navigation instructions for chosen route
   */
  generateInstructions(route, userContext) {
    const { name, navigationStyle } = this.guide;

    const instructions = {
      guide: name,
      route,
      steps: this.buildSteps(route, navigationStyle),
      narration: this.buildNarration(route, userContext)
    };

    return instructions;
  }

  buildSteps(route, style) {
    // Convert waypoints to actionable steps
    return route.waypoints.map((waypoint, i) => {
      if (i === 0) return { type: 'start', position: waypoint };

      return {
        type: 'waypoint',
        position: waypoint,
        cards: route.cards.filter(c =>
          this.isCardNearWaypoint(c.position, waypoint)
        ),
        instruction: this.getWaypointInstruction(waypoint, style)
      };
    });
  }

  getWaypointInstruction(waypoint, style) {
    if (style.priority === 'emotional_resonance') {
      // Luna-style instructions
      if (waypoint.shadow > 0.7) {
        return 'Pause here. Notice what you\'ve been avoiding. The shadow holds wisdom.';
      } else if (waypoint.receptive > 0.7) {
        return 'Rest in this receptive space. Let understanding come to you.';
      }
      return 'Feel into this transition. What shifts inside you?';
    } else {
      // Sol-style instructions
      if (waypoint.active > 0.7) {
        return 'Action point. What concrete step can you take now?';
      } else if (waypoint.consciousness > 0.8) {
        return 'Clarity moment. See the pattern. Name it.';
      }
      return 'Move through this deliberately. Stay focused on the goal.';
    }
  }

  buildNarration(route, userContext) {
    // Generate spoken narration (for TTS)
    const { name, greetings, systemPrompt } = this.guide;

    return {
      opening: pick(greetings),
      journey: this.narrateJourney(route),
      closing: this.generateClosing(route, userContext)
    };
  }

  narrateJourney(route) {
    // This will be enhanced by LLM
    const segments = route.waypoints.map((waypoint, i) => {
      if (i === 0) return `We begin at ${this.describePosition(waypoint)}.`;

      return `${this.describeTransition(route.waypoints[i - 1], waypoint)}`;
    });

    return segments.join(' ');
  }

  describePosition(position) {
    // Poetic description of geometric position
    const descriptors = [];

    if (position.shadow > 0.7) descriptors.push('deep in shadow');
    else if (position.shadow < 0.3) descriptors.push('in the light');

    if (position.active > 0.7) descriptors.push('surging with momentum');
    else if (position.receptive > 0.7) descriptors.push('in quiet receptivity');

    return descriptors.join(', ') || 'a place of balance';
  }

  describeTransition(from, to) {
    const shadowChange = to.shadow - from.shadow;
    const activeChange = to.active - from.active;

    let desc = 'We move ';

    if (Math.abs(shadowChange) > 0.3) {
      desc += shadowChange > 0 ? 'deeper into shadow' : 'toward light';
    }

    if (Math.abs(activeChange) > 0.3) {
      desc += activeChange > 0 ? ', gathering momentum' : ', entering stillness';
    }

    return desc + '.';
  }

  generateClosing(route, userContext) {
    const { name } = this.guide;
    return `This is the path I see for you. Walk it with ${name === 'Luna' ? 'tenderness' : 'courage'}.`;
  }

  isCardNearWaypoint(cardPos, waypoint) {
    // Check if card is close to waypoint in geometric space
    const dims = ['shadow', 'consciousness', 'active', 'receptive'];
    const distance = Math.sqrt(
      dims.reduce((sum, dim) => {
        const diff = (cardPos[dim] || 0) - (waypoint[dim] || 0);
        return sum + diff * diff;
      }, 0)
    );
    return distance < 0.2; // Threshold for "near"
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export {
  GUIDE_ARCHETYPES,
  PathFinder,
  RouteSelector
};

export function getGuideInfo(guideName) {
  return GUIDE_ARCHETYPES[guideName];
}
