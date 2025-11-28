/**
 * LatticeScript Lexer
 * Tokenizes .lattice dimension definition files
 */

export enum TokenType {
  // Keywords
  DIMENSION = 'DIMENSION',
  NODE = 'NODE',
  EDGE = 'EDGE',
  RULES = 'RULES',
  META = 'META',
  VISUAL = 'VISUAL',
  FRACTAL = 'FRACTAL',
  FALLACY = 'FALLACY',
  ON = 'ON',
  IF = 'IF',
  ELSE = 'ELSE',

  // Identifiers & Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  HEX_COLOR = 'HEX_COLOR',
  BOOLEAN = 'BOOLEAN',

  // Operators & Delimiters
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COLON = 'COLON',
  COMMA = 'COMMA',
  ARROW = 'ARROW',
  DOT = 'DOT',
  EQUALS = 'EQUALS',

  // Special
  COMMENT = 'COMMENT',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface LexerError {
  message: string;
  line: number;
  column: number;
}

const KEYWORDS: Record<string, TokenType> = {
  dimension: TokenType.DIMENSION,
  node: TokenType.NODE,
  edge: TokenType.EDGE,
  rules: TokenType.RULES,
  meta: TokenType.META,
  visual: TokenType.VISUAL,
  fractal: TokenType.FRACTAL,
  fallacy: TokenType.FALLACY,
  on: TokenType.ON,
  if: TokenType.IF,
  else: TokenType.ELSE,
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];

  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): { tokens: Token[]; errors: LexerError[] } {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return { tokens: this.tokens, errors: this.errors };
  }

  private scanToken() {
    const c = this.advance();

    switch (c) {
      case '{':
        this.addToken(TokenType.LBRACE);
        break;
      case '}':
        this.addToken(TokenType.RBRACE);
        break;
      case '[':
        this.addToken(TokenType.LBRACKET);
        break;
      case ']':
        this.addToken(TokenType.RBRACKET);
        break;
      case '(':
        this.addToken(TokenType.LPAREN);
        break;
      case ')':
        this.addToken(TokenType.RPAREN);
        break;
      case ':':
        this.addToken(TokenType.COLON);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '=':
        this.addToken(TokenType.EQUALS);
        break;
      case '-':
        if (this.match('>')) {
          this.addToken(TokenType.ARROW);
        } else if (this.isDigit(this.peek())) {
          this.number();
        } else {
          this.error(`Unexpected character: ${c}`);
        }
        break;
      case '/':
        if (this.match('/')) {
          // Single-line comment
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
          // Don't add comment tokens (skip)
        } else if (this.match('*')) {
          // Multi-line comment
          this.multiLineComment();
        } else {
          this.error(`Unexpected character: ${c}`);
        }
        break;
      case '#':
        this.hexColor();
        break;
      case '"':
        this.string();
        break;
      case '\n':
        this.line++;
        this.column = 1;
        break;
      case ' ':
      case '\r':
      case '\t':
        // Whitespace - skip
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.error(`Unexpected character: ${c}`);
        }
    }
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = KEYWORDS[text.toLowerCase()] || TokenType.IDENTIFIER;
    this.addToken(type);
  }

  private number() {
    // Handle negative numbers
    if (this.source[this.start] === '-') {
      // Already consumed the '-'
    }

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Decimal
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(TokenType.NUMBER);
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      if (this.peek() === '\\' && this.peekNext() === '"') {
        this.advance(); // consume backslash
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.error('Unterminated string');
      return;
    }

    this.advance(); // closing "

    // Trim quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private hexColor() {
    // Already consumed '#'
    let count = 0;
    while (this.isHexDigit(this.peek()) && count < 8) {
      this.advance();
      count++;
    }

    if (count !== 3 && count !== 6 && count !== 8) {
      this.error(`Invalid hex color: expected 3, 6, or 8 digits, got ${count}`);
      return;
    }

    this.addToken(TokenType.HEX_COLOR);
  }

  private multiLineComment() {
    let depth = 1;
    while (depth > 0 && !this.isAtEnd()) {
      if (this.peek() === '/' && this.peekNext() === '*') {
        this.advance();
        this.advance();
        depth++;
      } else if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        depth--;
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
    }

    if (depth > 0) {
      this.error('Unterminated multi-line comment');
    }
  }

  // Helpers
  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    const c = this.source[this.current];
    this.current++;
    this.column++;
    return c;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isHexDigit(c: string): boolean {
    return this.isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
  }

  private addToken(type: TokenType, value?: string) {
    const text = value ?? this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      value: text,
      line: this.line,
      column: this.column - text.length,
    });
  }

  private error(message: string) {
    this.errors.push({
      message,
      line: this.line,
      column: this.column,
    });
  }
}

export function tokenize(source: string): { tokens: Token[]; errors: LexerError[] } {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
