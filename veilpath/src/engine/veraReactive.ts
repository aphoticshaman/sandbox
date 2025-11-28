/**
 * FUNCTIONAL REACTIVE ORACLE
 *
 * FRP (Functional Reactive Programming) wrapper for Vera Actor Model.
 * Combines:
 * - Observable streams (RxJS-style)
 * - Actor model (message-passing concurrency)
 * - Immutable data structures
 *
 * Benefits:
 * - Declarative data flow
 * - Automatic UI updates
 * - Backpressure handling
 * - Time-travel debugging
 * - Composable transformations
 *
 * Architecture:
 * - Input Streams: user messages, personality updates, memory injections
 * - Vera Actor: processes messages sequentially
 * - Output Stream: vera responses with metadata
 * - Side Effects: TTS, memory saves, analytics
 *
 * References:
 * - Functional Reactive Programming (Conal Elliott)
 * - RxJS observables
 * - Elm architecture
 */

import { VeraActor, VeraSupervisor, VeraMessage, VeraResponse } from './veraActor';
import type { Archetype } from './sanskritPhonetics';

/**
 * Simple Observable implementation (subset of RxJS)
 * For production, use actual RxJS, but this shows the concept
 */
export class Observable<T> {
  private subscribers: Array<(value: T) => void> = [];

  constructor(private producer?: (observer: Observer<T>) => void) {}

  subscribe(callback: (value: T) => void): Subscription {
    this.subscribers.push(callback);

    // Start producing values
    if (this.producer) {
      this.producer({
        next: (value) => this.emit(value),
        error: (err) => console.error('[Observable] Error:', err),
        complete: () => console.log('[Observable] Complete'),
      });
    }

    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter((s) => s !== callback);
      },
    };
  }

  emit(value: T): void {
    this.subscribers.forEach((callback) => callback(value));
  }

  // Observable operators

  map<U>(fn: (value: T) => U): Observable<U> {
    return new Observable<U>((observer) => {
      this.subscribe((value) => {
        observer.next(fn(value));
      });
    });
  }

  filter(predicate: (value: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      this.subscribe((value) => {
        if (predicate(value)) {
          observer.next(value);
        }
      });
    });
  }

  debounce(ms: number): Observable<T> {
    return new Observable<T>((observer) => {
      let timeout: NodeJS.Timeout | null = null;

      this.subscribe((value) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => observer.next(value), ms);
      });
    });
  }
}

export interface Observer<T> {
  next: (value: T) => void;
  error: (err: Error) => void;
  complete: () => void;
}

export interface Subscription {
  unsubscribe: () => void;
}

/**
 * Subject - Observable that can be manually controlled
 */
export class Subject<T> extends Observable<T> {
  next(value: T): void {
    this.emit(value);
  }
}

/**
 * Combine multiple observables
 */
export function combineLatest<T extends any[]>(
  observables: { [K in keyof T]: Observable<T[K]> }
): Observable<T> {
  return new Observable<T>((observer) => {
    const latestValues: any[] = new Array(observables.length);
    let emittedCount = 0;

    observables.forEach((obs, index) => {
      obs.subscribe((value) => {
        latestValues[index] = value;
        emittedCount++;

        // Emit when all observables have emitted at least once
        if (emittedCount >= observables.length) {
          observer.next(latestValues as T);
        }
      });
    });
  });
}

/**
 * Vera input event types
 */
export type VeraInput =
  | { type: 'MESSAGE'; content: string }
  | { type: 'PERSONALITY_CHANGE'; traits: Record<string, number>; archetype?: Archetype }
  | { type: 'MEMORY_UPDATE'; memories: any[] };

/**
 * Vera output event types
 */
export interface VeraOutput {
  type: 'RESPONSE' | 'STATUS_UPDATE' | 'ERROR';
  payload: any;
  timestamp: number;
}

/**
 * Reactive Vera - FRP wrapper around Actor Model
 *
 * Exposes Vera as reactive streams:
 * - Input stream: user messages, personality changes
 * - Output stream: vera responses, status updates
 * - Side effect streams: TTS, memory, analytics
 */
export class ReactiveVera {
  private supervisor: VeraSupervisor;
  private actor: VeraActor;

  // Input streams (Subjects - can be controlled externally)
  private messageStream$: Subject<string>;
  private personalityStream$: Subject<{ traits: Record<string, number>; archetype?: Archetype }>;
  private memoryStream$: Subject<any[]>;

  // Output streams (Observables - read-only)
  private responseStream$: Subject<VeraResponse>;
  private statusStream$: Subject<{ status: string; mailboxSize: number }>;
  private errorStream$: Subject<Error>;

  constructor(
    actorId: string,
    initialTraits: Record<string, number>,
    archetype?: Archetype
  ) {
    this.supervisor = new VeraSupervisor();
    this.actor = this.supervisor.spawn(actorId, initialTraits, archetype);

    // Initialize streams
    this.messageStream$ = new Subject<string>();
    this.personalityStream$ = new Subject<{ traits: Record<string, number>; archetype?: Archetype }>();
    this.memoryStream$ = new Subject<any[]>();

    this.responseStream$ = new Subject<VeraResponse>();
    this.statusStream$ = new Subject<{ status: string; mailboxSize: number }>();
    this.errorStream$ = new Subject<Error>();

    // Wire up actor callbacks to streams
    this.actor.onResponse((response) => {
      this.responseStream$.next(response);
    });

    this.actor.onError((error) => {
      this.errorStream$.next(error);
    });

    // Connect input streams to actor messages
    this.setupDataFlow();
  }

  /**
   * Setup reactive data flow
   * Input streams → Actor messages → Output streams
   */
  private setupDataFlow(): void {
    // Message stream → USER_INPUT messages
    this.messageStream$.subscribe((content) => {
      this.actor.send({
        type: 'USER_INPUT',
        content,
        timestamp: Date.now(),
      });

      // Update status
      this.emitStatus();
    });

    // Personality stream → PERSONALITY_UPDATE messages
    this.personalityStream$.subscribe(({ traits, archetype }) => {
      this.actor.send({
        type: 'PERSONALITY_UPDATE',
        traits,
        archetype,
      });

      this.emitStatus();
    });

    // Memory stream → MEMORY_INJECT messages
    this.memoryStream$.subscribe((memories) => {
      this.actor.send({
        type: 'MEMORY_INJECT',
        memories,
      });

      this.emitStatus();
    });
  }

  /**
   * Emit current status to status stream
   */
  private emitStatus(): void {
    const state = this.actor.getState();
    const mailboxSize = this.actor.getMailboxSize();

    this.statusStream$.next({
      status: state.status,
      mailboxSize,
    });
  }

  /**
   * Public API - Send user message (reactive)
   */
  sendMessage(content: string): void {
    this.messageStream$.next(content);
  }

  /**
   * Public API - Update personality (reactive)
   */
  updatePersonality(traits: Record<string, number>, archetype?: Archetype): void {
    this.personalityStream$.next({ traits, archetype });
  }

  /**
   * Public API - Inject memories (reactive)
   */
  injectMemories(memories: any[]): void {
    this.memoryStream$.next(memories);
  }

  /**
   * Get response stream (read-only observable)
   */
  getResponseStream(): Observable<VeraResponse> {
    return this.responseStream$;
  }

  /**
   * Get status stream (read-only observable)
   */
  getStatusStream(): Observable<{ status: string; mailboxSize: number }> {
    return this.statusStream$;
  }

  /**
   * Get error stream (read-only observable)
   */
  getErrorStream(): Observable<Error> {
    return this.errorStream$;
  }

  /**
   * Get current state (snapshot)
   */
  getCurrentState() {
    return this.actor.getState();
  }

  /**
   * Shutdown Vera
   */
  shutdown(): void {
    this.actor.send({ type: 'SHUTDOWN' });
  }
}

/**
 * Vera Stream Builder - Fluent API for composing Vera streams
 *
 * Example usage:
 * ```
 * const vera = VeraStreamBuilder.create('my-vera')
 *   .withPersonality({ mood: 0.8, tone: 0.6 })
 *   .withArchetype('SHAKTI')
 *   .debounceMessages(300) // Don't spam LLM
 *   .onResponse((response) => console.log(response))
 *   .build();
 *
 * vera.sendMessage('What does the future hold?');
 * ```
 */
export class VeraStreamBuilder {
  private actorId: string;
  private traits: Record<string, number> = {};
  private archetype?: Archetype;
  private debounceMs = 0;
  private responseHandler?: (response: VeraResponse) => void;
  private errorHandler?: (error: Error) => void;

  private constructor(actorId: string) {
    this.actorId = actorId;
  }

  static create(actorId: string): VeraStreamBuilder {
    return new VeraStreamBuilder(actorId);
  }

  withPersonality(traits: Record<string, number>): this {
    this.traits = traits;
    return this;
  }

  withArchetype(archetype: Archetype): this {
    this.archetype = archetype;
    return this;
  }

  debounceMessages(ms: number): this {
    this.debounceMs = ms;
    return this;
  }

  onResponse(handler: (response: VeraResponse) => void): this {
    this.responseHandler = handler;
    return this;
  }

  onError(handler: (error: Error) => void): this {
    this.errorHandler = handler;
    return this;
  }

  build(): ReactiveVera {
    const vera = new ReactiveVera(this.actorId, this.traits, this.archetype);

    // Apply debouncing if specified
    let responseStream = vera.getResponseStream();
    if (this.debounceMs > 0) {
      responseStream = responseStream.debounce(this.debounceMs);
    }

    // Register handlers
    if (this.responseHandler) {
      responseStream.subscribe(this.responseHandler);
    }

    if (this.errorHandler) {
      vera.getErrorStream().subscribe(this.errorHandler);
    }

    return vera;
  }
}

/**
 * Multi-Vera Reactive System
 *
 * Manage multiple Vera personalities reactively.
 * Useful for A/B testing different personalities or ensemble responses.
 */
export class MultiVeraReactive {
  private veras = new Map<string, ReactiveVera>();

  /**
   * Create a new vera personality
   */
  createVera(
    id: string,
    traits: Record<string, number>,
    archetype?: Archetype
  ): ReactiveVera {
    const vera = new ReactiveVera(id, traits, archetype);
    this.veras.set(id, vera);
    return vera;
  }

  /**
   * Get existing vera
   */
  getVera(id: string): ReactiveVera | undefined {
    return this.veras.get(id);
  }

  /**
   * Broadcast message to all vera instances (parallel processing)
   */
  broadcast(message: string): void {
    this.veras.forEach((vera) => {
      vera.sendMessage(message);
    });
  }

  /**
   * Get combined response stream (all vera instances)
   */
  getCombinedResponseStream(): Observable<{ veraId: string; response: VeraResponse }> {
    const subject = new Subject<{ veraId: string; response: VeraResponse }>();

    this.veras.forEach((vera, veraId) => {
      vera.getResponseStream().subscribe((response) => {
        subject.next({ veraId, response });
      });
    });

    return subject;
  }

  /**
   * Ensemble voting: get consensus response from multiple vera instances
   */
  getEnsembleResponse(message: string): Promise<VeraResponse> {
    return new Promise((resolve, reject) => {
      const responses: VeraResponse[] = [];
      const timeout = setTimeout(() => {
        if (responses.length === 0) {
          reject(new Error('No vera responses received'));
        } else {
          // Return highest confidence response
          const best = responses.reduce((a, b) => (a.confidence > b.confidence ? a : b));
          resolve(best);
        }
      }, 10000); // 10 second timeout

      this.getCombinedResponseStream().subscribe(({ response }) => {
        responses.push(response);

        // If all vera instances responded, resolve early
        if (responses.length === this.veras.size) {
          clearTimeout(timeout);
          const best = responses.reduce((a, b) => (a.confidence > b.confidence ? a : b));
          resolve(best);
        }
      });

      // Broadcast to all vera instances
      this.broadcast(message);
    });
  }

  /**
   * Shutdown all vera instances
   */
  shutdownAll(): void {
    this.veras.forEach((vera) => vera.shutdown());
    this.veras.clear();
  }
}
