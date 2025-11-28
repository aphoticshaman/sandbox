/**
 * Guardian Input Validation
 *
 * Comprehensive input validation for ALL user inputs across VeilPath.
 * Protects against XSS, SQL injection, and other attack vectors.
 *
 * Usage:
 *   import { validateInput, sanitizeText, validateEmail } from './guardian/inputValidation';
 *
 *   const result = validateInput(userInput, 'text');
 *   if (!result.valid) {
 *     showError(result.message);
 *   }
 */

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKED PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * XSS attack patterns
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /data:/gi, // data: URIs
  /vbscript:/gi,
  /expression\s*\(/gi, // CSS expression()
  /<link[^>]*href/gi,
  /<style[^>]*>.*?<\/style>/gis,
];

/**
 * SQL injection patterns
 */
const SQL_PATTERNS = [
  /('|")\s*(OR|AND)\s*('|")/gi,
  /\bUNION\s+SELECT\b/gi,
  /\bSELECT\s+.*\s+FROM\b/gi,
  /\bINSERT\s+INTO\b/gi,
  /\bDELETE\s+FROM\b/gi,
  /\bDROP\s+(TABLE|DATABASE)\b/gi,
  /\b(UPDATE|ALTER)\s+\w+\s+SET\b/gi,
  /--[^\n]*$/gm, // SQL comments
  /;\s*(SELECT|INSERT|DELETE|DROP|UPDATE)/gi,
  /\bEXEC(UTE)?\s*\(/gi,
  /\bSLEEP\s*\(/gi,
  /\bBENCHMARK\s*\(/gi,
];

/**
 * Command injection patterns
 */
const CMD_PATTERNS = [
  /[|&;$`]/g, // Shell operators
  /\$\{.*\}/g, // Variable expansion
  /\$\(.*\)/g, // Command substitution
  /`.*`/g, // Backtick execution
  /\b(cat|ls|rm|mv|cp|wget|curl|bash|sh|python|perl|ruby|php)\b/gi,
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/, // Windows style
  /%2e%2e%2f/gi, // URL encoded
  /%252e%252e%252f/gi, // Double encoded
];

/**
 * Zero-width and invisible characters
 */
const INVISIBLE_CHARS = /[\u200b\u200c\u200d\ufeff\u2060\u180e\u00ad]/g;

/**
 * Excessive whitespace
 */
const EXCESSIVE_WHITESPACE = /[\t\n\r]+/g;
const MULTIPLE_SPACES = /\s{3,}/g;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type InputType =
  | 'text'          // General text input
  | 'username'      // Username (alphanumeric + underscore)
  | 'email'         // Email address
  | 'password'      // Password (no validation, just length)
  | 'search'        // Search query
  | 'message'       // Chat/message (allow more chars)
  | 'journalEntry'  // Journal entry (allow most chars, longer)
  | 'cardName'      // Card names (limited charset)
  | 'number'        // Numeric input
  | 'date'          // Date string
  | 'url';          // URL input

export interface ValidationConfig {
  minLength?: number;
  maxLength?: number;
  allowHtml?: boolean;
  allowEmoji?: boolean;
  allowNewlines?: boolean;
  customPattern?: RegExp;
  customValidator?: (input: string) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  message?: string;
  warnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIGS: Record<InputType, ValidationConfig> = {
  text: {
    minLength: 0,
    maxLength: 500,
    allowHtml: false,
    allowEmoji: true,
    allowNewlines: false,
  },
  username: {
    minLength: 3,
    maxLength: 30,
    allowHtml: false,
    allowEmoji: false,
    allowNewlines: false,
    customPattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    minLength: 5,
    maxLength: 254,
    allowHtml: false,
    allowEmoji: false,
    allowNewlines: false,
    customPattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    allowHtml: true, // Allow special chars in passwords
    allowEmoji: false,
    allowNewlines: false,
  },
  search: {
    minLength: 0,
    maxLength: 200,
    allowHtml: false,
    allowEmoji: true,
    allowNewlines: false,
  },
  message: {
    minLength: 0,
    maxLength: 2000,
    allowHtml: false,
    allowEmoji: true,
    allowNewlines: true,
  },
  journalEntry: {
    minLength: 0,
    maxLength: 10000,
    allowHtml: false,
    allowEmoji: true,
    allowNewlines: true,
  },
  cardName: {
    minLength: 1,
    maxLength: 100,
    allowHtml: false,
    allowEmoji: false,
    allowNewlines: false,
    customPattern: /^[a-zA-Z\s\-']+$/,
  },
  number: {
    minLength: 1,
    maxLength: 20,
    allowHtml: false,
    allowEmoji: false,
    allowNewlines: false,
    customPattern: /^-?\d*\.?\d+$/,
  },
  date: {
    minLength: 8,
    maxLength: 30,
    allowHtml: false,
    allowEmoji: false,
    allowNewlines: false,
    customPattern: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
  },
  url: {
    minLength: 10,
    maxLength: 2000,
    allowHtml: false,
    allowEmoji: false,
    allowNewlines: false,
    customPattern: /^https?:\/\/[^\s]+$/,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate and sanitize user input
 *
 * @param input - Raw user input
 * @param type - Type of input for appropriate validation rules
 * @param customConfig - Override default config
 * @returns Validation result with sanitized input
 */
export function validateInput(
  input: string | null | undefined,
  type: InputType = 'text',
  customConfig?: Partial<ValidationConfig>
): ValidationResult {
  // Handle null/undefined
  if (input === null || input === undefined) {
    return {
      valid: false,
      sanitized: '',
      message: 'Input is required',
    };
  }

  // Get config
  const config = { ...DEFAULT_CONFIGS[type], ...customConfig };
  const warnings: string[] = [];

  // Convert to string
  let sanitized = String(input);

  // 1. Remove invisible characters
  const invisibleRemoved = sanitized.replace(INVISIBLE_CHARS, '');
  if (invisibleRemoved !== sanitized) {
    warnings.push('Removed invisible characters');
    sanitized = invisibleRemoved;
  }

  // 2. Check for attack patterns
  const attackResult = detectAttackPatterns(sanitized);
  if (!attackResult.safe) {
    return {
      valid: false,
      sanitized: '',
      message: attackResult.message,
    };
  }

  // 3. Handle newlines
  if (!config.allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // 4. Normalize whitespace
  sanitized = sanitized
    .replace(EXCESSIVE_WHITESPACE, config.allowNewlines ? '\n' : ' ')
    .replace(MULTIPLE_SPACES, '  ')
    .trim();

  // 5. Strip HTML if not allowed
  if (!config.allowHtml) {
    const stripped = stripHtml(sanitized);
    if (stripped !== sanitized) {
      warnings.push('HTML tags were removed');
      sanitized = stripped;
    }
  }

  // 6. Remove emoji if not allowed
  if (!config.allowEmoji) {
    sanitized = sanitized.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
  }

  // 7. Length validation
  if (config.minLength && sanitized.length < config.minLength) {
    return {
      valid: false,
      sanitized,
      message: `Must be at least ${config.minLength} characters`,
    };
  }

  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.slice(0, config.maxLength);
    warnings.push(`Truncated to ${config.maxLength} characters`);
  }

  // 8. Custom pattern validation
  if (config.customPattern && !config.customPattern.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      message: getPatternErrorMessage(type),
    };
  }

  // 9. Custom validator
  if (config.customValidator && !config.customValidator(sanitized)) {
    return {
      valid: false,
      sanitized,
      message: 'Input does not meet requirements',
    };
  }

  return {
    valid: true,
    sanitized,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect attack patterns in input
 */
function detectAttackPatterns(input: string): { safe: boolean; message?: string } {
  // XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return { safe: false, message: 'Invalid characters detected' };
    }
  }

  // SQL Injection
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(input)) {
      return { safe: false, message: 'Invalid input format' };
    }
  }

  // Command Injection (skip for certain input types)
  for (const pattern of CMD_PATTERNS) {
    if (pattern.test(input)) {
      return { safe: false, message: 'Invalid characters detected' };
    }
  }

  // Path Traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      return { safe: false, message: 'Invalid path characters' };
    }
  }

  return { safe: true };
}

/**
 * Strip HTML tags from input
 */
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Get user-friendly error message for pattern validation
 */
function getPatternErrorMessage(type: InputType): string {
  switch (type) {
    case 'username':
      return 'Username can only contain letters, numbers, and underscores';
    case 'email':
      return 'Please enter a valid email address';
    case 'cardName':
      return 'Card name can only contain letters, spaces, hyphens, and apostrophes';
    case 'number':
      return 'Please enter a valid number';
    case 'date':
      return 'Please enter a valid date (YYYY-MM-DD)';
    case 'url':
      return 'Please enter a valid URL starting with http:// or https://';
    default:
      return 'Input format is invalid';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick sanitize for text (no validation, just cleaning)
 */
export function sanitizeText(input: string, maxLength = 500): string {
  const result = validateInput(input, 'text', { maxLength });
  return result.sanitized;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  return validateInput(email, 'email');
}

/**
 * Validate username
 */
export function validateUsername(username: string): ValidationResult {
  return validateInput(username, 'username');
}

/**
 * Validate search query
 */
export function validateSearch(query: string): ValidationResult {
  return validateInput(query, 'search');
}

/**
 * Validate journal entry
 */
export function validateJournalEntry(entry: string): ValidationResult {
  return validateInput(entry, 'journalEntry');
}

/**
 * Validate message/chat input
 */
export function validateMessage(message: string): ValidationResult {
  return validateInput(message, 'message');
}

/**
 * Check if input is safe (quick check)
 */
export function isSafe(input: string): boolean {
  const attackResult = detectAttackPatterns(input);
  return attackResult.safe;
}

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOK (for forms)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a validated change handler for React Native TextInput
 *
 * Usage:
 *   const [value, setValue] = useState('');
 *   const [error, setError] = useState('');
 *   const handleChange = createValidatedHandler('email', setValue, setError);
 *
 *   <TextInput value={value} onChangeText={handleChange} />
 *   {error && <Text style={styles.error}>{error}</Text>}
 */
export function createValidatedHandler(
  type: InputType,
  setValue: (value: string) => void,
  setError?: (error: string | null) => void,
  config?: Partial<ValidationConfig>
): (text: string) => void {
  return (text: string) => {
    const result = validateInput(text, type, config);

    // Always update value (sanitized)
    setValue(result.sanitized);

    // Update error if handler provided
    if (setError) {
      setError(result.valid ? null : (result.message || null));
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  validateInput,
  sanitizeText,
  validateEmail,
  validateUsername,
  validateSearch,
  validateJournalEntry,
  validateMessage,
  isSafe,
  createValidatedHandler,
};
