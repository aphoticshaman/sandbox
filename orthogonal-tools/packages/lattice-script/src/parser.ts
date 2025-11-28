/**
 * LatticeScript Parser
 * Builds AST from token stream
 */

import { Token, TokenType, tokenize } from './lexer';
import * as AST from './ast';

export interface ParseError {
  message: string;
  token: Token;
}

export class Parser {
  private tokens: Token[];
  private current = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): { ast: AST.DimensionAST | null; errors: ParseError[] } {
    try {
      const dimension = this.parseDimension();
      return { ast: dimension, errors: this.errors };
    } catch (e) {
      return { ast: null, errors: this.errors };
    }
  }

  // ========================================================================
  // Top-Level Parsing
  // ========================================================================

  private parseDimension(): AST.DimensionAST {
    this.consume(TokenType.DIMENSION, 'Expected "dimension" keyword');
    const nameToken = this.consume(TokenType.IDENTIFIER, 'Expected dimension name');
    this.consume(TokenType.LBRACE, 'Expected "{" after dimension name');

    const dimension: AST.DimensionAST = {
      type: 'Dimension',
      name: nameToken.value,
      nodes: [],
      edges: [],
      fractals: [],
      fallacies: [],
      position: { line: nameToken.line, column: nameToken.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.parseTopLevelStatement(dimension);
    }

    this.consume(TokenType.RBRACE, 'Expected "}" at end of dimension');
    return dimension;
  }

  private parseTopLevelStatement(dimension: AST.DimensionAST) {
    if (this.check(TokenType.VISUAL)) {
      dimension.visual = this.parseVisual();
    } else if (this.check(TokenType.RULES)) {
      dimension.rules = this.parseRules();
    } else if (this.check(TokenType.NODE)) {
      dimension.nodes.push(this.parseNode());
    } else if (this.check(TokenType.EDGE)) {
      dimension.edges.push(this.parseEdge());
    } else if (this.check(TokenType.FRACTAL)) {
      dimension.fractals.push(this.parseFractal());
    } else if (this.check(TokenType.FALLACY)) {
      dimension.fallacies.push(this.parseFallacy());
    } else if (this.check(TokenType.META)) {
      dimension.meta = this.parseMeta();
    } else if (this.check(TokenType.IDENTIFIER)) {
      // Property assignment: name: value
      this.parsePropertyAssignment(dimension);
    } else {
      this.error(this.peek(), 'Unexpected token in dimension body');
      this.advance(); // Skip to recover
    }
  }

  // ========================================================================
  // Visual Configuration
  // ========================================================================

  private parseVisual(): AST.VisualConfig {
    const token = this.consume(TokenType.VISUAL, 'Expected "visual"');
    this.consume(TokenType.LBRACE, 'Expected "{" after visual');

    const visual: AST.VisualConfig = {
      type: 'Visual',
      palette: [],
      background: '#000000',
      style: 'wireframe',
      effects: [],
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const propName = this.consume(TokenType.IDENTIFIER, 'Expected property name');
      this.consume(TokenType.COLON, 'Expected ":" after property name');

      switch (propName.value) {
        case 'palette':
          visual.palette = this.parseColorArray();
          break;
        case 'background':
          visual.background = this.parseColor();
          break;
        case 'style':
          visual.style = this.parseIdentifier() as AST.VisualStyle;
          break;
        case 'effects':
          visual.effects = this.parseEffectList();
          break;
        case 'fractalBase':
        case 'fractal_base':
          visual.fractalBase = this.parseIdentifier() as AST.FractalType;
          break;
        default:
          this.error(propName, `Unknown visual property: ${propName.value}`);
          this.skipValue();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}" after visual');
    return visual;
  }

  private parseEffectList(): AST.VisualEffect[] {
    const effects: AST.VisualEffect[] = [];
    this.consume(TokenType.LBRACKET, 'Expected "[" for effects list');

    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      effects.push(this.parseEffect());
      if (!this.check(TokenType.RBRACKET)) {
        this.consume(TokenType.COMMA, 'Expected "," between effects');
      }
    }

    this.consume(TokenType.RBRACKET, 'Expected "]" after effects list');
    return effects;
  }

  private parseEffect(): AST.VisualEffect {
    const token = this.peek();

    if (this.check(TokenType.IDENTIFIER)) {
      // Simple effect: just the name
      const name = this.advance();
      return {
        type: 'Effect',
        name: name.value as AST.EffectType,
        params: {},
        position: { line: name.line, column: name.column },
      };
    }

    // Complex effect: { name: "...", param: value, ... }
    this.consume(TokenType.LBRACE, 'Expected effect name or "{"');
    const effect: AST.VisualEffect = {
      type: 'Effect',
      name: 'bloom',
      params: {},
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property name');
      this.consume(TokenType.COLON, 'Expected ":"');

      if (prop.value === 'name') {
        effect.name = this.parseStringOrIdentifier() as AST.EffectType;
      } else {
        effect.params[prop.value] = this.parseValue();
      }

      if (!this.check(TokenType.RBRACE) && this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return effect;
  }

  // ========================================================================
  // Fractal Definitions
  // ========================================================================

  private parseFractal(): AST.FractalDefinition {
    const token = this.consume(TokenType.FRACTAL, 'Expected "fractal"');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected fractal name');
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const fractal: AST.FractalDefinition = {
      type: 'Fractal',
      name: name.value,
      fractalType: 'mandelbrot',
      params: {
        iterations: 100,
        scale: 1.0,
        rotation: 0,
        colorMode: 'palette',
      },
      triggers: [],
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      switch (prop.value) {
        case 'type':
          fractal.fractalType = this.parseIdentifier() as AST.FractalType;
          break;
        case 'iterations':
          fractal.params.iterations = this.parseNumber();
          break;
        case 'scale':
          fractal.params.scale = this.parseNumber();
          break;
        case 'rotation':
          fractal.params.rotation = this.parseNumber();
          break;
        case 'colorMode':
        case 'color_mode':
          fractal.params.colorMode = this.parseIdentifier() as any;
          break;
        case 'animationSpeed':
        case 'animation_speed':
          fractal.params.animationSpeed = this.parseNumber();
          break;
        case 'recursionDepth':
        case 'recursion_depth':
          fractal.params.recursionDepth = this.parseNumber();
          break;
        case 'seed':
          fractal.params.seedComplex = this.parseNumberArray() as [number, number];
          break;
        case 'on':
          fractal.triggers.push(this.parseFractalTrigger());
          break;
        default:
          this.error(prop, `Unknown fractal property: ${prop.value}`);
          this.skipValue();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return fractal;
  }

  private parseFractalTrigger(): AST.FractalTrigger {
    // on event { transform }
    const event = this.parseIdentifier();
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const transform: AST.FractalTransform = { duration: 1.0 };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      switch (prop.value) {
        case 'zoom':
          transform.zoom = this.parseNumber();
          break;
        case 'rotate':
          transform.rotate = this.parseNumber();
          break;
        case 'shift':
          transform.shift = this.parseNumberArray() as [number, number];
          break;
        case 'morph':
          transform.morph = this.parseIdentifier() as AST.FractalType;
          break;
        case 'duration':
          transform.duration = this.parseNumber();
          break;
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');

    return {
      type: 'FractalTrigger',
      event,
      transform,
      position: { line: 0, column: 0 },
    };
  }

  // ========================================================================
  // Fallacy Definitions
  // ========================================================================

  private parseFallacy(): AST.FallacyDefinition {
    const token = this.consume(TokenType.FALLACY, 'Expected "fallacy"');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected fallacy name');
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const fallacy: AST.FallacyDefinition = {
      type: 'Fallacy',
      name: name.value,
      fallacyType: 'straw_man',
      presentation: { format: 'dialogue', elements: [] },
      solution: { correct: [], partial: [], explanation: '', insightAwarded: '' },
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      switch (prop.value) {
        case 'type':
          fallacy.fallacyType = this.parseIdentifier() as AST.LogicalFallacy;
          break;
        case 'presentation':
          fallacy.presentation = this.parseFallacyPresentation();
          break;
        case 'solution':
          fallacy.solution = this.parseFallacySolution();
          break;
        case 'metaHook':
        case 'meta_hook':
          fallacy.metaHook = this.parseString();
          break;
        default:
          this.error(prop, `Unknown fallacy property: ${prop.value}`);
          this.skipValue();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return fallacy;
  }

  private parseFallacyPresentation(): AST.FallacyPresentation {
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const presentation: AST.FallacyPresentation = {
      format: 'dialogue',
      elements: [],
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      if (prop.value === 'format') {
        presentation.format = this.parseIdentifier() as any;
      } else if (prop.value === 'elements') {
        presentation.elements = this.parsePresentationElements();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return presentation;
  }

  private parsePresentationElements(): AST.PresentationElement[] {
    const elements: AST.PresentationElement[] = [];
    this.consume(TokenType.LBRACKET, 'Expected "["');

    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      this.consume(TokenType.LBRACE, 'Expected "{"');

      const element: AST.PresentationElement = {
        type: 'statement',
        content: '',
        role: 'premise',
      };

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
        this.consume(TokenType.COLON, 'Expected ":"');

        if (prop.value === 'type') {
          element.type = this.parseIdentifier() as any;
        } else if (prop.value === 'content') {
          element.content = this.parseString();
        } else if (prop.value === 'role') {
          element.role = this.parseIdentifier() as any;
        }
      }

      this.consume(TokenType.RBRACE, 'Expected "}"');
      elements.push(element);

      if (!this.check(TokenType.RBRACKET) && this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.consume(TokenType.RBRACKET, 'Expected "]"');
    return elements;
  }

  private parseFallacySolution(): AST.FallacySolution {
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const solution: AST.FallacySolution = {
      correct: [],
      partial: [],
      explanation: '',
      insightAwarded: '',
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      switch (prop.value) {
        case 'correct':
          solution.correct = this.parseStringArray();
          break;
        case 'partial':
          solution.partial = this.parseStringArray();
          break;
        case 'explanation':
          solution.explanation = this.parseString();
          break;
        case 'insightAwarded':
        case 'insight':
          solution.insightAwarded = this.parseString();
          break;
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return solution;
  }

  // ========================================================================
  // Node & Edge Parsing (abbreviated for space)
  // ========================================================================

  private parseNode(): AST.NodeDefinition {
    const token = this.consume(TokenType.NODE, 'Expected "node"');
    const name = this.consume(TokenType.IDENTIFIER, 'Expected node name');
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const node: AST.NodeDefinition = {
      type: 'Node',
      name: name.value,
      position: [0, 0, 0],
      nodeType: 'container',
      content: null,
      handlers: [],
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.parseNodeProperty(node);
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    (node as any).position = { line: token.line, column: token.column };
    return node;
  }

  private parseNodeProperty(node: AST.NodeDefinition) {
    if (this.check(TokenType.ON)) {
      this.advance();
      node.handlers.push(this.parseHandler());
      return;
    }

    const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
    this.consume(TokenType.COLON, 'Expected ":"');

    switch (prop.value) {
      case 'position':
        node.position = this.parseNumberArray() as [number, number, number];
        break;
      case 'type':
        node.nodeType = this.parseIdentifier() as AST.NodeType;
        break;
      case 'content':
        node.content = this.parseNodeContent();
        break;
      case 'visual':
        node.visual = this.parseNodeVisual();
        break;
      default:
        this.skipValue();
    }
  }

  private parseEdge(): AST.EdgeDefinition {
    const token = this.consume(TokenType.EDGE, 'Expected "edge"');
    const from = this.consume(TokenType.IDENTIFIER, 'Expected source node');
    this.consume(TokenType.ARROW, 'Expected "->"');
    const to = this.consume(TokenType.IDENTIFIER, 'Expected target node');
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const edge: AST.EdgeDefinition = {
      type: 'Edge',
      from: from.value,
      to: to.value,
      edgeType: 'open',
      weight: 1.0,
      handlers: [],
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.parseEdgeProperty(edge);
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return edge;
  }

  private parseEdgeProperty(edge: AST.EdgeDefinition) {
    const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
    this.consume(TokenType.COLON, 'Expected ":"');

    switch (prop.value) {
      case 'type':
        edge.edgeType = this.parseIdentifier() as AST.EdgeType;
        break;
      case 'weight':
        edge.weight = this.parseNumber();
        break;
      case 'key':
        edge.key = this.parseString();
        break;
      default:
        this.skipValue();
    }
  }

  // ========================================================================
  // Rules & Meta Parsing
  // ========================================================================

  private parseRules(): AST.RulesConfig {
    const token = this.consume(TokenType.RULES, 'Expected "rules"');
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const rules: AST.RulesConfig = {
      type: 'Rules',
      movement: 'attention_based',
      physics: 'none',
      time: 'static',
      paradoxTolerance: 0,
      perceptionMods: [],
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      switch (prop.value) {
        case 'movement':
          rules.movement = this.parseIdentifier() as AST.MovementType;
          break;
        case 'physics':
          rules.physics = this.parseIdentifier() as AST.PhysicsType;
          break;
        case 'time':
          rules.time = this.parseIdentifier() as AST.TimeType;
          break;
        case 'paradoxTolerance':
        case 'paradox_tolerance':
          rules.paradoxTolerance = this.parseNumber();
          break;
        default:
          this.skipValue();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return rules;
  }

  private parseMeta(): AST.MetaConfig {
    const token = this.consume(TokenType.META, 'Expected "meta"');
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const meta: AST.MetaConfig = {
      type: 'Meta',
      hooks: [],
      insights: [],
      scaleAwareness: {
        type: 'ScaleAwareness',
        levels: [],
        transitions: [],
        position: { line: token.line, column: token.column },
      },
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.ON)) {
        this.advance();
        meta.hooks.push(this.parseMetaHook());
      } else {
        // Skip other properties for now
        this.advance();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return meta;
  }

  private parseMetaHook(): AST.MetaHook {
    const trigger = this.parseIdentifier();
    const token = this.previous();
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const hook: AST.MetaHook = {
      type: 'MetaHook',
      trigger: { event: trigger as AST.MetaEvent, params: {} },
      actions: [],
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Parse action
      const actionName = this.consume(TokenType.IDENTIFIER, 'Expected action');
      this.consume(TokenType.LPAREN, 'Expected "("');
      const args = this.parseArguments();
      this.consume(TokenType.RPAREN, 'Expected ")"');

      hook.actions.push({
        type: actionName.value as any,
        ...args,
      } as AST.MetaAction);
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return hook;
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  private parseHandler(): AST.EventHandler {
    const event = this.parseIdentifier();
    const token = this.previous();
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const handler: AST.EventHandler = {
      type: 'Handler',
      event,
      actions: [],
      position: { line: token.line, column: token.column },
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const actionName = this.consume(TokenType.IDENTIFIER, 'Expected action');
      this.consume(TokenType.LPAREN, 'Expected "("');
      const args = this.parseArguments();
      this.consume(TokenType.RPAREN, 'Expected ")"');

      handler.actions.push({ type: actionName.value, ...args } as AST.Action);
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return handler;
  }

  private parseNodeContent(): AST.NodeContent | null {
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'empty') {
      this.advance();
      return null;
    }

    const contentType = this.parseIdentifier();
    this.consume(TokenType.LPAREN, 'Expected "("');
    const value = this.parseString();
    this.consume(TokenType.RPAREN, 'Expected ")"');

    return { contentType: contentType as any, value };
  }

  private parseNodeVisual(): AST.NodeVisual {
    this.consume(TokenType.LBRACE, 'Expected "{"');

    const visual: AST.NodeVisual = {
      shape: 'icosahedron',
      scale: 1.0,
    };

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const prop = this.consume(TokenType.IDENTIFIER, 'Expected property');
      this.consume(TokenType.COLON, 'Expected ":"');

      switch (prop.value) {
        case 'shape':
          visual.shape = this.parseIdentifier() as any;
          break;
        case 'scale':
          visual.scale = this.parseNumber();
          break;
        case 'color':
          visual.color = this.parseColor();
          break;
        case 'emissive':
          visual.emissive = this.parseBoolean();
          break;
        case 'pulseRate':
        case 'pulse_rate':
          visual.pulseRate = this.parseNumber();
          break;
        case 'fractalType':
        case 'fractal_type':
          visual.fractalType = this.parseIdentifier() as AST.FractalType;
          break;
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return visual;
  }

  private parsePropertyAssignment(target: any) {
    const name = this.consume(TokenType.IDENTIFIER, 'Expected property name');
    this.consume(TokenType.COLON, 'Expected ":"');
    const value = this.parseValue();
    target[name.value] = value;
  }

  private parseArguments(): Record<string, any> {
    const args: Record<string, any> = {};
    let index = 0;

    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      const value = this.parseValue();
      args[`arg${index}`] = value;
      index++;

      if (!this.check(TokenType.RPAREN) && this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    return args;
  }

  private parseValue(): any {
    if (this.check(TokenType.STRING)) return this.parseString();
    if (this.check(TokenType.NUMBER)) return this.parseNumber();
    if (this.check(TokenType.BOOLEAN)) return this.parseBoolean();
    if (this.check(TokenType.HEX_COLOR)) return this.parseColor();
    if (this.check(TokenType.LBRACKET)) return this.parseArray();
    if (this.check(TokenType.LBRACE)) return this.parseObject();
    if (this.check(TokenType.IDENTIFIER)) return this.parseIdentifier();
    throw this.error(this.peek(), 'Expected value');
  }

  private parseString(): string {
    return this.consume(TokenType.STRING, 'Expected string').value;
  }

  private parseNumber(): number {
    return parseFloat(this.consume(TokenType.NUMBER, 'Expected number').value);
  }

  private parseBoolean(): boolean {
    return this.consume(TokenType.BOOLEAN, 'Expected boolean').value === 'true';
  }

  private parseColor(): string {
    return this.consume(TokenType.HEX_COLOR, 'Expected color').value;
  }

  private parseIdentifier(): string {
    return this.consume(TokenType.IDENTIFIER, 'Expected identifier').value;
  }

  private parseStringOrIdentifier(): string {
    if (this.check(TokenType.STRING)) return this.parseString();
    return this.parseIdentifier();
  }

  private parseArray(): any[] {
    this.consume(TokenType.LBRACKET, 'Expected "["');
    const arr: any[] = [];

    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      arr.push(this.parseValue());
      if (!this.check(TokenType.RBRACKET) && this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.consume(TokenType.RBRACKET, 'Expected "]"');
    return arr;
  }

  private parseObject(): Record<string, any> {
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const obj: Record<string, any> = {};

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const key = this.parseStringOrIdentifier();
      this.consume(TokenType.COLON, 'Expected ":"');
      obj[key] = this.parseValue();

      if (!this.check(TokenType.RBRACE) && this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.consume(TokenType.RBRACE, 'Expected "}"');
    return obj;
  }

  private parseStringArray(): string[] {
    return this.parseArray() as string[];
  }

  private parseNumberArray(): number[] {
    return this.parseArray() as number[];
  }

  private parseColorArray(): string[] {
    return this.parseArray() as string[];
  }

  private skipValue() {
    let depth = 0;
    do {
      if (this.check(TokenType.LBRACE) || this.check(TokenType.LBRACKET)) {
        depth++;
      } else if (this.check(TokenType.RBRACE) || this.check(TokenType.RBRACKET)) {
        depth--;
      }
      this.advance();
    } while (depth > 0 && !this.isAtEnd());
  }

  // Token utilities
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): ParseError {
    const error = { message, token };
    this.errors.push(error);
    return error;
  }
}

export function parse(source: string): { ast: AST.DimensionAST | null; errors: ParseError[] } {
  const { tokens, errors: lexErrors } = tokenize(source);

  if (lexErrors.length > 0) {
    return {
      ast: null,
      errors: lexErrors.map(e => ({
        message: e.message,
        token: { type: TokenType.EOF, value: '', line: e.line, column: e.column },
      })),
    };
  }

  const parser = new Parser(tokens);
  return parser.parse();
}
