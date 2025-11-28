/**
 * TEMPORARY STUBS FOR ARCHIVED UTILS
 *
 * Placeholder functions to replace archived AGI/old vision utilities
 * These return minimal data to prevent crashes
 *
 * TODO: Remove when old screens are replaced with new dark fantasy versions
 */

// AGI Interpretation stub
export async function interpretReading(cards, question) {
  return {
    summary: "Reading interpretation coming soon...",
    cards: cards.map(c => ({
      card: c,
      meaning: "Card interpretation will be available when LLM integration is complete."
    }))
  };
}

export async function interpretCard(card) {
  return {
    name: card.name || "Unknown Card",
    meaning: "Card interpretation will be available when LLM integration is complete."
  };
}

// Post-card questions stub
export async function generatePostCardQuestions(cards) {
  return [
    "What resonates most with you from this reading?",
    "How does this relate to your current situation?",
    "What action might you take based on this guidance?"
  ];
}

// Mega synthesis stub
export async function generateMegaSynthesis(readings) {
  return {
    synthesis: "Multi-reading synthesis will be available when LLM integration is complete.",
    themes: [],
    insights: []
  };
}

// Geometric semantic space stubs
export function extractGeometricThemes(data) {
  return {
    themes: [],
    clusters: [],
    relationships: [],
    centroid: [0, 0, 0],
    avgOverlap: 0
  };
}

export const CARD_EMBEDDINGS = {};

export function getSemanticDistance(cardIndex1, cardIndex2) {
  return 0;
}

export function findNearestCards(cardIndex, count = 5) {
  return [];
}

export function extractThemes(cards) {
  return [];
}

export function calculateCentroid(positions) {
  return [0, 0, 0];
}

// Export all stubs
export default {
  interpretReading,
  interpretCard,
  generatePostCardQuestions,
  generateMegaSynthesis,
  extractGeometricThemes,
  CARD_EMBEDDINGS,
  getSemanticDistance,
  findNearestCards,
  extractThemes,
  calculateCentroid,
};
