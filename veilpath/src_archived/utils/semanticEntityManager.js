/**
 * SEMANTIC ENTITY MANAGER
 *
 * Manages user's personal semantic space with custom entities:
 * - Cards (from readings)
 * - Emotions (joy, fear, anxiety, hope, etc.)
 * - People (from user's life)
 * - Objects (meaningful items)
 * - Concepts (career, love, spirituality, etc.)
 * - Themes (extracted from reading patterns)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateEmbeddings } from '../services/cloudAPIService';

const ENTITIES_KEY = '@lunatiq_semantic_entities';
const ENTITY_HISTORY_KEY = '@lunatiq_entity_history';

// Entity categories with colors
export const ENTITY_CATEGORIES = {
  card: { name: 'Card', color: '#FF00FF', icon: '🃏' },
  emotion: { name: 'Emotion', color: '#00FFFF', icon: '💫' },
  person: { name: 'Person', color: '#00FF00', icon: '👤' },
  object: { name: 'Object', color: '#FFFF00', icon: '🔮' },
  concept: { name: 'Concept', color: '#FF6600', icon: '💭' },
  theme: { name: 'Theme', color: '#9933FF', icon: '🌟' },
  place: { name: 'Place', color: '#FF0066', icon: '📍' },
  goal: { name: 'Goal', color: '#33FF99', icon: '🎯' }
};

/**
 * Load all user entities
 */
export async function loadEntities() {
  try {
    const data = await AsyncStorage.getItem(ENTITIES_KEY);
    if (!data) return [];

    const entities = JSON.parse(data);
    console.log(`[SemanticSpace] Loaded ${entities.length} entities`);
    return entities;
  } catch (error) {
    console.error('[SemanticSpace] Error loading entities:', error);
    return [];
  }
}

/**
 * Save entities
 */
export async function saveEntities(entities) {
  try {
    await AsyncStorage.setItem(ENTITIES_KEY, JSON.stringify(entities));
    console.log(`[SemanticSpace] Saved ${entities.length} entities`);
    return true;
  } catch (error) {
    console.error('[SemanticSpace] Error saving entities:', error);
    return false;
  }
}

/**
 * Add new entity to semantic space
 */
export async function addEntity(text, category, context = {}) {
  try {
    // Generate embedding for this entity
    const result = await generateEmbeddings([{ text, category }], context);

    if (result.error) {
      throw new Error(result.error);
    }

    const embedding = result.embeddings[0];

    // Load existing entities
    const entities = await loadEntities();

    // Check for duplicates
    const existing = entities.find(e =>
      e.text.toLowerCase() === text.toLowerCase() &&
      e.category === category
    );

    if (existing) {
      // Update position with new embedding
      existing.position = embedding.position;
      existing.reasoning = embedding.reasoning;
      existing.updatedAt = Date.now();
      await saveEntities(entities);
      return existing;
    }

    // Create new entity
    const newEntity = {
      id: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      position: embedding.position,
      reasoning: embedding.reasoning,
      color: ENTITY_CATEGORIES[category]?.color || '#FFFFFF',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visits: 0,
      fromReading: context.fromReading || null
    };

    entities.push(newEntity);
    await saveEntities(entities);

    // Track in history
    await trackEntityHistory('add', newEntity);

    console.log(`[SemanticSpace] Added entity: ${text} (${category}) at ${embedding.position.map(v => v.toFixed(2)).join(', ')}`);

    return newEntity;
  } catch (error) {
    console.error('[SemanticSpace] Error adding entity:', error);
    throw error;
  }
}

/**
 * Add multiple entities at once (batch)
 */
export async function addEntities(entityList, context = {}) {
  try {
    // Generate embeddings in batch
    const result = await generateEmbeddings(entityList, context);

    if (result.error) {
      throw new Error(result.error);
    }

    const existingEntities = await loadEntities();
    const newEntities = [];

    result.embeddings.forEach((embedding, i) => {
      const { text, category } = entityList[i];

      // Check for duplicates
      const existing = existingEntities.find(e =>
        e.text.toLowerCase() === text.toLowerCase() &&
        e.category === category
      );

      if (existing) {
        // Update existing
        existing.position = embedding.position;
        existing.reasoning = embedding.reasoning;
        existing.updatedAt = Date.now();
      } else {
        // Create new
        const newEntity = {
          id: `${category}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          text,
          category,
          position: embedding.position,
          reasoning: embedding.reasoning,
          color: ENTITY_CATEGORIES[category]?.color || '#FFFFFF',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          visits: 0,
          fromReading: context.fromReading || null
        };
        newEntities.push(newEntity);
      }
    });

    const allEntities = [...existingEntities, ...newEntities];
    await saveEntities(allEntities);

    console.log(`[SemanticSpace] Added ${newEntities.length} new entities, updated ${result.embeddings.length - newEntities.length}`);

    return { added: newEntities, updated: result.embeddings.length - newEntities.length };
  } catch (error) {
    console.error('[SemanticSpace] Error adding entities:', error);
    throw error;
  }
}

/**
 * Remove entity
 */
export async function removeEntity(entityId) {
  try {
    const entities = await loadEntities();
    const filtered = entities.filter(e => e.id !== entityId);

    if (filtered.length === entities.length) {
      return false; // Entity not found
    }

    await saveEntities(filtered);

    const removed = entities.find(e => e.id === entityId);
    await trackEntityHistory('remove', removed);

    console.log(`[SemanticSpace] Removed entity: ${removed.text}`);
    return true;
  } catch (error) {
    console.error('[SemanticSpace] Error removing entity:', error);
    return false;
  }
}

/**
 * Visit entity (increment visit counter)
 */
export async function visitEntity(entityId) {
  try {
    const entities = await loadEntities();
    const entity = entities.find(e => e.id === entityId);

    if (entity) {
      entity.visits = (entity.visits || 0) + 1;
      entity.lastVisit = Date.now();
      await saveEntities(entities);
      await trackEntityHistory('visit', entity);
    }
  } catch (error) {
    console.error('[SemanticSpace] Error visiting entity:', error);
  }
}

/**
 * Get entities by category
 */
export async function getEntitiesByCategory(category) {
  const entities = await loadEntities();
  return entities.filter(e => e.category === category);
}

/**
 * Find nearby entities (within distance threshold)
 */
export function findNearbyEntities(position, entities, maxDistance = 0.3) {
  return entities
    .map(entity => ({
      entity,
      distance: calculateDistance(position, entity.position)
    }))
    .filter(({ distance }) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate Euclidean distance between two 3D points
 */
export function calculateDistance(pos1, pos2) {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Find entity clusters (groups of nearby entities)
 */
export function findClusters(entities, maxClusterDistance = 0.4) {
  const clusters = [];
  const visited = new Set();

  entities.forEach((entity, i) => {
    if (visited.has(i)) return;

    const cluster = [entity];
    visited.add(i);

    entities.forEach((other, j) => {
      if (i === j || visited.has(j)) return;

      const distance = calculateDistance(entity.position, other.position);
      if (distance <= maxClusterDistance) {
        cluster.push(other);
        visited.add(j);
      }
    });

    if (cluster.length >= 2) {
      // Calculate cluster centroid
      const centroid = [0, 0, 0];
      cluster.forEach(e => {
        centroid[0] += e.position[0];
        centroid[1] += e.position[1];
        centroid[2] += e.position[2];
      });
      centroid[0] /= cluster.length;
      centroid[1] /= cluster.length;
      centroid[2] /= cluster.length;

      clusters.push({
        entities: cluster,
        centroid,
        size: cluster.length
      });
    }
  });

  return clusters;
}

/**
 * Track entity history for analytics
 */
async function trackEntityHistory(action, entity) {
  try {
    const historyData = await AsyncStorage.getItem(ENTITY_HISTORY_KEY);
    const history = historyData ? JSON.parse(historyData) : [];

    history.push({
      action,
      entityId: entity.id,
      entityText: entity.text,
      entityCategory: entity.category,
      timestamp: Date.now()
    });

    // Keep last 1000 events
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    await AsyncStorage.setItem(ENTITY_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[SemanticSpace] Error tracking history:', error);
  }
}

/**
 * Extract potential entities from text (reading intentions, Oracle chat, etc.)
 */
export function extractPotentialEntities(text) {
  const suggestions = [];

  // Common emotion keywords
  const emotions = ['fear', 'anxiety', 'hope', 'joy', 'love', 'anger', 'sadness', 'excitement',
                   'worry', 'peace', 'stress', 'happiness', 'grief', 'shame', 'guilt', 'pride'];
  emotions.forEach(emotion => {
    if (text.toLowerCase().includes(emotion)) {
      suggestions.push({ text: emotion, category: 'emotion', confidence: 0.9 });
    }
  });

  // Abstract concepts
  const concepts = ['career', 'relationship', 'family', 'money', 'health', 'spirituality',
                   'creativity', 'growth', 'change', 'stability', 'freedom', 'security'];
  concepts.forEach(concept => {
    if (text.toLowerCase().includes(concept)) {
      suggestions.push({ text: concept, category: 'concept', confidence: 0.8 });
    }
  });

  // Goals (look for "I want", "I need", "I hope to")
  const goalPatterns = [
    /I want (?:to )?([a-z ]{3,30})/gi,
    /I need (?:to )?([a-z ]{3,30})/gi,
    /I hope to ([a-z ]{3,30})/gi,
    /achieve ([a-z ]{3,30})/gi
  ];
  goalPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      suggestions.push({ text: match[1].trim(), category: 'goal', confidence: 0.7 });
    }
  });

  return suggestions;
}

/**
 * Clear all entities (for testing or reset)
 */
export async function clearAllEntities() {
  try {
    await AsyncStorage.removeItem(ENTITIES_KEY);
    await AsyncStorage.removeItem(ENTITY_HISTORY_KEY);
    console.log('[SemanticSpace] Cleared all entities');
    return true;
  } catch (error) {
    console.error('[SemanticSpace] Error clearing entities:', error);
    return false;
  }
}
