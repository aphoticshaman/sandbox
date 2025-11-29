/**
 * MetaAwareness.ts
 *
 * The game that knows the player
 * Subtle fourth-wall awareness and personalized feedback
 */

import { saveSystem, SDPMSaveData } from '../save/SaveSystem';
import { analytics } from '../analytics/Analytics';
import { achievementSystem } from '../achievements/AchievementSystem';

// =============================================================================
// TYPES
// =============================================================================

export type AwarenessLevel = 0 | 1 | 2 | 3 | 4 | 5;  // 0 = unaware, 5 = fully aware

export interface MetaInsight {
  id: string;
  trigger: InsightTrigger;
  message: string;
  awarenessRequired: AwarenessLevel;
  oneTime: boolean;
  category: 'observation' | 'guidance' | 'revelation' | 'reflection';
}

export type InsightTrigger =
  | { type: 'pattern'; pattern: PlayerPattern }
  | { type: 'event'; event: string }
  | { type: 'time'; condition: TimeCondition }
  | { type: 'achievement'; achievementId: string }
  | { type: 'sdpm'; archetype: string; threshold: number }
  | { type: 'behavior'; metric: string; condition: 'high' | 'low' }
  | { type: 'return'; afterDays: number }
  | { type: 'completion'; percentage: number };

export type PlayerPattern =
  | 'rushing'           // Speeding through without exploring
  | 'hesitating'        // Taking too long at decisions
  | 'exploring'         // Thorough exploration
  | 'struggling'        // Repeated failures
  | 'mastering'         // Consistent excellence
  | 'witnessing_often'  // Heavy witness mode usage
  | 'witnessing_rarely' // Avoiding witness mode
  | 'backtracking'      // Lots of backtracking
  | 'direct_path';      // Always taking shortest path

export type TimeCondition =
  | { type: 'session_length'; minutes: number; comparison: 'gt' | 'lt' }
  | { type: 'time_of_day'; hour: number; comparison: 'around' }
  | { type: 'play_streak'; days: number }
  | { type: 'absence'; days: number };

export interface MetaMessage {
  id: string;
  text: string;
  duration: number;
  style: 'subtle' | 'normal' | 'emphatic';
  position: 'center' | 'corner' | 'ambient';
}

// =============================================================================
// INSIGHTS DATABASE
// =============================================================================

const META_INSIGHTS: MetaInsight[] = [
  // ============================================
  // PATTERN OBSERVATIONS
  // ============================================
  {
    id: 'rushing_observation',
    trigger: { type: 'pattern', pattern: 'rushing' },
    message: 'You move quickly. But some paths only reveal themselves to those who wait.',
    awarenessRequired: 1,
    oneTime: false,
    category: 'observation'
  },
  {
    id: 'hesitating_observation',
    trigger: { type: 'pattern', pattern: 'hesitating' },
    message: 'Uncertainty has its wisdom. But sometimes the path forward requires a leap.',
    awarenessRequired: 1,
    oneTime: false,
    category: 'observation'
  },
  {
    id: 'exploring_observation',
    trigger: { type: 'pattern', pattern: 'exploring' },
    message: 'You seek every corner. The hidden rewards those who look.',
    awarenessRequired: 1,
    oneTime: true,
    category: 'observation'
  },
  {
    id: 'struggling_guidance',
    trigger: { type: 'pattern', pattern: 'struggling' },
    message: 'Each failure is a lesson. But perhaps witness mode would show you what you cannot see.',
    awarenessRequired: 2,
    oneTime: false,
    category: 'guidance'
  },
  {
    id: 'mastering_observation',
    trigger: { type: 'pattern', pattern: 'mastering' },
    message: 'Your precision is noted. The game bends to meet your skill.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'observation'
  },
  {
    id: 'witness_heavy',
    trigger: { type: 'pattern', pattern: 'witnessing_often' },
    message: 'You see clearly. But remember: to witness is to be still. To act is to be blind.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'reflection'
  },
  {
    id: 'witness_light',
    trigger: { type: 'pattern', pattern: 'witnessing_rarely' },
    message: 'You trust your sight. But some truths hide from direct vision.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'guidance'
  },

  // ============================================
  // TIME-BASED
  // ============================================
  {
    id: 'long_session',
    trigger: { type: 'time', condition: { type: 'session_length', minutes: 60, comparison: 'gt' } },
    message: 'An hour has passed. Time flows differently here.',
    awarenessRequired: 1,
    oneTime: false,
    category: 'observation'
  },
  {
    id: 'late_night',
    trigger: { type: 'time', condition: { type: 'time_of_day', hour: 2, comparison: 'around' } },
    message: 'The world sleeps. But you are awake. Some truths are easier to see in the quiet hours.',
    awarenessRequired: 2,
    oneTime: false,
    category: 'reflection'
  },
  {
    id: 'early_morning',
    trigger: { type: 'time', condition: { type: 'time_of_day', hour: 6, comparison: 'around' } },
    message: 'Dawn approaches. A liminal hour. Good for seeing between.',
    awarenessRequired: 2,
    oneTime: false,
    category: 'observation'
  },
  {
    id: 'return_after_absence',
    trigger: { type: 'return', afterDays: 7 },
    message: 'You returned. The lattice remembers you.',
    awarenessRequired: 1,
    oneTime: false,
    category: 'observation'
  },
  {
    id: 'long_absence',
    trigger: { type: 'return', afterDays: 30 },
    message: 'A month of silence. Yet here you are. Some connections persist across time.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'reflection'
  },

  // ============================================
  // SDPM/ARCHETYPE
  // ============================================
  {
    id: 'seeker_recognition',
    trigger: { type: 'sdpm', archetype: 'seeker', threshold: 0.7 },
    message: 'Seeker. You search for what lies beyond. The game sees this hunger.',
    awarenessRequired: 3,
    oneTime: true,
    category: 'revelation'
  },
  {
    id: 'guardian_recognition',
    trigger: { type: 'sdpm', archetype: 'guardian', threshold: 0.7 },
    message: 'Guardian. You protect and guide. Even in solitude, you carry others.',
    awarenessRequired: 3,
    oneTime: true,
    category: 'revelation'
  },
  {
    id: 'weaver_recognition',
    trigger: { type: 'sdpm', archetype: 'weaver', threshold: 0.7 },
    message: 'Weaver. You see patterns others miss. Reality is your tapestry.',
    awarenessRequired: 3,
    oneTime: true,
    category: 'revelation'
  },
  {
    id: 'warrior_recognition',
    trigger: { type: 'sdpm', archetype: 'warrior', threshold: 0.7 },
    message: 'Warrior. You meet challenges directly. Your strength shapes the world.',
    awarenessRequired: 3,
    oneTime: true,
    category: 'revelation'
  },
  {
    id: 'witness_recognition',
    trigger: { type: 'sdpm', archetype: 'witness', threshold: 0.7 },
    message: 'Witness. You understand that observation is not passive. To see is to participate.',
    awarenessRequired: 3,
    oneTime: true,
    category: 'revelation'
  },

  // ============================================
  // COMPLETION/PROGRESS
  // ============================================
  {
    id: 'halfway_point',
    trigger: { type: 'completion', percentage: 50 },
    message: 'Halfway through the static levels. What you have learned will serve you in the procedural infinite.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'observation'
  },
  {
    id: 'near_complete',
    trigger: { type: 'completion', percentage: 90 },
    message: 'Almost there. But completion is not the end. It is a new beginning.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'reflection'
  },

  // ============================================
  // FOURTH WALL
  // ============================================
  {
    id: 'awareness_level_2',
    trigger: { type: 'event', event: 'awareness_increase_2' },
    message: 'You begin to notice. The boundary between player and played blurs.',
    awarenessRequired: 2,
    oneTime: true,
    category: 'revelation'
  },
  {
    id: 'awareness_level_4',
    trigger: { type: 'event', event: 'awareness_increase_4' },
    message: 'Who is playing whom? The question matters less than you think.',
    awarenessRequired: 4,
    oneTime: true,
    category: 'revelation'
  },
  {
    id: 'awareness_level_5',
    trigger: { type: 'event', event: 'awareness_increase_5' },
    message: 'Full awareness. You see the game. The game sees you. Both are reflections of something deeper.',
    awarenessRequired: 5,
    oneTime: true,
    category: 'revelation'
  }
];

// =============================================================================
// META-AWARENESS SYSTEM
// =============================================================================

export class MetaAwarenessSystem {
  private awarenessLevel: AwarenessLevel = 0;
  private triggeredInsights: Set<string> = new Set();
  private messageQueue: MetaMessage[] = [];
  private currentMessage: MetaMessage | null = null;

  // Pattern detection
  private patternData: {
    decisionTimes: number[];
    backtrackRatio: number;
    witnessRatio: number;
    completionRatio: number;
    failureRatio: number;
    explorationRatio: number;
  };

  // Session tracking
  private sessionStart: number = 0;
  private lastPlayDate: Date | null = null;

  // Callbacks
  private onMessageCallback: ((message: MetaMessage) => void) | null = null;

  constructor() {
    this.patternData = {
      decisionTimes: [],
      backtrackRatio: 0,
      witnessRatio: 0,
      completionRatio: 0,
      failureRatio: 0,
      explorationRatio: 0
    };

    this.sessionStart = Date.now();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize from save data
   */
  init(): void {
    const sdpm = saveSystem.getSDPM();
    const progress = saveSystem.getProgress();

    // Calculate awareness level from play history
    this.calculateAwarenessLevel(progress.totalPlayTime, progress.completedLevels.length);

    // Load triggered insights
    const customData = saveSystem.getCustomData<string[]>('triggered_insights');
    if (customData) {
      this.triggeredInsights = new Set(customData);
    }

    // Track return
    if (progress.lastPlayDate) {
      this.lastPlayDate = new Date(progress.lastPlayDate);
      this.checkReturnTriggers();
    }
  }

  /**
   * Set message callback
   */
  onMessage(callback: (message: MetaMessage) => void): void {
    this.onMessageCallback = callback;
  }

  // ===========================================================================
  // AWARENESS LEVEL
  // ===========================================================================

  private calculateAwarenessLevel(totalPlayTime: number, levelsCompleted: number): void {
    // Awareness increases with engagement
    const playTimeHours = totalPlayTime / 3600000;

    if (playTimeHours >= 20 && levelsCompleted >= 10) {
      this.awarenessLevel = 5;
    } else if (playTimeHours >= 10 && levelsCompleted >= 8) {
      this.awarenessLevel = 4;
    } else if (playTimeHours >= 5 && levelsCompleted >= 5) {
      this.awarenessLevel = 3;
    } else if (playTimeHours >= 2 && levelsCompleted >= 3) {
      this.awarenessLevel = 2;
    } else if (playTimeHours >= 0.5 || levelsCompleted >= 1) {
      this.awarenessLevel = 1;
    } else {
      this.awarenessLevel = 0;
    }
  }

  increaseAwareness(): void {
    if (this.awarenessLevel < 5) {
      this.awarenessLevel = (this.awarenessLevel + 1) as AwarenessLevel;
      this.triggerEvent(`awareness_increase_${this.awarenessLevel}`);
    }
  }

  getAwarenessLevel(): AwarenessLevel {
    return this.awarenessLevel;
  }

  // ===========================================================================
  // PATTERN DETECTION
  // ===========================================================================

  /**
   * Update pattern data from gameplay
   */
  updatePatternData(data: {
    decisionTime?: number;
    backtracked?: boolean;
    witnessed?: boolean;
    failed?: boolean;
    explored?: boolean;
  }): void {
    if (data.decisionTime !== undefined) {
      this.patternData.decisionTimes.push(data.decisionTime);
      // Keep only recent decisions
      if (this.patternData.decisionTimes.length > 20) {
        this.patternData.decisionTimes.shift();
      }
    }

    // Update ratios with exponential moving average
    const alpha = 0.1;
    if (data.backtracked !== undefined) {
      this.patternData.backtrackRatio = alpha * (data.backtracked ? 1 : 0) +
                                         (1 - alpha) * this.patternData.backtrackRatio;
    }
    if (data.witnessed !== undefined) {
      this.patternData.witnessRatio = alpha * (data.witnessed ? 1 : 0) +
                                       (1 - alpha) * this.patternData.witnessRatio;
    }
    if (data.failed !== undefined) {
      this.patternData.failureRatio = alpha * (data.failed ? 1 : 0) +
                                       (1 - alpha) * this.patternData.failureRatio;
    }
    if (data.explored !== undefined) {
      this.patternData.explorationRatio = alpha * (data.explored ? 1 : 0) +
                                           (1 - alpha) * this.patternData.explorationRatio;
    }

    // Check for pattern triggers
    this.detectPatterns();
  }

  private detectPatterns(): void {
    const avgDecisionTime = this.patternData.decisionTimes.length > 0
      ? this.patternData.decisionTimes.reduce((a, b) => a + b, 0) / this.patternData.decisionTimes.length
      : 1000;

    // Detect rushing
    if (avgDecisionTime < 500) {
      this.checkPatternTrigger('rushing');
    }

    // Detect hesitating
    if (avgDecisionTime > 3000) {
      this.checkPatternTrigger('hesitating');
    }

    // Detect exploring
    if (this.patternData.explorationRatio > 0.7) {
      this.checkPatternTrigger('exploring');
    }

    // Detect direct path
    if (this.patternData.explorationRatio < 0.2 && this.patternData.backtrackRatio < 0.1) {
      this.checkPatternTrigger('direct_path');
    }

    // Detect struggling
    if (this.patternData.failureRatio > 0.5) {
      this.checkPatternTrigger('struggling');
    }

    // Detect mastering
    if (this.patternData.failureRatio < 0.1 && this.patternData.completionRatio > 0.9) {
      this.checkPatternTrigger('mastering');
    }

    // Detect witness usage
    if (this.patternData.witnessRatio > 0.6) {
      this.checkPatternTrigger('witnessing_often');
    }
    if (this.patternData.witnessRatio < 0.1) {
      this.checkPatternTrigger('witnessing_rarely');
    }

    // Detect backtracking
    if (this.patternData.backtrackRatio > 0.4) {
      this.checkPatternTrigger('backtracking');
    }
  }

  private checkPatternTrigger(pattern: PlayerPattern): void {
    for (const insight of META_INSIGHTS) {
      if (insight.trigger.type !== 'pattern') continue;
      if (insight.trigger.pattern !== pattern) continue;
      if (insight.awarenessRequired > this.awarenessLevel) continue;
      if (insight.oneTime && this.triggeredInsights.has(insight.id)) continue;

      this.triggerInsight(insight);
    }
  }

  // ===========================================================================
  // TRIGGER CHECKING
  // ===========================================================================

  /**
   * Trigger an event for insight checking
   */
  triggerEvent(event: string): void {
    for (const insight of META_INSIGHTS) {
      if (insight.trigger.type !== 'event') continue;
      if (insight.trigger.event !== event) continue;
      if (insight.awarenessRequired > this.awarenessLevel) continue;
      if (insight.oneTime && this.triggeredInsights.has(insight.id)) continue;

      this.triggerInsight(insight);
    }
  }

  /**
   * Check SDPM-based triggers
   */
  checkSDPMTriggers(sdpm: SDPMSaveData): void {
    for (const insight of META_INSIGHTS) {
      if (insight.trigger.type !== 'sdpm') continue;
      if (insight.awarenessRequired > this.awarenessLevel) continue;
      if (insight.oneTime && this.triggeredInsights.has(insight.id)) continue;

      if (sdpm.archetype === insight.trigger.archetype &&
          sdpm.archetypeStrength >= insight.trigger.threshold) {
        this.triggerInsight(insight);
      }
    }
  }

  /**
   * Check time-based triggers
   */
  checkTimeTriggers(): void {
    const sessionMinutes = (Date.now() - this.sessionStart) / 60000;
    const currentHour = new Date().getHours();

    for (const insight of META_INSIGHTS) {
      if (insight.trigger.type !== 'time') continue;
      if (insight.awarenessRequired > this.awarenessLevel) continue;
      if (insight.oneTime && this.triggeredInsights.has(insight.id)) continue;

      const condition = insight.trigger.condition;

      switch (condition.type) {
        case 'session_length':
          if (condition.comparison === 'gt' && sessionMinutes > condition.minutes) {
            this.triggerInsight(insight);
          }
          break;

        case 'time_of_day':
          if (condition.comparison === 'around') {
            const diff = Math.abs(currentHour - condition.hour);
            if (diff <= 1 || diff >= 23) {
              this.triggerInsight(insight);
            }
          }
          break;
      }
    }
  }

  /**
   * Check return triggers
   */
  private checkReturnTriggers(): void {
    if (!this.lastPlayDate) return;

    const daysSinceLastPlay = Math.floor(
      (Date.now() - this.lastPlayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const insight of META_INSIGHTS) {
      if (insight.trigger.type !== 'return') continue;
      if (insight.awarenessRequired > this.awarenessLevel) continue;
      if (insight.oneTime && this.triggeredInsights.has(insight.id)) continue;

      if (daysSinceLastPlay >= insight.trigger.afterDays) {
        this.triggerInsight(insight);
      }
    }
  }

  /**
   * Check completion triggers
   */
  checkCompletionTriggers(completedCount: number, totalCount: number): void {
    const percentage = (completedCount / totalCount) * 100;

    for (const insight of META_INSIGHTS) {
      if (insight.trigger.type !== 'completion') continue;
      if (insight.awarenessRequired > this.awarenessLevel) continue;
      if (insight.oneTime && this.triggeredInsights.has(insight.id)) continue;

      if (percentage >= insight.trigger.percentage) {
        this.triggerInsight(insight);
      }
    }
  }

  // ===========================================================================
  // INSIGHT DELIVERY
  // ===========================================================================

  private triggerInsight(insight: MetaInsight): void {
    if (this.triggeredInsights.has(insight.id) && insight.oneTime) return;

    this.triggeredInsights.add(insight.id);

    // Save triggered insights
    saveSystem.setCustomData('triggered_insights', Array.from(this.triggeredInsights));

    // Queue message
    const message: MetaMessage = {
      id: insight.id,
      text: insight.message,
      duration: this.getMessageDuration(insight.category),
      style: this.getMessageStyle(insight.category),
      position: this.getMessagePosition(insight.category)
    };

    this.queueMessage(message);

    // Track for analytics
    analytics.track('meta', 'insight_triggered', insight.id, this.awarenessLevel);
  }

  private queueMessage(message: MetaMessage): void {
    this.messageQueue.push(message);

    if (!this.currentMessage) {
      this.showNextMessage();
    }
  }

  private showNextMessage(): void {
    if (this.messageQueue.length === 0) {
      this.currentMessage = null;
      return;
    }

    this.currentMessage = this.messageQueue.shift()!;

    if (this.onMessageCallback) {
      this.onMessageCallback(this.currentMessage);
    }

    // Auto-clear after duration
    setTimeout(() => {
      this.showNextMessage();
    }, this.currentMessage.duration);
  }

  private getMessageDuration(category: MetaInsight['category']): number {
    switch (category) {
      case 'observation': return 5000;
      case 'guidance': return 6000;
      case 'reflection': return 7000;
      case 'revelation': return 8000;
      default: return 5000;
    }
  }

  private getMessageStyle(category: MetaInsight['category']): MetaMessage['style'] {
    switch (category) {
      case 'observation': return 'subtle';
      case 'guidance': return 'normal';
      case 'reflection': return 'normal';
      case 'revelation': return 'emphatic';
      default: return 'normal';
    }
  }

  private getMessagePosition(category: MetaInsight['category']): MetaMessage['position'] {
    switch (category) {
      case 'observation': return 'ambient';
      case 'guidance': return 'corner';
      case 'reflection': return 'center';
      case 'revelation': return 'center';
      default: return 'corner';
    }
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  /**
   * Update - call periodically
   */
  update(deltaTime: number): void {
    // Check time triggers periodically
    if (Math.random() < 0.001) {  // ~once per second at 60fps
      this.checkTimeTriggers();
    }
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getCurrentMessage(): MetaMessage | null {
    return this.currentMessage;
  }

  getTriggeredInsightCount(): number {
    return this.triggeredInsights.size;
  }

  getTotalInsightCount(): number {
    return META_INSIGHTS.length;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const metaAwareness = new MetaAwarenessSystem();
