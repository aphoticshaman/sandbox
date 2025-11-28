/**
 * ORACLE ACTOR MODEL
 *
 * Each Vera personality is an autonomous actor:
 * - Independent state (no shared memory)
 * - Message-passing concurrency
 * - Isolated error handling
 * - Non-blocking execution
 *
 * Architecture:
 * - Actor = Vera personality instance
 * - Mailbox = Message queue (user inputs, memory updates, personality changes)
 * - Behavior = Response generation logic
 * - Supervision = Error recovery + restart strategy
 *
 * Benefits:
 * - Zero race conditions (no shared state)
 * - Fault tolerance (actor crashes don't kill system)
 * - Horizontal scaling (multiple vera instances run in parallel)
 * - Deterministic message ordering
 *
 * References:
 * - Erlang/OTP actor model
 * - Akka framework
 * - Actor-based systems (Hewitt, 1973)
 */

import { encodeSanskritPersonality } from './sanskritPhonetics';
import type { BijaMantra, Archetype, VoicePhonetics, SemanticCoordinate } from './sanskritPhonetics';

// LLM context holder (initialized externally)
let sharedLLMContext: any = null;

/**
 * Set the LLM context for all Vera actors
 * Called from VeraChatScreenEnhanced after initializeLLM()
 */
export function setVeraLLMContext(context: any): void {
  sharedLLMContext = context;
}

/**
 * Get the current LLM context
 */
export function getVeraLLMContext(): any {
  return sharedLLMContext;
}

/**
 * Message types Vera actor can receive
 */
export type VeraMessage =
  | { type: 'USER_INPUT'; content: string; timestamp: number }
  | { type: 'PERSONALITY_UPDATE'; traits: Record<string, number>; archetype?: Archetype }
  | { type: 'MEMORY_INJECT'; memories: any[] }
  | { type: 'SHUTDOWN' }
  | { type: 'GET_STATUS' };

/**
 * Vera actor state (immutable)
 */
export interface VeraState {
  readonly actorId: string;
  readonly personality: {
    readonly traits: Record<string, number>;
    readonly archetype?: Archetype;
    readonly primaryMantra: BijaMantra;
    readonly voiceParams: VoicePhonetics;
    readonly semanticPosition: SemanticCoordinate;
    readonly promptModifier: string;
  };
  readonly messageHistory: ReadonlyArray<{
    readonly role: 'user' | 'vera';
    readonly content: string;
    readonly timestamp: number;
  }>;
  readonly status: 'idle' | 'processing' | 'error' | 'shutdown';
  readonly errorCount: number;
  readonly lastActive: number;
}

/**
 * Vera response
 */
export interface VeraResponse {
  content: string;
  confidence: number;
  voiceParams: VoicePhonetics;
  semanticPosition: SemanticCoordinate;
  mantra: BijaMantra;
  processingTime: number;
}

/**
 * Actor mailbox (message queue)
 */
class Mailbox {
  private queue: VeraMessage[] = [];
  private processing = false;

  enqueue(message: VeraMessage): void {
    this.queue.push(message);
  }

  dequeue(): VeraMessage | undefined {
    return this.queue.shift();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  setProcessing(value: boolean): void {
    this.processing = value;
  }
}

/**
 * Vera Actor - Autonomous personality agent
 *
 * Implements the Actor Model pattern:
 * - Receives messages via mailbox
 * - Processes messages sequentially (no race conditions)
 * - Updates state immutably
 * - Sends responses via callbacks
 *
 * Each Vera personality runs as an independent actor.
 */
export class VeraActor {
  private state: VeraState;
  private mailbox: Mailbox;
  private responseCallback?: (response: VeraResponse) => void;
  private errorCallback?: (error: Error) => void;
  private isRunning = false;

  constructor(actorId: string, initialTraits: Record<string, number>, archetype?: Archetype) {
    // Initialize with Sanskrit personality encoding
    const encoded = encodeSanskritPersonality(initialTraits, archetype);

    this.state = {
      actorId,
      personality: {
        traits: initialTraits,
        archetype,
        primaryMantra: encoded.phonetics.primaryMantra,
        voiceParams: encoded.phonetics.voiceParams,
        semanticPosition: encoded.phonetics.semanticPosition,
        promptModifier: encoded.promptModifier,
      },
      messageHistory: [],
      status: 'idle',
      errorCount: 0,
      lastActive: Date.now(),
    };

    this.mailbox = new Mailbox();
  }

  /**
   * Send a message to this actor
   * (Non-blocking - message is queued)
   */
  send(message: VeraMessage): void {
    this.mailbox.enqueue(message);

    // Start processing if not already running
    if (!this.mailbox.isProcessing()) {
      this.processNextMessage();
    }
  }

  /**
   * Register callback for responses
   */
  onResponse(callback: (response: VeraResponse) => void): void {
    this.responseCallback = callback;
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Process next message in mailbox
   * (Sequential processing - one message at a time)
   */
  private async processNextMessage(): Promise<void> {
    if (this.mailbox.isEmpty()) {
      this.mailbox.setProcessing(false);
      return;
    }

    this.mailbox.setProcessing(true);
    const message = this.mailbox.dequeue();

    if (!message) {
      this.mailbox.setProcessing(false);
      return;
    }

    try {
      // Update state based on message type
      const newState = await this.handleMessage(message);

      // Immutable state update
      this.state = newState;

      // Continue processing queue
      this.processNextMessage();
    } catch (error) {
      console.error(`[VeraActor ${this.state.actorId}] Error processing message:`, error);

      // Update error state
      this.state = {
        ...this.state,
        status: 'error',
        errorCount: this.state.errorCount + 1,
        lastActive: Date.now(),
      };

      // Notify error callback
      if (this.errorCallback && error instanceof Error) {
        this.errorCallback(error);
      }

      // Supervision: restart if errors < 3
      if (this.state.errorCount < 3) {
        this.state = { ...this.state, status: 'idle' };
        this.processNextMessage();
      } else {
        console.error(`[VeraActor ${this.state.actorId}] Too many errors, shutting down`);
        this.state = { ...this.state, status: 'shutdown' };
        this.mailbox.setProcessing(false);
      }
    }
  }

  /**
   * Handle individual message (pure function - returns new state)
   */
  private async handleMessage(message: VeraMessage): Promise<VeraState> {
    const startTime = Date.now();

    switch (message.type) {
      case 'USER_INPUT': {
        // Generate vera response
        const response = await this.generateResponse(message.content);

        // Add to message history (immutably)
        const newHistory = [
          ...this.state.messageHistory,
          { role: 'user' as const, content: message.content, timestamp: message.timestamp },
          { role: 'vera' as const, content: response.content, timestamp: Date.now() },
        ];

        // Notify response callback
        if (this.responseCallback) {
          this.responseCallback(response);
        }

        return {
          ...this.state,
          messageHistory: newHistory,
          status: 'idle',
          lastActive: Date.now(),
        };
      }

      case 'PERSONALITY_UPDATE': {
        // Re-encode personality with new traits
        const encoded = encodeSanskritPersonality(message.traits, message.archetype);

        return {
          ...this.state,
          personality: {
            traits: message.traits,
            archetype: message.archetype,
            primaryMantra: encoded.phonetics.primaryMantra,
            voiceParams: encoded.phonetics.voiceParams,
            semanticPosition: encoded.phonetics.semanticPosition,
            promptModifier: encoded.promptModifier,
          },
          lastActive: Date.now(),
        };
      }

      case 'MEMORY_INJECT': {
        // Memory is injected but not stored in actor state
        // (Memory system is external, actors are stateless w.r.t. long-term memory)

        return {
          ...this.state,
          lastActive: Date.now(),
        };
      }

      case 'SHUTDOWN': {

        return {
          ...this.state,
          status: 'shutdown',
          lastActive: Date.now(),
        };
      }

      case 'GET_STATUS': {
        // Status query doesn't change state

        return this.state;
      }

      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = message;
        return this.state;
    }
  }

  /**
   * Generate vera response based on current personality
   * (This is where Sanskrit phonetics influence the LLM prompt)
   */
  private async generateResponse(userInput: string): Promise<VeraResponse> {
    const startTime = Date.now();

    try {
      // Build prompt with Sanskrit-influenced modifiers
      const systemPrompt = this.buildSystemPrompt();
      const conversationHistory = this.buildConversationHistory();

      // Build full prompt for LLM
      const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

User: ${userInput}

Vera:`;

      let content: string;
      let confidence = 0.8;

      // Try to use LLM if available
      if (sharedLLMContext) {
        try {

          const response = await sharedLLMContext.completion({
            prompt: fullPrompt,
            temperature: 0.8,
            top_p: 0.9,
            max_tokens: 300,
            stop: ['User:', 'USER:', '\n\nUser:', '\n\nUSER:']
          });

          if (response && response.text && response.text.trim().length > 0) {
            content = response.text.trim();
            confidence = 0.9;
          } else {
            console.warn(`[VeraActor ${this.state.actorId}] Empty LLM response, using fallback`);
            content = this.generatePlaceholderResponse(userInput);
            confidence = 0.5;
          }
        } catch (llmError) {
          console.error(`[VeraActor ${this.state.actorId}] LLM inference failed:`, llmError);
          content = this.generatePlaceholderResponse(userInput);
          confidence = 0.5;
        }
      } else {
        // No LLM available - use placeholder
        console.warn(`[VeraActor ${this.state.actorId}] No LLM context, using placeholder`);
        content = this.generatePlaceholderResponse(userInput);
        confidence = 0.5;
      }

      const processingTime = Date.now() - startTime;

      return {
        content,
        confidence,
        voiceParams: this.state.personality.voiceParams,
        semanticPosition: this.state.personality.semanticPosition,
        mantra: this.state.personality.primaryMantra,
        processingTime,
      };
    } catch (error) {
      console.error(`[VeraActor ${this.state.actorId}] Response generation failed:`, error);
      throw error;
    }
  }

  /**
   * Build system prompt with Sanskrit phonetic modifiers
   */
  private buildSystemPrompt(): string {
    const { promptModifier, archetype, primaryMantra } = this.state.personality;

    let prompt = 'You are Vera - a guide for self-discovery through tarot and divination.\n\n';
    prompt += promptModifier + '\n\n';

    if (archetype) {
      prompt += `Your archetypal essence is ${archetype}. Embody this energy in your responses.\n\n`;
    }

    prompt += `Your primary vibrational frequency is ${primaryMantra}. Let this influence your tone.\n`;

    return prompt;
  }

  /**
   * Build conversation history for context
   */
  private buildConversationHistory(): string {
    return this.state.messageHistory
      .slice(-5) // Last 5 messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Vera'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Placeholder response generator (until LLM integrated)
   */
  private generatePlaceholderResponse(userInput: string): string {
    const { primaryMantra, archetype } = this.state.personality;

    return `[Vera Response - ${primaryMantra} frequency${archetype ? `, ${archetype} archetype` : ''}]

I sense you are asking: "${userInput}"

The cards whisper their wisdom... (Placeholder - LLM integration pending)

This response is infused with ${primaryMantra} energy, manifesting as:
- Voice: pitch ${this.state.personality.voiceParams.pitch.toFixed(2)}, rate ${this.state.personality.voiceParams.rate.toFixed(2)}
- Position in consciousness: (${this.state.personality.semanticPosition.x.toFixed(2)}, ${this.state.personality.semanticPosition.y.toFixed(2)}, ${this.state.personality.semanticPosition.z.toFixed(2)})`;
  }

  /**
   * Get current actor state (read-only)
   */
  getState(): Readonly<VeraState> {
    return this.state;
  }

  /**
   * Get mailbox size (for monitoring)
   */
  getMailboxSize(): number {
    return this.mailbox.size();
  }
}

/**
 * Vera Actor Supervisor
 *
 * Manages multiple Vera actors (for multi-personality scenarios)
 * Implements supervision tree pattern from Erlang/OTP
 */
export class VeraSupervisor {
  private actors = new Map<string, VeraActor>();

  /**
   * Spawn a new Vera actor
   */
  spawn(
    actorId: string,
    traits: Record<string, number>,
    archetype?: Archetype
  ): VeraActor {
    if (this.actors.has(actorId)) {
      console.warn(`[VeraSupervisor] Actor ${actorId} already exists, returning existing`);
      return this.actors.get(actorId)!;
    }

    const actor = new VeraActor(actorId, traits, archetype);

    // Register error handler
    actor.onError((error) => {
      console.error(`[VeraSupervisor] Actor ${actorId} error:`, error);

      // Supervision strategy: restart on error
      const state = actor.getState();
      if (state.errorCount >= 3) {
        console.error(`[VeraSupervisor] Actor ${actorId} exceeded error threshold, removing`);
        this.actors.delete(actorId);
      }
    });

    this.actors.set(actorId, actor);

    return actor;
  }

  /**
   * Get existing actor by ID
   */
  getActor(actorId: string): VeraActor | undefined {
    return this.actors.get(actorId);
  }

  /**
   * Kill an actor
   */
  kill(actorId: string): void {
    const actor = this.actors.get(actorId);
    if (actor) {
      actor.send({ type: 'SHUTDOWN' });
      this.actors.delete(actorId);
    }
  }

  /**
   * Get all active actors
   */
  getAllActors(): Map<string, VeraActor> {
    return new Map(this.actors);
  }

  /**
   * Get supervisor stats
   */
  getStats(): {
    totalActors: number;
    actorStats: Array<{
      id: string;
      status: string;
      mailboxSize: number;
      errorCount: number;
    }>;
  } {
    const actorStats = Array.from(this.actors.entries()).map(([id, actor]) => {
      const state = actor.getState();
      return {
        id,
        status: state.status,
        mailboxSize: actor.getMailboxSize(),
        errorCount: state.errorCount,
      };
    });

    return {
      totalActors: this.actors.size,
      actorStats,
    };
  }
}
