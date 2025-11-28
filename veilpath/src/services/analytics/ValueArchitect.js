/**
 * VALUE ARCHITECT
 *
 * The financial intelligence layer. Synthesizes all analytics into
 * actionable value for Ryan Cardwell as:
 * - IP owner (patent utilization, defensibility)
 * - Product/Project manager (what to build next)
 * - Sole financial everything-er (revenue, costs, runway)
 *
 * Current State: RED (not earning)
 * Goal: Architect paths from red → black
 *
 * For the Pod: Data science value creation framework
 * For Dev Team: Priority signals based on value impact
 *
 * Philosophy:
 * - Data without value insight is just storage cost
 * - Every metric must connect to a $ outcome
 * - Unknown unknowns are explored via anomaly → hypothesis → test
 * - Epistemic humility: we destroy our own assumptions when wrong
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVeilAnalytics } from './VeilAnalytics';
import { getCasimirAnalyzer } from './CasimirFrictionAnalyzer';
import { getAdAssetManager } from './AdAssetManager';
import { getRatchetLoop } from './RatchetLoop';
import { getMetaLearner } from './MetaLearner';

const VALUE_STATE_KEY = '@veilpath_value_architect';

// ═══════════════════════════════════════════════════════════════════════════
// VALUE METRICS (Everything connects to $)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Revenue streams and their current state
 */
const REVENUE_STREAMS = {
  PREMIUM_SUBSCRIPTIONS: {
    id: 'premium_subs',
    name: 'Premium Subscriptions',
    status: 'not_launched',
    potentialMRR: 0,
    currentMRR: 0,
    conversionFunnel: ['free_user', 'engaged', 'paywall_view', 'trial', 'paid'],
  },
  AD_REVENUE: {
    id: 'ad_revenue',
    name: 'Ad Revenue',
    status: 'house_ads_only',
    potentialMRR: 0,
    currentMRR: 0,
    stages: ['house_ads', 'mixed_ads', 'network_ads', 'targeted_ads'],
  },
  DATA_PRODUCTS: {
    id: 'data_products',
    name: 'Anonymized Data Sales',
    status: 'accumulating',
    potentialMRR: 0,
    currentMRR: 0,
    minUsersRequired: 10000,
  },
  IP_LICENSING: {
    id: 'ip_licensing',
    name: 'Patent/IP Licensing',
    status: 'provisional',
    potentialMRR: 0,
    currentMRR: 0,
    patents: [
      { id: 'psan_trifork', number: '63/925,504', name: 'PSAN Tri-Fork Synthesis' },
      { id: 'kuramoto_flow', number: '63/925,467', name: 'Kuramoto Flow Detection' },
      { id: 'casimir', number: '544', name: 'Casimir Failure-as-Signal' },
      { id: 'kxf_pruning', number: 'pending', name: 'K×f Pruning' },
      { id: 'sanskrit_phonetic', number: 'pending', name: 'Sanskrit Phonetic Mapping' },
    ],
  },
};

/**
 * Cost centers to track
 */
const COST_CENTERS = {
  INFRASTRUCTURE: {
    id: 'infra',
    name: 'Infrastructure',
    items: [
      { name: 'Supabase', monthlyCost: 25, status: 'active' },
      { name: 'PostHog', monthlyCost: 0, status: 'free_tier' },
      { name: 'Vercel/Hosting', monthlyCost: 0, status: 'free_tier' },
      { name: 'Domain', monthlyCost: 1, status: 'active' },
    ],
  },
  AI_SERVICES: {
    id: 'ai',
    name: 'AI Services',
    items: [
      { name: 'Anthropic API', monthlyCost: 0, status: 'usage_based', perRequestCost: 0.003 },
      { name: 'OpenAI (backup)', monthlyCost: 0, status: 'usage_based', perRequestCost: 0.002 },
    ],
  },
  MARKETING: {
    id: 'marketing',
    name: 'Marketing',
    items: [
      { name: 'ASO/Store fees', monthlyCost: 0, status: 'not_launched' },
      { name: 'Paid acquisition', monthlyCost: 0, status: 'not_started' },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VALUE ARCHITECT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ValueArchitect {
  constructor() {
    this.initialized = false;

    this.state = {
      version: 1,
      lastAnalysis: null,

      // Financial state
      currentState: 'red', // 'red' | 'yellow' | 'green'
      monthlyBurn: 0,
      monthlyRevenue: 0,
      runway: Infinity, // months until broke (Infinity if self-funded hobby)

      // User economics
      users: {
        total: 0,
        dau: 0,
        mau: 0,
        paying: 0,
        ltv: 0,
        cac: 0,
        arpu: 0,
      },

      // Value insights history
      insights: [],

      // Action items (prioritized by value impact)
      actionItems: [],

      // Hypotheses being tested
      activeHypotheses: [],

      // Destroyed assumptions (epistemic humility log)
      destroyedAssumptions: [],
    };
  }

  /**
   * Initialize ValueArchitect
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(VALUE_STATE_KEY);
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored) };
      }

      this.initialized = true;
      console.log('[ValueArchitect] Initialized');
    } catch (error) {
      console.error('[ValueArchitect] Init error:', error);
      this.initialized = true;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CORE VALUE ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run full value analysis
   * Call this daily or on-demand
   */
  async runValueAnalysis() {
    console.log('[ValueArchitect] Running value analysis...');

    const analytics = getVeilAnalytics();
    const casimir = getCasimirAnalyzer();
    const adManager = getAdAssetManager();
    const ratchet = getRatchetLoop();
    const metaLearner = getMetaLearner();

    // 1. Calculate current financial state
    const financials = this.calculateFinancials();

    // 2. Analyze user economics
    const userEconomics = await this.analyzeUserEconomics(analytics);

    // 3. Identify revenue opportunities
    const opportunities = this.identifyOpportunities(analytics, adManager);

    // 4. Calculate cost optimization potential
    const costOptimizations = this.identifyCostOptimizations();

    // 5. Assess IP value
    const ipValue = this.assessIPValue(ratchet, metaLearner);

    // 6. Generate prioritized action items
    const actionItems = this.generateActionItems(
      financials,
      userEconomics,
      opportunities,
      costOptimizations,
      ipValue
    );

    // 7. Update state
    this.state.lastAnalysis = Date.now();
    this.state.monthlyBurn = financials.monthlyBurn;
    this.state.monthlyRevenue = financials.monthlyRevenue;
    this.state.currentState = financials.state;
    this.state.users = userEconomics;
    this.state.actionItems = actionItems;

    // 8. Generate insights
    const insights = this.synthesizeInsights(
      financials,
      userEconomics,
      opportunities,
      ipValue
    );

    this.state.insights.push(...insights);
    this.state.insights = this.state.insights.slice(-100);

    await this.persist();

    console.log('[ValueArchitect] Analysis complete', {
      state: financials.state,
      actionItems: actionItems.length,
      insights: insights.length,
    });

    return {
      financials,
      userEconomics,
      opportunities,
      costOptimizations,
      ipValue,
      actionItems,
      insights,
    };
  }

  /**
   * Calculate current financial state
   */
  calculateFinancials() {
    // Sum up costs
    let monthlyBurn = 0;
    for (const center of Object.values(COST_CENTERS)) {
      for (const item of center.items) {
        monthlyBurn += item.monthlyCost;
      }
    }

    // Sum up revenue (currently 0)
    let monthlyRevenue = 0;
    for (const stream of Object.values(REVENUE_STREAMS)) {
      monthlyRevenue += stream.currentMRR;
    }

    // Calculate state
    const netMonthly = monthlyRevenue - monthlyBurn;
    let state = 'red';
    if (netMonthly > 0) state = 'green';
    else if (netMonthly > -50) state = 'yellow';

    return {
      monthlyBurn,
      monthlyRevenue,
      netMonthly,
      state,
      burnRate: monthlyBurn,
      revenueStreams: Object.values(REVENUE_STREAMS).map(s => ({
        name: s.name,
        status: s.status,
        current: s.currentMRR,
        potential: s.potentialMRR,
      })),
    };
  }

  /**
   * Analyze user economics
   */
  async analyzeUserEconomics(analytics) {
    const summary = analytics?.getAnalyticsSummary?.() || {};
    const userMetrics = summary.user?.metrics || {};

    // Calculate from available data
    const totalSessions = userMetrics.totalSessions || 0;
    const estimatedUsers = Math.max(1, Math.ceil(totalSessions / 10)); // Rough estimate

    return {
      total: estimatedUsers,
      dau: Math.ceil(estimatedUsers * 0.1), // Estimate 10% DAU
      mau: estimatedUsers,
      paying: 0, // Not launched yet
      ltv: 0, // No data yet
      cac: 0, // No paid acquisition yet
      arpu: 0, // No revenue yet

      // Projections based on industry benchmarks
      projectedLTV: 15, // $15 avg for wellness apps
      projectedConversionRate: 0.03, // 3% freemium conversion
      projectedARPU: 0.45, // $0.45/user/month blended
    };
  }

  /**
   * Identify revenue opportunities
   */
  identifyOpportunities(analytics, adManager) {
    const opportunities = [];

    // 1. Premium subscription opportunity
    const engagementScore = analytics?.calculateEngagementLevel?.() || 0;
    if (engagementScore > 0.3) {
      opportunities.push({
        id: 'launch_premium',
        name: 'Launch Premium Subscription',
        type: 'revenue',
        priority: 'high',
        estimatedMRR: this.state.users.total * 0.03 * 9.99, // 3% @ $9.99
        effort: 'medium',
        requirements: [
          'Stripe/RevenueCat integration',
          'Premium feature gating',
          'Paywall UI',
        ],
        valueRationale: 'Engaged users exist but no monetization path',
      });
    }

    // 2. Ad network integration
    const adStats = adManager?.getPerformanceStats?.() || {};
    if (adStats.totalImpressions > 100) {
      opportunities.push({
        id: 'ad_network',
        name: 'Integrate Ad Network (AdMob/Unity)',
        type: 'revenue',
        priority: 'medium',
        estimatedMRR: this.state.users.dau * 30 * 0.001, // $1 eCPM estimate
        effort: 'low',
        requirements: [
          'AdMob account setup',
          'GDPR consent flow',
          'Ad placement optimization',
        ],
        valueRationale: 'House ads proving engagement, real ads = real money',
      });
    }

    // 3. Data product preparation
    if (this.state.users.total > 1000) {
      opportunities.push({
        id: 'data_prep',
        name: 'Prepare Data Product Pipeline',
        type: 'future_revenue',
        priority: 'low',
        estimatedMRR: 0, // Future
        effort: 'high',
        requirements: [
          'Data anonymization verification',
          'Legal review',
          'Buyer identification',
        ],
        valueRationale: 'Approaching scale for data monetization',
      });
    }

    // 4. IP licensing preparation
    opportunities.push({
      id: 'ip_showcase',
      name: 'Create IP Demo/Showcase',
      type: 'strategic',
      priority: 'medium',
      estimatedMRR: 0, // Licensing is lumpy
      effort: 'medium',
      requirements: [
        'Working demo of each patent',
        'Documentation',
        'Pitch deck for potential licensees',
      ],
      valueRationale: '5 patents with no showcase = hidden value',
    });

    return opportunities;
  }

  /**
   * Identify cost optimizations
   */
  identifyCostOptimizations() {
    const optimizations = [];

    // Check each cost center
    for (const [key, center] of Object.entries(COST_CENTERS)) {
      for (const item of center.items) {
        if (item.status === 'active' && item.monthlyCost > 0) {
          // Look for free alternatives
          if (item.name === 'Supabase' && this.state.users.total < 500) {
            optimizations.push({
              id: `optimize_${item.name.toLowerCase()}`,
              name: `Evaluate ${item.name} tier`,
              currentCost: item.monthlyCost,
              potentialSavings: item.monthlyCost * 0.5, // Might downgrade
              action: 'Review usage, consider downgrade if under limits',
            });
          }
        }
      }
    }

    // AI cost optimization
    const aiCenter = COST_CENTERS.AI_SERVICES;
    optimizations.push({
      id: 'optimize_ai_calls',
      name: 'Optimize AI API usage',
      currentCost: 0, // Usage based
      potentialSavings: 0,
      action: 'Cache responses, batch requests, use smaller models where possible',
    });

    return optimizations;
  }

  /**
   * Assess IP value
   */
  assessIPValue(ratchet, metaLearner) {
    const patents = REVENUE_STREAMS.IP_LICENSING.patents;

    const assessments = patents.map(patent => {
      // Check if patent is being utilized in the codebase
      let utilizationScore = 0;
      let demonstrationReady = false;

      switch (patent.id) {
        case 'psan_trifork':
          utilizationScore = 0.7; // Used in analytics integration
          demonstrationReady = true;
          break;
        case 'kuramoto_flow':
          utilizationScore = 0.6; // Used in SDPM archetypes
          demonstrationReady = true;
          break;
        case 'casimir':
          utilizationScore = 0.9; // Full implementation
          demonstrationReady = true;
          break;
        case 'kxf_pruning':
          utilizationScore = 0.5; // Used in MetaLearner beam search
          demonstrationReady = false;
          break;
        case 'sanskrit_phonetic':
          utilizationScore = 0.1; // Not yet implemented
          demonstrationReady = false;
          break;
      }

      return {
        ...patent,
        utilizationScore,
        demonstrationReady,
        licensingPotential: utilizationScore > 0.5 ? 'medium' : 'low',
        recommendedAction: demonstrationReady
          ? 'Create standalone demo'
          : 'Implement in VeilPath first',
      };
    });

    // Overall IP health
    const avgUtilization = assessments.reduce((s, a) => s + a.utilizationScore, 0) / assessments.length;
    const demoReady = assessments.filter(a => a.demonstrationReady).length;

    return {
      patents: assessments,
      overallUtilization: avgUtilization,
      demonstrationReady: demoReady,
      totalPatents: patents.length,
      ipHealth: avgUtilization > 0.5 ? 'good' : 'needs_work',
      strategicValue: 'Differentiator for acquisition/licensing',
    };
  }

  /**
   * Generate prioritized action items
   */
  generateActionItems(financials, userEconomics, opportunities, costOptimizations, ipValue) {
    const items = [];

    // Priority 1: Revenue if in red
    if (financials.state === 'red') {
      const topRevOpp = opportunities
        .filter(o => o.type === 'revenue')
        .sort((a, b) => (b.estimatedMRR / (b.effort === 'low' ? 1 : b.effort === 'medium' ? 2 : 3)) -
                        (a.estimatedMRR / (a.effort === 'low' ? 1 : a.effort === 'medium' ? 2 : 3)))[0];

      if (topRevOpp) {
        items.push({
          priority: 1,
          action: topRevOpp.name,
          rationale: topRevOpp.valueRationale,
          estimatedImpact: `+$${topRevOpp.estimatedMRR.toFixed(0)}/mo`,
          effort: topRevOpp.effort,
          requirements: topRevOpp.requirements,
          category: 'revenue',
        });
      }
    }

    // Priority 2: User acquisition if no users
    if (userEconomics.total < 100) {
      items.push({
        priority: 2,
        action: 'Launch MVP to App Store',
        rationale: 'Need users to validate product and generate revenue',
        estimatedImpact: 'Foundation for all monetization',
        effort: 'high',
        requirements: [
          'App Store account',
          'Privacy policy',
          'Store listing assets',
          'TestFlight beta',
        ],
        category: 'growth',
      });
    }

    // Priority 3: Cost optimization if burning
    if (financials.monthlyBurn > 50) {
      const topSaving = costOptimizations[0];
      if (topSaving) {
        items.push({
          priority: 3,
          action: topSaving.name,
          rationale: topSaving.action,
          estimatedImpact: `-$${topSaving.potentialSavings.toFixed(0)}/mo`,
          effort: 'low',
          category: 'cost',
        });
      }
    }

    // Priority 4: IP demonstration
    const undemoed = ipValue.patents.filter(p => !p.demonstrationReady);
    if (undemoed.length > 0) {
      items.push({
        priority: 4,
        action: `Implement ${undemoed[0].name} in VeilPath`,
        rationale: 'IP without demonstration = hidden value',
        estimatedImpact: 'Increases IP portfolio value',
        effort: 'medium',
        category: 'strategic',
      });
    }

    // Priority 5: Analytics improvement
    items.push({
      priority: 5,
      action: 'Set up value dashboard',
      rationale: 'Cannot improve what you cannot see',
      estimatedImpact: 'Better decision making',
      effort: 'low',
      requirements: ['PostHog dashboards', 'Weekly review ritual'],
      category: 'operations',
    });

    return items.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Synthesize insights for Ryan
   */
  synthesizeInsights(financials, userEconomics, opportunities, ipValue) {
    const insights = [];
    const timestamp = Date.now();

    // State insight
    insights.push({
      id: `insight_state_${timestamp}`,
      type: 'status',
      title: `Financial State: ${financials.state.toUpperCase()}`,
      message: financials.state === 'red'
        ? `Burning $${financials.monthlyBurn}/mo with $${financials.monthlyRevenue} revenue. Focus on first dollar.`
        : `Net ${financials.netMonthly > 0 ? '+' : ''}$${financials.netMonthly}/mo`,
      priority: financials.state === 'red' ? 'critical' : 'info',
      timestamp,
    });

    // User insight
    if (userEconomics.total > 0) {
      const potentialMRR = userEconomics.total * userEconomics.projectedConversionRate * 9.99;
      insights.push({
        id: `insight_users_${timestamp}`,
        type: 'opportunity',
        title: `${userEconomics.total} Users = $${potentialMRR.toFixed(0)} Potential MRR`,
        message: `At 3% conversion to $9.99/mo premium. Current conversion: ${userEconomics.paying}/${userEconomics.total}`,
        priority: potentialMRR > 100 ? 'high' : 'medium',
        timestamp,
      });
    }

    // IP insight
    if (ipValue.overallUtilization < 0.5) {
      insights.push({
        id: `insight_ip_${timestamp}`,
        type: 'strategic',
        title: 'IP Underutilized',
        message: `Only ${Math.round(ipValue.overallUtilization * 100)}% of patents demonstrated in product. ${ipValue.demonstrationReady}/${ipValue.totalPatents} ready for showcase.`,
        priority: 'medium',
        timestamp,
      });
    }

    // Top opportunity insight
    const topOpp = opportunities[0];
    if (topOpp) {
      insights.push({
        id: `insight_opp_${timestamp}`,
        type: 'opportunity',
        title: `Top Opportunity: ${topOpp.name}`,
        message: `Est. $${topOpp.estimatedMRR.toFixed(0)}/mo. Effort: ${topOpp.effort}. ${topOpp.valueRationale}`,
        priority: 'high',
        timestamp,
      });
    }

    return insights;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HYPOTHESIS TESTING (Epistemic Humility)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Register a hypothesis to test
   */
  registerHypothesis(hypothesis) {
    this.state.activeHypotheses.push({
      ...hypothesis,
      id: `hyp_${Date.now()}`,
      createdAt: Date.now(),
      status: 'testing',
      results: null,
    });
    this.persist();
  }

  /**
   * Record hypothesis result
   */
  recordHypothesisResult(hypothesisId, supported, evidence) {
    const hyp = this.state.activeHypotheses.find(h => h.id === hypothesisId);
    if (!hyp) return;

    hyp.status = supported ? 'supported' : 'rejected';
    hyp.results = {
      supported,
      evidence,
      evaluatedAt: Date.now(),
    };

    // If rejected, log as destroyed assumption
    if (!supported) {
      this.state.destroyedAssumptions.push({
        hypothesis: hyp.statement,
        evidence,
        destroyedAt: Date.now(),
        lesson: `Assumed: "${hyp.statement}" — Reality: ${evidence}`,
      });
    }

    this.persist();
  }

  /**
   * Get destroyed assumptions (epistemic humility log)
   */
  getDestroyedAssumptions() {
    return this.state.destroyedAssumptions;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // POD INTERFACE (Data Science Value Creation)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get data package for Pod analysis
   */
  getPodDataPackage() {
    return {
      timestamp: Date.now(),
      financialState: this.state.currentState,

      // Raw metrics for analysis
      metrics: {
        users: this.state.users,
        burn: this.state.monthlyBurn,
        revenue: this.state.monthlyRevenue,
      },

      // Hypotheses needing testing
      openHypotheses: this.state.activeHypotheses.filter(h => h.status === 'testing'),

      // Destroyed assumptions (learnings)
      learnings: this.state.destroyedAssumptions,

      // Current action items
      actionItems: this.state.actionItems,

      // Value questions for Pod to investigate
      investigationRequests: [
        'What user behaviors correlate with premium conversion?',
        'Which friction events have highest churn impact?',
        'What ad placements have best engagement without hurting UX?',
        'Which patent technologies show highest user value signal?',
      ],
    };
  }

  /**
   * Receive Pod insights
   */
  receivePodInsights(insights) {
    for (const insight of insights) {
      this.state.insights.push({
        ...insight,
        source: 'pod',
        receivedAt: Date.now(),
      });
    }
    this.persist();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD DATA
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get executive summary for Ryan
   */
  getExecutiveSummary() {
    return {
      // Current state
      state: this.state.currentState,
      stateEmoji: this.state.currentState === 'red' ? '🔴' :
                  this.state.currentState === 'yellow' ? '🟡' : '🟢',

      // Key numbers
      burn: this.state.monthlyBurn,
      revenue: this.state.monthlyRevenue,
      net: this.state.monthlyRevenue - this.state.monthlyBurn,
      users: this.state.users.total,
      dau: this.state.users.dau,
      paying: this.state.users.paying,

      // Top action
      topAction: this.state.actionItems[0] || null,

      // Recent insights
      recentInsights: this.state.insights.slice(-5),

      // IP status
      ipUtilization: '~50%', // TODO: Calculate from ipValue

      // Last analysis
      lastAnalysis: this.state.lastAnalysis,
    };
  }

  /**
   * Get full dashboard data
   */
  getDashboardData() {
    return {
      summary: this.getExecutiveSummary(),
      actionItems: this.state.actionItems,
      insights: this.state.insights.slice(-20),
      hypotheses: this.state.activeHypotheses,
      learnings: this.state.destroyedAssumptions,
      revenueStreams: REVENUE_STREAMS,
      costCenters: COST_CENTERS,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Persist state
   */
  async persist() {
    try {
      await AsyncStorage.setItem(VALUE_STATE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('[ValueArchitect] Persist error:', error);
    }
  }

  /**
   * Reset (for testing)
   */
  async reset() {
    this.state = {
      version: 1,
      lastAnalysis: null,
      currentState: 'red',
      monthlyBurn: 0,
      monthlyRevenue: 0,
      runway: Infinity,
      users: { total: 0, dau: 0, mau: 0, paying: 0, ltv: 0, cac: 0, arpu: 0 },
      insights: [],
      actionItems: [],
      activeHypotheses: [],
      destroyedAssumptions: [],
    };
    await AsyncStorage.removeItem(VALUE_STATE_KEY);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let instance = null;

/**
 * Get ValueArchitect singleton
 */
export function getValueArchitect() {
  if (!instance) {
    instance = new ValueArchitect();
  }
  return instance;
}

/**
 * Initialize ValueArchitect
 */
export async function initValueArchitect() {
  const architect = getValueArchitect();
  await architect.initialize();
  return architect;
}

export { REVENUE_STREAMS, COST_CENTERS };
export default ValueArchitect;
