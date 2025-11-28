/**
 * ORACLE LONG-TERM MEMORY SYSTEM
 *
 * Hierarchical memory with intelligent filtering, compression, and retrieval.
 * Solves the LLM memory problem by creating persistent, searchable knowledge.
 *
 * Memory Levels:
 * - SHORT-TERM: Last 5 messages (in-context)
 * - MID-TERM: Session summaries, extracted insights
 * - LONG-TERM: Compressed memories, patterns, key readings
 *
 * Pipeline: Capture → Filter → Compress → Store → Retrieve → Expand
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMORY_STORE_KEY = '@veilpath_oracle_memory';
const MEMORY_INDEX_KEY = '@veilpath_oracle_memory_index';

/**
 * Memory Entry Structure
 */
export class MemoryEntry {
  constructor({
    id = Date.now().toString(),
    type = 'conversation', // 'conversation', 'reading', 'insight', 'pattern'
    timestamp = Date.now(),
    importance = 0.5, // 0-1 scale
    content = {},
    summary = '',
    tags = [],
    linkedReadingId = null,
    accessCount = 0,
    lastAccessed = null
  }) {
    this.id = id;
    this.type = type;
    this.timestamp = timestamp;
    this.importance = importance;
    this.content = content;
    this.summary = summary;
    this.tags = tags;
    this.linkedReadingId = linkedReadingId;
    this.accessCount = accessCount;
    this.lastAccessed = lastAccessed;
  }
}

/**
 * Extract important information from a conversation
 * This is the "Filter" step
 */
export function extractKeyInformation(conversation, userProfile = null) {
  const insights = [];
  const mentions = {
    cards: [],
    topics: [],
    decisions: [],
    emotions: []
  };

  // Extract card mentions
  const cardPattern = /(fool|magician|high priestess|empress|emperor|hierophant|lovers|chariot|strength|hermit|wheel of fortune|justice|hanged man|death|temperance|devil|tower|star|moon|sun|judgement|world|ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king|wands|cups|swords|pentacles)/gi;

  conversation.forEach(msg => {
    const cardMatches = msg.content.match(cardPattern);
    if (cardMatches) {
      mentions.cards.push(...cardMatches.map(c => c.toLowerCase()));
    }
  });

  // Extract topics (keywords that appear multiple times)
  const topicKeywords = [
    'career', 'job', 'work', 'relationship', 'love', 'romance',
    'family', 'health', 'money', 'finance', 'spiritual', 'growth',
    'change', 'decision', 'fear', 'anxiety', 'hope', 'future'
  ];

  topicKeywords.forEach(topic => {
    const count = conversation.reduce((sum, msg) =>
      sum + (msg.content.toLowerCase().match(new RegExp(`\\b${topic}\\b`, 'g')) || []).length
    , 0);
    if (count >= 2) {
      mentions.topics.push(topic);
    }
  });

  // Extract decision-making moments
  const decisionPatterns = [
    /should i (.*?)[?.!]/gi,
    /what if i (.*?)[?.!]/gi,
    /i(?:'m| am) (?:thinking|considering|wondering) (?:about )?(.*?)[?.!]/gi
  ];

  conversation.forEach(msg => {
    if (msg.role === 'user') {
      decisionPatterns.forEach(pattern => {
        const matches = msg.content.match(pattern);
        if (matches) {
          mentions.decisions.push(...matches);
        }
      });
    }
  });

  // Extract emotional content
  const emotionKeywords = {
    fear: ['afraid', 'scared', 'fear', 'anxious', 'worried', 'nervous'],
    hope: ['hope', 'hopeful', 'optimistic', 'excited', 'looking forward'],
    confusion: ['confused', 'lost', 'stuck', 'uncertain', 'don\'t know'],
    determination: ['determined', 'ready', 'committed', 'going to', 'will']
  };

  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    keywords.forEach(kw => {
      if (conversation.some(msg => msg.content.toLowerCase().includes(kw))) {
        if (!mentions.emotions.includes(emotion)) {
          mentions.emotions.push(emotion);
        }
      }
    });
  });

  return {
    insights,
    mentions,
    cardCount: new Set(mentions.cards).size,
    topicCount: mentions.topics.length,
    hasDecisions: mentions.decisions.length > 0,
    emotionalTone: mentions.emotions
  };
}

/**
 * Calculate importance score for a conversation
 * Higher score = more likely to be saved long-term
 */
export function calculateImportance(conversation, extracted) {
  let score = 0.3; // Base score

  // Length factor (longer conversations often more meaningful)
  if (conversation.length >= 10) score += 0.2;
  else if (conversation.length >= 5) score += 0.1;

  // Card mentions (tarot-focused conversations)
  if (extracted.cardCount >= 3) score += 0.2;
  else if (extracted.cardCount >= 1) score += 0.1;

  // Decision-making (important moments)
  if (extracted.hasDecisions) score += 0.2;

  // Multiple topics (depth)
  if (extracted.topicCount >= 3) score += 0.15;
  else if (extracted.topicCount >= 1) score += 0.05;

  // Emotional content (personal significance)
  if (extracted.emotionalTone.length >= 2) score += 0.1;

  return Math.min(score, 1.0);
}

/**
 * Compress a conversation into a summary
 * This is the "Compress" step
 */
export function compressConversation(conversation, extracted) {
  const userMessages = conversation.filter(m => m.role === 'user').length;
  const veraMessages = conversation.filter(m => m.role === 'vera').length;

  const summary = {
    messageCount: conversation.length,
    userMessageCount: userMessages,
    veraMessageCount: veraMessages,
    cards: [...new Set(extracted.mentions.cards)],
    topics: extracted.mentions.topics,
    decisions: extracted.mentions.decisions.slice(0, 3), // Keep top 3 decisions
    emotions: extracted.emotionalTone,
    keyQuotes: extractKeyQuotes(conversation)
  };

  // Generate natural language summary
  const parts = [];

  if (summary.topics.length > 0) {
    parts.push(`Discussed ${summary.topics.join(', ')}`);
  }

  if (summary.cards.length > 0) {
    parts.push(`Mentioned cards: ${summary.cards.slice(0, 5).join(', ')}`);
  }

  if (summary.decisions.length > 0) {
    parts.push(`User considering: ${summary.decisions[0].substring(0, 60)}...`);
  }

  if (summary.emotions.length > 0) {
    parts.push(`Emotional tone: ${summary.emotions.join(', ')}`);
  }

  const textSummary = parts.length > 0
    ? parts.join('. ') + '.'
    : `Conversation about tarot with ${userMessages} user messages.`;

  return {
    structured: summary,
    text: textSummary
  };
}

/**
 * Extract key quotes from conversation (for expansion later)
 */
function extractKeyQuotes(conversation, maxQuotes = 3) {
  const quotes = [];

  // Get Vera's most insightful responses (longest ones tend to be more insightful)
  const veraMessages = conversation
    .filter(m => m.role === 'vera' && !m.isSystem)
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, maxQuotes);

  veraMessages.forEach(msg => {
    // Get first sentence or first 100 chars
    const firstSentence = msg.content.match(/^[^.!?]+[.!?]/);
    if (firstSentence) {
      quotes.push(firstSentence[0].trim());
    } else {
      quotes.push(msg.content.substring(0, 100) + '...');
    }
  });

  return quotes;
}

/**
 * Save a conversation to long-term memory
 * This is the "Store" step
 */
export async function saveToMemory(conversation, userProfile = null, linkedReadingId = null) {
  try {
    // Filter: Extract key information
    const extracted = extractKeyInformation(conversation, userProfile);

    // Calculate importance
    const importance = calculateImportance(conversation, extracted);

    // Skip if not important enough (< 0.4)
    if (importance < 0.4) {
      return null;
    }

    // Compress: Create summary
    const compressed = compressConversation(conversation, extracted);

    // Generate tags for retrieval
    const tags = [
      ...extracted.mentions.topics,
      ...extracted.mentions.cards,
      ...extracted.emotionalTone
    ];

    // Create memory entry
    const memory = new MemoryEntry({
      type: 'conversation',
      timestamp: Date.now(),
      importance: importance,
      content: compressed.structured,
      summary: compressed.text,
      tags: [...new Set(tags)],
      linkedReadingId: linkedReadingId
    });

    // Load existing memories
    const memories = await loadMemories();

    // Add new memory
    memories.push(memory);

    // With 5GB storage, we can keep WAY more memories
    // Prune only if exceeding reasonable limits (10,000 memories)
    // At ~1KB per memory, that's only ~10MB
    if (memories.length > 10000) {

      // Keep high-importance memories + recent memories
      memories.sort((a, b) => {
        // Sort by: importance * recency_factor
        const recencyA = 1 - Math.min((Date.now() - a.timestamp) / (365 * 24 * 60 * 60 * 1000), 1);
        const recencyB = 1 - Math.min((Date.now() - b.timestamp) / (365 * 24 * 60 * 60 * 1000), 1);
        const scoreA = (a.importance * 0.7) + (recencyA * 0.3);
        const scoreB = (b.importance * 0.7) + (recencyB * 0.3);
        return scoreB - scoreA;
      });

      // Keep top 8000 (20% buffer)
      memories.splice(8000);
    }

    // Save to storage
    await AsyncStorage.setItem(MEMORY_STORE_KEY, JSON.stringify(memories));

    // Update index for fast retrieval
    await updateMemoryIndex(memories);

    return memory;
  } catch (error) {
    console.error('[Memory] Error saving to memory:', error);
    return null;
  }
}

/**
 * Load all memories
 */
export async function loadMemories() {
  try {
    const data = await AsyncStorage.getItem(MEMORY_STORE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('[Memory] Error loading memories:', error);
    return [];
  }
}

/**
 * Update memory index for fast tag-based retrieval
 */
async function updateMemoryIndex(memories) {
  const index = {};

  memories.forEach(memory => {
    memory.tags.forEach(tag => {
      if (!index[tag]) {
        index[tag] = [];
      }
      index[tag].push(memory.id);
    });
  });

  await AsyncStorage.setItem(MEMORY_INDEX_KEY, JSON.stringify(index));
}

/**
 * Retrieve relevant memories based on current context
 * This is the "Retrieve" step
 */
export async function retrieveRelevantMemories(currentInput, tags = [], limit = 5) {
  try {
    const memories = await loadMemories();

    // Score each memory for relevance
    const scored = memories.map(memory => {
      let score = 0;

      // Tag matching
      const matchingTags = memory.tags.filter(tag => tags.includes(tag));
      score += matchingTags.length * 0.3;

      // Keyword matching in summary
      const keywords = currentInput.toLowerCase().split(/\s+/);
      keywords.forEach(kw => {
        if (memory.summary.toLowerCase().includes(kw)) {
          score += 0.2;
        }
      });

      // Importance factor
      score += memory.importance * 0.3;

      // Recency factor (recent memories slightly preferred)
      const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) score += 0.1;

      return { memory, score };
    });

    // Sort by score and return top matches
    scored.sort((a, b) => b.score - a.score);
    const relevant = scored.slice(0, limit);

    // Update access tracking
    relevant.forEach(({ memory }) => {
      memory.accessCount++;
      memory.lastAccessed = Date.now();
    });
    await AsyncStorage.setItem(MEMORY_STORE_KEY, JSON.stringify(memories));

    return relevant.map(r => r.memory);
  } catch (error) {
    console.error('[Memory] Error retrieving memories:', error);
    return [];
  }
}

/**
 * Expand a memory into usable context
 * This is the "Expand" step
 */
export function expandMemory(memory) {
  const parts = [];

  parts.push(`[MEMORY from ${new Date(memory.timestamp).toLocaleDateString()}]`);
  parts.push(memory.summary);

  if (memory.content.keyQuotes && memory.content.keyQuotes.length > 0) {
    parts.push(`Key insight: "${memory.content.keyQuotes[0]}"`);
  }

  return parts.join('\n');
}

/**
 * Get memory context for Vera prompt
 * Returns formatted string to inject into system prompt
 */
export async function getMemoryContext(currentInput, tags = []) {
  const relevant = await retrieveRelevantMemories(currentInput, tags, 3);

  if (relevant.length === 0) {
    return '';
  }

  const expanded = relevant.map(expandMemory);

  return `\n\nRELEVANT MEMORIES:\n${expanded.join('\n\n')}`;
}

/**
 * Clear all memories (for reset/debugging)
 */
export async function clearAllMemories() {
  try {
    await AsyncStorage.removeItem(MEMORY_STORE_KEY);
    await AsyncStorage.removeItem(MEMORY_INDEX_KEY);
  } catch (error) {
    console.error('[Memory] Error clearing memories:', error);
  }
}
