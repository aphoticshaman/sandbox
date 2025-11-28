/**
 * LatticeScript Abstract Syntax Tree
 * Type definitions for dimension configurations
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Position {
  line: number;
  column: number;
}

export interface ASTNode {
  type: string;
  position: Position;
}

// ============================================================================
// Dimension Definition
// ============================================================================

export interface DimensionAST extends ASTNode {
  type: 'Dimension';
  name: string;
  visual?: VisualConfig;
  rules?: RulesConfig;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  fractals: FractalDefinition[];
  fallacies: FallacyDefinition[];
  meta?: MetaConfig;
}

// ============================================================================
// Visual Configuration
// ============================================================================

export interface VisualConfig extends ASTNode {
  type: 'Visual';
  palette: string[];          // Hex colors
  background: string;         // Hex color
  style: VisualStyle;
  effects: VisualEffect[];
  fractalBase?: FractalType;  // Default fractal for dimension
}

export type VisualStyle =
  | 'wireframe'
  | 'organic'
  | 'fluid'
  | 'void'
  | 'psychedelic'
  | 'fractal';

export interface VisualEffect extends ASTNode {
  type: 'Effect';
  name: EffectType;
  params: Record<string, number | string | boolean>;
}

export type EffectType =
  | 'bloom'
  | 'chromatic_aberration'
  | 'kaleidoscope'
  | 'fractal_zoom'
  | 'color_cycle'
  | 'geometric_morph'
  | 'breath_pulse'
  | 'sacred_geometry'
  | 'dmt_flash'
  | 'ego_dissolution';

// ============================================================================
// Fractal Definitions
// ============================================================================

export interface FractalDefinition extends ASTNode {
  type: 'Fractal';
  name: string;
  fractalType: FractalType;
  params: FractalParams;
  triggers: FractalTrigger[];
}

export type FractalType =
  | 'mandelbrot'
  | 'julia'
  | 'sierpinski'
  | 'menger'
  | 'koch'
  | 'dragon'
  | 'tree'
  | 'fern'
  | 'flame'
  | 'sacred_spiral'
  | 'flower_of_life'
  | 'metatron';

export interface FractalParams {
  iterations: number;
  scale: number;
  rotation: number;
  colorMode: 'palette' | 'hue_shift' | 'depth' | 'escape_time';
  animationSpeed?: number;
  recursionDepth?: number;
  seedComplex?: [number, number];  // For Julia sets
}

export interface FractalTrigger extends ASTNode {
  type: 'FractalTrigger';
  event: string;
  transform: FractalTransform;
}

export interface FractalTransform {
  zoom?: number;
  rotate?: number;
  shift?: [number, number];
  morph?: FractalType;  // Transform to different fractal
  duration: number;
}

// ============================================================================
// Logical Fallacy Puzzles
// ============================================================================

export interface FallacyDefinition extends ASTNode {
  type: 'Fallacy';
  name: string;
  fallacyType: LogicalFallacy;
  presentation: FallacyPresentation;
  solution: FallacySolution;
  metaHook?: string;  // Meta-awareness hook on solve
}

export type LogicalFallacy =
  // Classic fallacies
  | 'ad_hominem'
  | 'straw_man'
  | 'false_dichotomy'
  | 'slippery_slope'
  | 'circular_reasoning'
  | 'appeal_to_authority'
  | 'appeal_to_emotion'
  | 'hasty_generalization'
  | 'post_hoc'
  | 'red_herring'
  | 'tu_quoque'
  | 'no_true_scotsman'
  // Meta fallacies (about thinking itself)
  | 'fallacy_fallacy'
  | 'confirmation_bias'
  | 'anchoring'
  | 'sunk_cost'
  | 'dunning_kruger'
  | 'blind_spot';

export interface FallacyPresentation {
  format: 'dialogue' | 'visual' | 'structural' | 'paradox';
  elements: PresentationElement[];
}

export interface PresentationElement {
  type: 'statement' | 'node' | 'edge' | 'visual';
  content: string;
  role: 'premise' | 'conclusion' | 'hidden' | 'distractor';
}

export interface FallacySolution {
  correct: string[];          // Valid identifications
  partial: string[];          // Partial credit answers
  explanation: string;        // Shown after solve
  insightAwarded: string;     // Meta-awareness insight
}

// ============================================================================
// Rules Configuration
// ============================================================================

export interface RulesConfig extends ASTNode {
  type: 'Rules';
  movement: MovementType;
  physics: PhysicsType;
  time: TimeType;
  paradoxTolerance: number;  // 0-1
  perceptionMods: PerceptionMod[];
}

export type MovementType =
  | 'attention_based'
  | 'rhythm_synced'
  | 'memory_jump'
  | 'edge_sensing'
  | 'fractal_dive'
  | 'thought_flow';

export type PhysicsType =
  | 'none'
  | 'graph'
  | 'organic'
  | 'fluid'
  | 'void'
  | 'non_euclidean';

export type TimeType =
  | 'static'
  | 'flowing'
  | 'pooled'
  | 'recursive'
  | 'relative';

export interface PerceptionMod {
  name: string;
  trigger: string;
  effect: PerceptionEffect;
}

export type PerceptionEffect =
  | 'color_shift'
  | 'scale_warp'
  | 'time_dilation'
  | 'pattern_recognition'
  | 'boundary_dissolution'
  | 'synesthesia';

// ============================================================================
// Node Definitions
// ============================================================================

export interface NodeDefinition extends ASTNode {
  type: 'Node';
  name: string;
  position: [number, number, number];
  nodeType: NodeType;
  content: NodeContent | null;
  visual?: NodeVisual;
  handlers: EventHandler[];
}

export type NodeType =
  | 'spawn'
  | 'container'
  | 'gate'
  | 'observer'
  | 'quantum'
  | 'portal'
  | 'fractal_seed'
  | 'fallacy_anchor';

export interface NodeContent {
  contentType: 'key' | 'fragment' | 'question' | 'insight' | 'fallacy_clue';
  value: string;
  params?: Record<string, any>;
}

export interface NodeVisual {
  shape: 'icosahedron' | 'sphere' | 'cube' | 'pyramid' | 'torus' | 'fractal';
  scale: number;
  color?: string;
  emissive?: boolean;
  pulseRate?: number;
  fractalType?: FractalType;
}

// ============================================================================
// Edge Definitions
// ============================================================================

export interface EdgeDefinition extends ASTNode {
  type: 'Edge';
  from: string;
  to: string;
  edgeType: EdgeType;
  weight: number;
  key?: string;           // For locked edges
  visual?: EdgeVisual;
  handlers: EventHandler[];
}

export type EdgeType =
  | 'open'
  | 'weighted'
  | 'locked'
  | 'one_way'
  | 'quantum'
  | 'breathing'
  | 'fractal_path';

export interface EdgeVisual {
  style: 'solid' | 'dashed' | 'dotted' | 'pulse' | 'flow' | 'organic';
  thickness: number;
  color?: string;
  animationSpeed?: number;
}

// ============================================================================
// Meta-Awareness Configuration
// ============================================================================

export interface MetaConfig extends ASTNode {
  type: 'Meta';
  hooks: MetaHook[];
  insights: InsightDefinition[];
  scaleAwareness: ScaleAwarenessConfig;
}

export interface MetaHook extends ASTNode {
  type: 'MetaHook';
  trigger: MetaTrigger;
  condition?: Expression;
  actions: MetaAction[];
}

export interface MetaTrigger {
  event: MetaEvent;
  params: Record<string, any>;
}

export type MetaEvent =
  | 'on_witness'
  | 'on_revisit'
  | 'on_stuck'
  | 'on_insight'
  | 'on_fallacy_detect'
  | 'on_fractal_zoom'
  | 'on_scale_shift'
  | 'on_paradox_hold'
  | 'on_flow_state'
  | 'on_meta_level_change';

export type MetaAction =
  | { type: 'reveal'; target: string }
  | { type: 'hide'; target: string }
  | { type: 'mutate_graph'; mutation: GraphMutation }
  | { type: 'suggest_witness' }
  | { type: 'award_insight'; insight: string }
  | { type: 'trigger_fractal'; fractal: string; transform: FractalTransform }
  | { type: 'shift_perception'; effect: PerceptionEffect; duration: number }
  | { type: 'log_event'; event: string; data?: Record<string, any> }
  | { type: 'prompt_scale_shift'; direction: 'in' | 'out' };

export interface GraphMutation {
  operation: 'add_node' | 'remove_node' | 'add_edge' | 'remove_edge' | 'transform';
  target?: string;
  params: Record<string, any>;
}

// ============================================================================
// Scale Awareness (Tree → Forest → Galaxy)
// ============================================================================

export interface ScaleAwarenessConfig extends ASTNode {
  type: 'ScaleAwareness';
  levels: ScaleLevel[];
  transitions: ScaleTransition[];
}

export interface ScaleLevel {
  name: string;
  description: string;
  zoomFactor: number;        // Relative to base
  visibleElements: string[]; // What can be seen at this scale
  hiddenElements: string[];  // What becomes invisible
  fractalDepth?: number;     // For fractal zoom
  metaInsight?: string;      // Insight available at this scale
}

export interface ScaleTransition {
  from: string;
  to: string;
  trigger: 'witness' | 'time' | 'pattern' | 'manual';
  duration: number;
  effect: VisualEffect;
}

// ============================================================================
// Insights
// ============================================================================

export interface InsightDefinition extends ASTNode {
  type: 'Insight';
  name: string;
  category: InsightCategory;
  description: string;
  unlockedBy: string;
  veraConnection?: string;  // How Vera might reference this
}

export type InsightCategory =
  | 'logical'        // Fallacy detection
  | 'perceptual'     // Scale/fractal awareness
  | 'metacognitive'  // Thinking about thinking
  | 'relational'     // Self-other awareness
  | 'integrative';   // Connecting domains

// ============================================================================
// Expressions (for conditions)
// ============================================================================

export type Expression =
  | { type: 'literal'; value: any }
  | { type: 'identifier'; name: string }
  | { type: 'binary'; op: BinaryOp; left: Expression; right: Expression }
  | { type: 'unary'; op: UnaryOp; operand: Expression }
  | { type: 'call'; callee: string; args: Expression[] }
  | { type: 'member'; object: Expression; property: string };

export type BinaryOp = '==' | '!=' | '<' | '>' | '<=' | '>=' | '&&' | '||' | '+' | '-' | '*' | '/';
export type UnaryOp = '!' | '-';

// ============================================================================
// Event Handlers
// ============================================================================

export interface EventHandler extends ASTNode {
  type: 'Handler';
  event: string;
  actions: Action[];
}

export type Action =
  | { type: 'emit'; event: string; data?: Record<string, any> }
  | { type: 'flash'; duration: number }
  | { type: 'transition'; target: string }
  | { type: 'set'; property: string; value: any }
  | { type: 'call'; function: string; args: any[] }
  | { type: 'fractal_burst'; fractalType: FractalType; duration: number }
  | { type: 'perception_shift'; effect: PerceptionEffect; intensity: number };
