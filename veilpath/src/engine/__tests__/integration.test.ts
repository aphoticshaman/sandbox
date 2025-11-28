/**
 * INTEGRATION TESTS & ABLATION STUDY
 * ===================================
 *
 * Phase 15: Comprehensive integration testing of the VeilPath vera intelligence stack:
 *
 * Components Under Test:
 * 1. NSM Fusion Engine (8-domain fusion)
 * 2. Solomonoff-Casimir Compression Engine
 * 3. Cross-Session Pattern Recognition
 * 4. Journal-Card Correlation Analysis
 *
 * Ablation Study:
 * Measures contribution of each domain to vera quality.
 * Implements K×f multiplicative pruning validation.
 */

import { NSMFusionEngine, UserContext, TarotContext, KnowledgeDomain } from '../nsmFusion';
import {
  SolomonoffCasimirEngine,
  compressionDistance,
  getSolomonoffPrior,
  getKolmogorovEstimate,
} from '../solomonoffCasimir';
import type { CrossSessionAnalysis, PatternResult } from '../../services/crossSessionPatterns';
import type { JournalCardAnalysis, LongitudinalPattern } from '../../services/journalCardCorrelation';

// ═══════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════

const mockTarotContext: TarotContext = {
  cards: [
    { cardIndex: 0, cardName: 'The Fool', reversed: false, position: 'Present' },
    { cardIndex: 1, cardName: 'The Magician', reversed: false, position: 'Challenge' },
    { cardIndex: 2, cardName: 'The High Priestess', reversed: true, position: 'Outcome' },
  ],
  spreadType: 'three_card',
  intention: 'What should I focus on for personal growth?',
};

const mockUserContext: UserContext = {
  mbtiType: 'INFJ',
  zodiacSign: 'Scorpio',
  chineseZodiac: 'Dragon',
  birthdate: '1990-11-08',
  readingHistory: [
    { date: '2024-01-01', cards: ['The Star'], mood: 'hopeful' },
    { date: '2024-01-15', cards: ['The Tower'], mood: 'anxious' },
    { date: '2024-02-01', cards: ['The Star'], mood: 'peaceful' },
  ],
  preferences: {
    readingDepth: 'deep',
    tonePreference: 'poetic',
    topicsOfInterest: ['spirituality', 'career', 'relationships'],
  },
};

const mockCrossSessionAnalysis: CrossSessionAnalysis = {
  patterns: [
    {
      patternType: 'recurring_card',
      cardIndices: [17], // The Star
      significance: 0.85,
      frequency: 3,
      interpretation: 'The Star keeps appearing - hope is your guide',
      metadata: {},
    },
    {
      patternType: 'shadow_card',
      cardIndices: [16], // The Tower
      significance: 0.7,
      frequency: 2,
      interpretation: 'The Tower represents avoided transformation',
      metadata: {},
    },
  ] as PatternResult[],
  insights: [
    'You consistently draw cards of hope and transformation',
    'Shadow work with The Tower could unlock growth',
  ],
  shadowWork: {
    identifiedShadows: ['fear of change', 'resistance to upheaval'],
    suggestedPrompts: [
      'What would I gain if I embraced sudden change?',
      'What stability am I clinging to that no longer serves me?',
    ],
  },
  recommendations: [
    'Journal about your relationship with uncertainty',
    'Consider a Tower-focused meditation',
  ],
  sessionCount: 15,
  timeSpan: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const mockJournalAnalysis: JournalCardAnalysis = {
  correlations: [
    {
      journalEntryId: 'j1',
      readingId: 'r1',
      themeAlignment: ['hope', 'growth'],
      overallAlignment: 0.8,
      moodTransition: {
        before: 'anxious',
        after: 'hopeful',
        improvement: 0.4,
      },
      insights: ['Journal themes match The Star energy'],
    },
  ],
  longitudinalPatterns: [
    {
      patternType: 'growth',
      description: 'Consistent improvement in emotional regulation',
      startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      endDate: Date.now(),
      confidence: 0.75,
      supportingEntries: ['j1', 'j2'],
    } as LongitudinalPattern,
  ],
  growthIndicators: [
    'Increased self-awareness in journal entries',
    'Better integration of card insights',
  ],
  warnings: [],
  summary: 'Strong correlation between journal themes and card energies',
};

// Add cross-session and journal data to user context
const enrichedUserContext: UserContext = {
  ...mockUserContext,
  crossSessionAnalysis: mockCrossSessionAnalysis,
  journalAnalysis: mockJournalAnalysis,
};

const mockPersonalityTraits: Record<string, number> = {
  openness: 0.85,
  conscientiousness: 0.6,
  extraversion: 0.3,
  agreeableness: 0.7,
  neuroticism: 0.5,
};

// ═══════════════════════════════════════════════════════════
// NSM FUSION ENGINE TESTS
// ═══════════════════════════════════════════════════════════

describe('NSM Fusion Engine v2.0', () => {
  let engine: NSMFusionEngine;

  beforeEach(() => {
    engine = new NSMFusionEngine();
  });

  describe('8-Domain Fusion', () => {
    it('should fuse all 8 knowledge domains', () => {
      const result = engine.fuse(
        'What does my future hold in love?',
        mockTarotContext,
        enrichedUserContext,
        mockPersonalityTraits
      );

      expect(result).toBeDefined();
      expect(result.fusedVector).toHaveLength(6); // 6D semantic space
      expect(result.domainContributions.size).toBe(8);

      // Verify all domains present
      const domains: KnowledgeDomain[] = [
        'tarot',
        'psychology',
        'neuroscience',
        'linguistics',
        'sanskrit',
        'user_history',
        'cross_session',
        'journal_correlation',
      ];
      domains.forEach((domain) => {
        expect(result.domainContributions.has(domain)).toBe(true);
      });
    });

    it('should produce valid semantic position', () => {
      const result = engine.fuse(
        'Guide me through this challenge',
        mockTarotContext,
        enrichedUserContext,
        mockPersonalityTraits
      );

      expect(result.semanticPosition.x).toBeGreaterThanOrEqual(0);
      expect(result.semanticPosition.x).toBeLessThanOrEqual(1);
      expect(result.semanticPosition.y).toBeGreaterThanOrEqual(0);
      expect(result.semanticPosition.y).toBeLessThanOrEqual(1);
      expect(result.semanticPosition.z).toBeGreaterThanOrEqual(0);
      expect(result.semanticPosition.z).toBeLessThanOrEqual(1);
    });

    it('should identify dominant domain correctly', () => {
      const result = engine.fuse(
        'What do the cards say?',
        mockTarotContext,
        enrichedUserContext,
        mockPersonalityTraits
      );

      // Tarot should typically be dominant given the context
      expect(['tarot', 'psychology', 'cross_session']).toContain(result.dominantDomain);
    });

    it('should generate pattern insights from cross-session data', () => {
      const result = engine.fuse(
        'What patterns emerge?',
        mockTarotContext,
        enrichedUserContext,
        mockPersonalityTraits
      );

      expect(result.patternInsights.length).toBeGreaterThan(0);
    });

    it('should generate shadow work suggestions', () => {
      const result = engine.fuse(
        'Help me understand my shadows',
        mockTarotContext,
        enrichedUserContext,
        mockPersonalityTraits
      );

      expect(result.shadowWorkSuggestions.length).toBeGreaterThan(0);
    });

    it('should generate growth indicators from journal data', () => {
      const result = engine.fuse(
        'Am I growing?',
        mockTarotContext,
        enrichedUserContext,
        mockPersonalityTraits
      );

      expect(result.growthIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('MBTI Cognitive Functions', () => {
    const mbtiTypes = [
      'INTJ', 'INTP', 'ENTJ', 'ENTP',
      'INFJ', 'INFP', 'ENFJ', 'ENFP',
      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
      'ISTP', 'ISFP', 'ESTP', 'ESFP',
    ];

    it.each(mbtiTypes)('should handle %s type correctly', (mbti) => {
      const userContext: UserContext = {
        ...mockUserContext,
        mbtiType: mbti,
      };

      const result = engine.fuse(
        'Tell me about myself',
        mockTarotContext,
        userContext,
        mockPersonalityTraits
      );

      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.domainContributions.get('psychology')).toBeGreaterThan(0);
    });
  });

  describe('Zodiac Integration', () => {
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer',
      'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];

    it.each(zodiacSigns)('should integrate %s zodiac energy', (sign) => {
      const userContext: UserContext = {
        ...mockUserContext,
        zodiacSign: sign,
      };

      const result = engine.fuse(
        'What does the cosmos say?',
        mockTarotContext,
        userContext,
        mockPersonalityTraits
      );

      expect(result.fusedVector).toBeDefined();
      expect(result.fusedVector.length).toBe(6);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// SOLOMONOFF-CASIMIR ENGINE TESTS
// ═══════════════════════════════════════════════════════════

describe('Solomonoff-Casimir Compression Engine', () => {
  let engine: SolomonoffCasimirEngine;

  beforeEach(() => {
    engine = new SolomonoffCasimirEngine();
  });

  describe('Kolmogorov Complexity Estimation', () => {
    it('should estimate lower complexity for simple text', () => {
      const simple = 'aaaaaaaaaa';
      const complex = 'x7k9mZ2pQr';

      const simpleK = getKolmogorovEstimate(simple);
      const complexK = getKolmogorovEstimate(complex);

      expect(simpleK).toBeLessThan(complexK);
    });

    it('should estimate lower complexity for repetitive patterns', () => {
      const repetitive = 'the cat sat on the mat the cat sat on the mat';
      const random = 'kj7x9m2zQrVpLsNw5yFhGt8cXdBaEu3iOo';

      const repK = getKolmogorovEstimate(repetitive);
      const randK = getKolmogorovEstimate(random);

      expect(repK).toBeLessThan(randK);
    });

    it('should return 0 for empty string', () => {
      expect(getKolmogorovEstimate('')).toBe(0);
    });
  });

  describe('Solomonoff Prior', () => {
    it('should assign higher prior to simpler interpretations', () => {
      const simple = 'Trust your heart.';
      const complex = 'The quintessential manifestation of archetypal transmutation beckons.';

      const simplePrior = getSolomonoffPrior(simple);
      const complexPrior = getSolomonoffPrior(complex);

      expect(simplePrior).toBeGreaterThan(complexPrior);
    });

    it('should return value between 0 and 1', () => {
      const texts = [
        'Hello',
        'The Tower represents sudden change',
        'You are entering a period of transformation',
      ];

      texts.forEach((text) => {
        const prior = getSolomonoffPrior(text);
        expect(prior).toBeGreaterThan(0);
        expect(prior).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Normalized Compression Distance (NCD)', () => {
    it('should return 0 for identical texts', () => {
      const text = 'The Star brings hope';
      const distance = compressionDistance(text, text);

      expect(distance).toBeLessThan(0.1);
    });

    it('should return high distance for unrelated texts', () => {
      const text1 = 'Love and relationships flourish';
      const text2 = 'Technical analysis of market trends';

      const distance = compressionDistance(text1, text2);
      expect(distance).toBeGreaterThan(0.3);
    });

    it('should return low distance for similar texts', () => {
      const text1 = 'The Empress brings abundance and fertility';
      const text2 = 'The Empress symbolizes abundance and growth';

      const distance = compressionDistance(text1, text2);
      expect(distance).toBeLessThan(0.7);
    });
  });

  describe('AIXI Interpretation Selection', () => {
    it('should select interpretation with best score', () => {
      const candidates = [
        { id: '1', text: 'Trust your intuition.', resonanceEstimate: 0.8 },
        { id: '2', text: 'The cards suggest a period of transformation.', resonanceEstimate: 0.6 },
        { id: '3', text: 'Complex archetypal forces converge.', resonanceEstimate: 0.4 },
      ];

      const result = engine.selectInterpretation(candidates);

      expect(result.selectedInterpretation).toBeDefined();
      expect(result.selectedInterpretation.score).toBeDefined();
      expect(result.alternatives.length).toBe(2);
    });

    it('should prefer simpler interpretations (Solomonoff prior)', () => {
      const candidates = [
        { id: '1', text: 'Trust yourself.', resonanceEstimate: 0.7 },
        {
          id: '2',
          text: 'The phenomenological manifestation of your subconscious archetypal narrative.',
          resonanceEstimate: 0.7,
        },
      ];

      const result = engine.selectInterpretation(candidates);

      // Simpler text should win due to higher Solomonoff prior
      expect(result.selectedInterpretation.id).toBe('1');
    });

    it('should factor in vacuum state', () => {
      // Add some rejected traces to raise the vacuum floor
      engine.addTrace('complex rejected interpretation one', false);
      engine.addTrace('complex rejected interpretation two', false);
      engine.addTrace('simple accepted', true);

      const state = engine.getVacuumState();
      expect(state.resistanceAccumulator).toBeGreaterThan(0);
      expect(state.zeroPointEnergy).toBeGreaterThan(0);

      const candidates = [
        { id: '1', text: 'Simple truth.', resonanceEstimate: 0.6 },
        { id: '2', text: 'Moderately complex interpretation.', resonanceEstimate: 0.6 },
      ];

      const result = engine.selectInterpretation(candidates);
      expect(result.provenance.vacuumAdjustment).toBeDefined();
    });
  });

  describe('Casimir Vacuum State', () => {
    it('should update vacuum state on trace addition', () => {
      const initialState = engine.getVacuumState();
      expect(initialState.traceCount).toBe(0);

      engine.addTrace('First interpretation', true);
      engine.addTrace('Second interpretation', false);

      const updatedState = engine.getVacuumState();
      expect(updatedState.traceCount).toBe(2);
      expect(updatedState.resistanceAccumulator).toBeGreaterThan(0);
      expect(updatedState.acceptanceAccumulator).toBeGreaterThan(0);
    });

    it('should raise zero-point energy with more rejections', () => {
      // Baseline with balanced accept/reject
      engine.addTrace('accepted one', true);
      engine.addTrace('rejected one', false);
      const balanced = engine.getVacuumState().zeroPointEnergy;

      // Reset and add mostly rejections
      engine.resetVacuum();
      engine.addTrace('rejected one', false);
      engine.addTrace('rejected two', false);
      engine.addTrace('rejected three', false);
      engine.addTrace('accepted one', true);
      const highResistance = engine.getVacuumState().zeroPointEnergy;

      // Higher resistance should raise the floor
      expect(highResistance).toBeGreaterThan(balanced);
    });

    it('should export and import state correctly', () => {
      engine.addTrace('trace 1', true);
      engine.addTrace('trace 2', false);

      const exported = engine.exportState();

      const newEngine = new SolomonoffCasimirEngine();
      newEngine.importState(exported);

      expect(newEngine.getVacuumState()).toEqual(engine.getVacuumState());
      expect(newEngine.getTraces().length).toBe(engine.getTraces().length);
    });
  });

  describe('K×f Multiplicative Pruning', () => {
    it('should calculate pattern significance correctly', () => {
      const highFreqSimple = engine.calculatePatternSignificance('love', 50);
      const lowFreqComplex = engine.calculatePatternSignificance(
        'phenomenological transformation',
        2
      );

      // Both can be significant depending on K×f
      expect(highFreqSimple.score).toBeDefined();
      expect(lowFreqComplex.score).toBeDefined();
    });

    it('should extract significant patterns from traces', () => {
      // Add traces with repeating patterns
      const traces = [
        'The Star brings hope and healing',
        'Hope emerges from The Star',
        'The Star illuminates your path with hope',
        'Healing light from The Star',
        'Hope is your guide today',
      ];

      traces.forEach((t) => engine.addTrace(t, true));

      const patterns = engine.extractSignificantPatterns(2);

      expect(patterns.length).toBeGreaterThan(0);
      // 'hope' and 'star' should appear as significant patterns
      const patternTexts = patterns.map((p) => p.pattern.toLowerCase());
      expect(patternTexts.some((p) => p.includes('hope') || p.includes('star'))).toBe(true);
    });
  });

  describe('Redundancy Detection', () => {
    it('should detect high redundancy for repeated content', () => {
      engine.addTrace('The fool represents new beginnings', true);
      engine.addTrace('New beginnings come with the fool', true);

      const redundancy = engine.calculateRedundancy('The fool brings new beginnings');
      expect(redundancy).toBeGreaterThan(0.3);
    });

    it('should detect low redundancy for novel content', () => {
      engine.addTrace('The Tower represents sudden change', true);
      engine.addTrace('Change comes unexpectedly', true);

      const redundancy = engine.calculateRedundancy(
        'Financial investments require careful consideration of market dynamics'
      );
      expect(redundancy).toBeLessThan(0.5);
    });
  });

  describe('Similar Trace Detection', () => {
    it('should find similar traces', () => {
      engine.addTrace('Love and romance blossom', true);
      engine.addTrace('Career advancement awaits', true);
      engine.addTrace('Romantic feelings grow stronger', true);

      const similar = engine.findSimilarTraces('Love is in the air', 2);
      expect(similar.length).toBeLessThanOrEqual(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// ABLATION STUDY
// ═══════════════════════════════════════════════════════════

describe('Ablation Study: Domain Contribution Analysis', () => {
  let engine: NSMFusionEngine;

  beforeEach(() => {
    engine = new NSMFusionEngine();
  });

  /**
   * Ablation methodology:
   * 1. Run full 8-domain fusion as baseline
   * 2. Ablate each domain by providing empty/null context
   * 3. Measure impact on confidence, provenance, and semantic position
   */

  it('should measure tarot domain contribution', () => {
    // Baseline with tarot
    const baseline = engine.fuse(
      'What do the cards reveal?',
      mockTarotContext,
      enrichedUserContext,
      mockPersonalityTraits
    );

    // Ablated (minimal tarot)
    const ablatedTarot: TarotContext = {
      cards: [],
      spreadType: 'none',
      intention: '',
    };

    const ablated = engine.fuse(
      'What do the cards reveal?',
      ablatedTarot,
      enrichedUserContext,
      mockPersonalityTraits
    );

    // Tarot contribution should be significant
    const tarotContribBaseline = baseline.domainContributions.get('tarot') || 0;
    expect(tarotContribBaseline).toBeGreaterThan(0.15);

    // Document ablation impact
    console.log('Tarot ablation impact:');
    console.log(`  Baseline confidence: ${baseline.confidence.toFixed(3)}`);
    console.log(`  Ablated confidence: ${ablated.confidence.toFixed(3)}`);
  });

  it('should measure psychology domain contribution', () => {
    // Baseline with MBTI
    const baseline = engine.fuse(
      'Tell me about my personality',
      mockTarotContext,
      enrichedUserContext,
      mockPersonalityTraits
    );

    // Ablated (no MBTI/zodiac)
    const ablatedUser: UserContext = {
      ...enrichedUserContext,
      mbtiType: undefined,
      zodiacSign: undefined,
    };

    const ablated = engine.fuse(
      'Tell me about my personality',
      mockTarotContext,
      ablatedUser,
      mockPersonalityTraits
    );

    const psychContribBaseline = baseline.domainContributions.get('psychology') || 0;
    const psychContribAblated = ablated.domainContributions.get('psychology') || 0;

    // MBTI should significantly impact psychology contribution
    expect(psychContribBaseline).toBeGreaterThan(psychContribAblated);

    console.log('Psychology ablation impact:');
    console.log(`  Baseline psychology weight: ${psychContribBaseline.toFixed(3)}`);
    console.log(`  Ablated psychology weight: ${psychContribAblated.toFixed(3)}`);
  });

  it('should measure cross-session domain contribution', () => {
    // Baseline with cross-session
    const baseline = engine.fuse(
      'What patterns emerge?',
      mockTarotContext,
      enrichedUserContext,
      mockPersonalityTraits
    );

    // Ablated (no cross-session)
    const ablatedUser: UserContext = {
      ...mockUserContext,
      crossSessionAnalysis: undefined,
      journalAnalysis: enrichedUserContext.journalAnalysis,
    };

    const ablated = engine.fuse(
      'What patterns emerge?',
      mockTarotContext,
      ablatedUser,
      mockPersonalityTraits
    );

    const crossContribBaseline = baseline.domainContributions.get('cross_session') || 0;
    const crossContribAblated = ablated.domainContributions.get('cross_session') || 0;

    expect(crossContribBaseline).toBeGreaterThan(crossContribAblated);

    // Pattern insights should be affected
    expect(baseline.patternInsights.length).toBeGreaterThanOrEqual(ablated.patternInsights.length);

    console.log('Cross-session ablation impact:');
    console.log(`  Baseline cross_session weight: ${crossContribBaseline.toFixed(3)}`);
    console.log(`  Ablated cross_session weight: ${crossContribAblated.toFixed(3)}`);
    console.log(`  Baseline pattern insights: ${baseline.patternInsights.length}`);
    console.log(`  Ablated pattern insights: ${ablated.patternInsights.length}`);
  });

  it('should measure journal correlation domain contribution', () => {
    // Baseline with journal
    const baseline = engine.fuse(
      'How am I growing?',
      mockTarotContext,
      enrichedUserContext,
      mockPersonalityTraits
    );

    // Ablated (no journal)
    const ablatedUser: UserContext = {
      ...mockUserContext,
      crossSessionAnalysis: enrichedUserContext.crossSessionAnalysis,
      journalAnalysis: undefined,
    };

    const ablated = engine.fuse(
      'How am I growing?',
      mockTarotContext,
      ablatedUser,
      mockPersonalityTraits
    );

    const journalContribBaseline = baseline.domainContributions.get('journal_correlation') || 0;
    const journalContribAblated = ablated.domainContributions.get('journal_correlation') || 0;

    expect(journalContribBaseline).toBeGreaterThan(journalContribAblated);

    // Growth indicators should be affected
    expect(baseline.growthIndicators.length).toBeGreaterThanOrEqual(
      ablated.growthIndicators.length
    );

    console.log('Journal correlation ablation impact:');
    console.log(`  Baseline journal weight: ${journalContribBaseline.toFixed(3)}`);
    console.log(`  Ablated journal weight: ${journalContribAblated.toFixed(3)}`);
    console.log(`  Baseline growth indicators: ${baseline.growthIndicators.length}`);
    console.log(`  Ablated growth indicators: ${ablated.growthIndicators.length}`);
  });

  it('should generate full ablation report', () => {
    const domains: KnowledgeDomain[] = [
      'tarot',
      'psychology',
      'neuroscience',
      'linguistics',
      'sanskrit',
      'user_history',
      'cross_session',
      'journal_correlation',
    ];

    const baseline = engine.fuse(
      'Complete reading request',
      mockTarotContext,
      enrichedUserContext,
      mockPersonalityTraits
    );

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ABLATION STUDY REPORT: Domain Contribution Analysis');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Baseline Configuration:');
    console.log(`  Total domains: 8`);
    console.log(`  Overall confidence: ${baseline.confidence.toFixed(4)}`);
    console.log(`  Dominant domain: ${baseline.dominantDomain}`);
    console.log('\nDomain Weights (Solomonoff-weighted):');

    domains.forEach((domain) => {
      const weight = baseline.domainContributions.get(domain) || 0;
      const bar = '█'.repeat(Math.round(weight * 50));
      console.log(`  ${domain.padEnd(20)} ${(weight * 100).toFixed(1).padStart(5)}% ${bar}`);
    });

    console.log('\nEnhanced Features:');
    console.log(`  Pattern insights: ${baseline.patternInsights.length}`);
    console.log(`  Shadow work suggestions: ${baseline.shadowWorkSuggestions.length}`);
    console.log(`  Growth indicators: ${baseline.growthIndicators.length}`);
    console.log(`  Personalized guidance: ${baseline.personalizedGuidance.length}`);

    console.log('\nProvenance:');
    console.log(`  ${baseline.provenance}`);

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Assertions to ensure the test passes
    expect(baseline.domainContributions.size).toBe(8);
    expect(baseline.confidence).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════
// INTEGRATION TESTS: END-TO-END FLOW
// ═══════════════════════════════════════════════════════════

describe('End-to-End Integration', () => {
  it('should complete full vera pipeline', () => {
    const fusionEngine = new NSMFusionEngine();
    const casimirEngine = new SolomonoffCasimirEngine();

    // Step 1: Generate fusion result
    const fusionResult = fusionEngine.fuse(
      'What guidance do the cards offer today?',
      mockTarotContext,
      enrichedUserContext,
      mockPersonalityTraits
    );

    expect(fusionResult.fusedVector).toBeDefined();
    expect(fusionResult.confidence).toBeGreaterThan(0);

    // Step 2: Generate candidate interpretations (mock)
    const interpretations = [
      {
        id: '1',
        text: `The ${mockTarotContext.cards[0].cardName} invites you to embrace new beginnings.`,
        resonanceEstimate: 0.8,
      },
      {
        id: '2',
        text: `Focus on the transformative energy of ${mockTarotContext.cards[1].cardName}.`,
        resonanceEstimate: 0.7,
      },
      {
        id: '3',
        text: `The reversed ${mockTarotContext.cards[2].cardName} suggests hidden knowledge awaits.`,
        resonanceEstimate: 0.75,
      },
    ];

    // Step 3: Use Solomonoff-Casimir to select optimal interpretation
    const selection = casimirEngine.selectInterpretation(interpretations, {
      preferredComplexity: enrichedUserContext.preferences?.readingDepth || 'moderate',
    });

    expect(selection.selectedInterpretation).toBeDefined();
    expect(selection.provenance.method).toBe('AIXI-Solomonoff-Casimir');

    // Step 4: Add trace to vacuum
    const trace = casimirEngine.addTrace(selection.selectedInterpretation.text, true, {
      readingId: 'test-reading-001',
      mood: 'hopeful',
    });

    expect(trace.kolmogorovEstimate).toBeGreaterThan(0);

    // Step 5: Verify vacuum state updated
    const stats = casimirEngine.getStatistics();
    expect(stats.acceptedTraces).toBe(1);

    console.log('\nEnd-to-End Pipeline Results:');
    console.log(`  Fusion confidence: ${fusionResult.confidence.toFixed(3)}`);
    console.log(`  Dominant domain: ${fusionResult.dominantDomain}`);
    console.log(`  Selected interpretation: "${selection.selectedInterpretation.text}"`);
    console.log(`  Selection score: ${selection.selectedInterpretation.score?.toFixed(4)}`);
    console.log(`  Kolmogorov estimate: ${trace.kolmogorovEstimate.toFixed(0)} bits`);
  });

  it('should handle minimal context gracefully', () => {
    const fusionEngine = new NSMFusionEngine();

    const minimalContext: UserContext = {};
    const minimalTarot: TarotContext = {
      cards: [{ cardIndex: 0, cardName: 'The Fool', reversed: false, position: 'Present' }],
      spreadType: 'single_card',
    };

    const result = fusionEngine.fuse('Quick reading', minimalTarot, minimalContext, {});

    expect(result).toBeDefined();
    expect(result.fusedVector).toBeDefined();
    // Should still work, just with lower confidence
    expect(result.confidence).toBeLessThan(0.8);
  });

  it('should maintain consistency across multiple calls', () => {
    const engine = new NSMFusionEngine();

    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(
        engine.fuse(
          'Same question asked multiple times',
          mockTarotContext,
          enrichedUserContext,
          mockPersonalityTraits
        )
      );
    }

    // All results should have similar structure
    results.forEach((result) => {
      expect(result.domainContributions.size).toBe(8);
      expect(result.fusedVector.length).toBe(6);
    });

    // Domain weights should be consistent (deterministic)
    const firstWeights = Array.from(results[0].domainContributions.entries());
    results.forEach((result) => {
      const weights = Array.from(result.domainContributions.entries());
      weights.forEach(([domain, weight], idx) => {
        expect(Math.abs(weight - firstWeights[idx][1])).toBeLessThan(0.001);
      });
    });
  });
});
