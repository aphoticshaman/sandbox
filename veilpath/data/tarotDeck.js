/**
 * COMPLETE TAROT DECK - All 78 Cards
 * Based on Rider-Waite-Smith tradition
 *
 * Card imagery: See docs/RIDER_WAITE_SMITH_IMAGERY.md for how to get images
 */

export const MAJOR_ARCANA = [
  {
    id: 0,
    name: 'The Fool',
    arcana: 'Major',
    suit: null,
    keywords: ['New beginnings', 'Spontaneity', 'Innocence', 'Adventure'],
    upright: {
      meaning: 'New beginnings, spontaneity, innocence, free spirit',
      message: 'A new journey begins. Trust the path ahead, even when you cannot see it. Take the leap of faith.',
    },
    reversed: {
      meaning: 'Recklessness, taken advantage of, inconsideration',
      message: 'Pause before leaping. Not all that glitters is gold. Ground yourself before moving forward.',
    },
  },
  {
    id: 1,
    name: 'The Magician',
    arcana: 'Major',
    suit: null,
    keywords: ['Manifestation', 'Resourcefulness', 'Power', 'Action'],
    upright: {
      meaning: 'Manifestation, resourcefulness, power, inspired action',
      message: 'You have all the tools you need. Your will shapes reality. As above, so below.',
    },
    reversed: {
      meaning: 'Manipulation, poor planning, untapped talents',
      message: 'Talent unused is talent wasted. Check your motives. Are you using your power wisely?',
    },
  },
  {
    id: 2,
    name: 'The High Priestess',
    arcana: 'Major',
    suit: null,
    keywords: ['Intuition', 'Sacred knowledge', 'Divine feminine', 'Subconscious'],
    upright: {
      meaning: 'Intuition, sacred knowledge, divine feminine, the subconscious mind',
      message: 'Listen to your inner voice. The answers lie within. Trust your intuition over logic.',
    },
    reversed: {
      meaning: 'Secrets, disconnected from intuition, withdrawal',
      message: 'Something is hidden. Reconnect with your inner wisdom. Break the silence.',
    },
  },
  {
    id: 3,
    name: 'The Empress',
    arcana: 'Major',
    suit: null,
    keywords: ['Femininity', 'Beauty', 'Nature', 'Abundance'],
    upright: {
      meaning: 'Femininity, beauty, nature, nurturing, abundance',
      message: 'Abundance flows to you. Nurture what you wish to grow. Connect with nature and beauty.',
    },
    reversed: {
      meaning: 'Creative block, dependence on others, smothering',
      message: 'Are you neglecting yourself? Creative energy is blocked. Find balance between giving and receiving.',
    },
  },
  {
    id: 4,
    name: 'The Emperor',
    arcana: 'Major',
    suit: null,
    keywords: ['Authority', 'Structure', 'Control', 'Father figure'],
    upright: {
      meaning: 'Authority, establishment, structure, father figure',
      message: 'Take charge. Build solid foundations. Lead with wisdom and strength.',
    },
    reversed: {
      meaning: 'Domination, excessive control, lack of discipline',
      message: 'Control is an illusion. Soften your grip. True power comes from within, not from domination.',
    },
  },
  {
    id: 5,
    name: 'The Hierophant',
    arcana: 'Major',
    suit: null,
    keywords: ['Spiritual wisdom', 'Tradition', 'Conformity', 'Education'],
    upright: {
      meaning: 'Spiritual wisdom, religious beliefs, conformity, tradition, institutions',
      message: 'Honor tradition, but think for yourself. Seek wisdom from those who came before.',
    },
    reversed: {
      meaning: 'Personal beliefs, freedom, challenging the status quo',
      message: 'Question authority. Create your own path. Your truth may differ from tradition.',
    },
  },
  {
    id: 6,
    name: 'The Lovers',
    arcana: 'Major',
    suit: null,
    keywords: ['Love', 'Harmony', 'Relationships', 'Values alignment'],
    upright: {
      meaning: 'Love, harmony, relationships, values alignment, choices',
      message: 'Love is a choice you make every day. Align your values with your actions. Union brings harmony.',
    },
    reversed: {
      meaning: 'Self-love, disharmony, imbalance, misalignment of values',
      message: 'Love yourself first. Misalignment creates discord. Choose what truly matters to you.',
    },
  },
  {
    id: 7,
    name: 'The Chariot',
    arcana: 'Major',
    suit: null,
    keywords: ['Control', 'Willpower', 'Success', 'Determination'],
    upright: {
      meaning: 'Control, willpower, success, action, determination',
      message: 'Take the reins. Victory comes through focused will. You have the strength to overcome.',
    },
    reversed: {
      meaning: 'Self-discipline, opposition, lack of direction',
      message: 'You are pulling in opposite directions. Find your center. Discipline precedes victory.',
    },
  },
  {
    id: 8,
    name: 'Strength',
    arcana: 'Major',
    suit: null,
    keywords: ['Strength', 'Courage', 'Persuasion', 'Compassion'],
    upright: {
      meaning: 'Strength, courage, persuasion, influence, compassion',
      message: 'True strength is gentle. Tame your inner beast with love, not force. Courage over fear.',
    },
    reversed: {
      meaning: 'Inner strength, self-doubt, low energy, raw emotion',
      message: 'You are stronger than you know. Doubt clouds your power. Find strength within.',
    },
  },
  {
    id: 9,
    name: 'The Hermit',
    arcana: 'Major',
    suit: null,
    keywords: ['Soul-searching', 'Introspection', 'Inner guidance', 'Solitude'],
    upright: {
      meaning: 'Soul-searching, introspection, being alone, inner guidance',
      message: 'Withdraw to find yourself. The answers come in silence. Shine your inner light.',
    },
    reversed: {
      meaning: 'Isolation, loneliness, withdrawal',
      message: 'Isolation becomes prison. Rejoin the world. Share your light with others.',
    },
  },
  {
    id: 10,
    name: 'Wheel of Fortune',
    arcana: 'Major',
    suit: null,
    keywords: ['Good luck', 'Karma', 'Life cycles', 'Destiny'],
    upright: {
      meaning: 'Good luck, karma, life cycles, destiny, a turning point',
      message: 'What goes around comes around. Fortune turns in your favor. Embrace change.',
    },
    reversed: {
      meaning: 'Bad luck, resistance to change, breaking cycles',
      message: 'The wheel turns regardless. Break old patterns. Create your own luck.',
    },
  },
  {
    id: 11,
    name: 'Justice',
    arcana: 'Major',
    suit: null,
    keywords: ['Justice', 'Fairness', 'Truth', 'Cause and effect'],
    upright: {
      meaning: 'Justice, fairness, truth, cause and effect, law',
      message: 'Truth will prevail. Balance is restored. You reap what you sow.',
    },
    reversed: {
      meaning: 'Unfairness, lack of accountability, dishonesty',
      message: 'Imbalance persists. Take accountability. Injustice must be confronted.',
    },
  },
  {
    id: 12,
    name: 'The Hanged Man',
    arcana: 'Major',
    suit: null,
    keywords: ['Pause', 'Surrender', 'Letting go', 'New perspectives'],
    upright: {
      meaning: 'Pause, surrender, letting go, new perspectives',
      message: 'Sometimes you must let go to move forward. See things from a new angle. Surrender brings clarity.',
    },
    reversed: {
      meaning: 'Delays, resistance, stalling, indecision',
      message: 'Resistance prolongs suffering. Stop stalling. Make a decision.',
    },
  },
  {
    id: 13,
    name: 'Death',
    arcana: 'Major',
    suit: null,
    keywords: ['Endings', 'Transformation', 'Transition', 'Letting go'],
    upright: {
      meaning: 'Endings, change, transformation, transition',
      message: 'An ending clears space for new growth. Embrace the transformation. Death is rebirth.',
    },
    reversed: {
      meaning: 'Resistance to change, personal transformation, inner purging',
      message: 'You resist the inevitable. Release what no longer serves. Transformation cannot be stopped.',
    },
  },
  {
    id: 14,
    name: 'Temperance',
    arcana: 'Major',
    suit: null,
    keywords: ['Balance', 'Moderation', 'Patience', 'Purpose'],
    upright: {
      meaning: 'Balance, moderation, patience, purpose',
      message: 'Find the middle way. Patience is a virtue. Mix opposing forces to create harmony.',
    },
    reversed: {
      meaning: 'Imbalance, excess, self-healing, re-alignment',
      message: 'You have lost balance. Excess leads to emptiness. Restore equilibrium.',
    },
  },
  {
    id: 15,
    name: 'The Devil',
    arcana: 'Major',
    suit: null,
    keywords: ['Shadow self', 'Attachment', 'Addiction', 'Restriction'],
    upright: {
      meaning: 'Shadow self, attachment, addiction, restriction, sexuality',
      message: 'Your chains are self-imposed. Face your shadow. Freedom requires confronting your demons.',
    },
    reversed: {
      meaning: 'Releasing limiting beliefs, exploring dark thoughts, detachment',
      message: 'You are breaking free. Release old patterns. The chains fall away.',
    },
  },
  {
    id: 16,
    name: 'The Tower',
    arcana: 'Major',
    suit: null,
    keywords: ['Sudden change', 'Upheaval', 'Chaos', 'Revelation'],
    upright: {
      meaning: 'Sudden change, upheaval, chaos, revelation, awakening',
      message: 'What crumbles was built on shaky ground. Liberation comes through destruction. Truth shatters illusion.',
    },
    reversed: {
      meaning: 'Personal transformation, fear of change, averting disaster',
      message: 'The storm can be weathered. Change is inevitable but survivable. Rebuild on solid ground.',
    },
  },
  {
    id: 17,
    name: 'The Star',
    arcana: 'Major',
    suit: null,
    keywords: ['Hope', 'Faith', 'Purpose', 'Renewal'],
    upright: {
      meaning: 'Hope, faith, purpose, renewal, spirituality',
      message: 'Even in darkness, the stars shine. Your hope illuminates the way. Healing is here.',
    },
    reversed: {
      meaning: 'Lack of faith, despair, self-trust, disconnection',
      message: 'Hope seems lost. Reconnect with your faith. The stars still shine above the clouds.',
    },
  },
  {
    id: 18,
    name: 'The Moon',
    arcana: 'Major',
    suit: null,
    keywords: ['Illusion', 'Fear', 'Anxiety', 'Subconscious'],
    upright: {
      meaning: 'Illusion, fear, anxiety, subconscious, intuition',
      message: 'Not all is as it seems. Trust your intuition through the fog. Face your fears.',
    },
    reversed: {
      meaning: 'Release of fear, repressed emotion, inner confusion',
      message: 'Illusions dissolve. Truth emerges. Your fears lose power in the light.',
    },
  },
  {
    id: 19,
    name: 'The Sun',
    arcana: 'Major',
    suit: null,
    keywords: ['Positivity', 'Fun', 'Warmth', 'Success'],
    upright: {
      meaning: 'Positivity, fun, warmth, success, vitality',
      message: 'Joy is your birthright. Success is assured. Bask in the warmth of this moment.',
    },
    reversed: {
      meaning: 'Inner child, feeling down, overly optimistic',
      message: 'Your light is dimmed. Reconnect with your inner child. Find joy again.',
    },
  },
  {
    id: 20,
    name: 'Judgement',
    arcana: 'Major',
    suit: null,
    keywords: ['Judgement', 'Rebirth', 'Inner calling', 'Absolution'],
    upright: {
      meaning: 'Judgement, rebirth, inner calling, absolution',
      message: 'You are called to rise. Reflection leads to rebirth. Forgive yourself and others.',
    },
    reversed: {
      meaning: 'Self-doubt, inner critic, ignoring the call',
      message: 'You judge yourself too harshly. Answer your inner calling. The past is forgiven.',
    },
  },
  {
    id: 21,
    name: 'The World',
    arcana: 'Major',
    suit: null,
    keywords: ['Completion', 'Integration', 'Accomplishment', 'Travel'],
    upright: {
      meaning: 'Completion, integration, accomplishment, travel',
      message: 'The cycle completes. You have arrived. Celebrate your accomplishment before the next journey begins.',
    },
    reversed: {
      meaning: 'Seeking personal closure, short-cuts, delays',
      message: 'Almost there. Do not take shortcuts now. Complete what you started.',
    },
  },
];

export const MINOR_ARCANA = {
  wands: [
    { id: 22, name: 'Ace of Wands', suit: 'Wands', rank: 'Ace', keywords: ['Inspiration', 'New opportunities', 'Growth'], upright: { meaning: 'Inspiration, new opportunities, growth, potential', message: 'A spark of creative fire. New opportunities ignite. Act on inspiration.' }, reversed: { meaning: 'Emerging ideas, lack of direction, distractions', message: 'The spark struggles. Remove distractions. Focus your creative energy.' } },
    { id: 23, name: 'Two of Wands', suit: 'Wands', rank: '2', keywords: ['Future planning', 'Progress', 'Decisions'], upright: { meaning: 'Future planning, progress, decisions, discovery', message: 'The world is yours to explore. Plan your next move. Bold decisions required.' }, reversed: { meaning: 'Personal goals, inner alignment, fear of unknown', message: 'Fear holds you back. Align with your true desires. Trust yourself.' } },
    { id: 24, name: 'Three of Wands', suit: 'Wands', rank: '3', keywords: ['Progress', 'Expansion', 'Foresight'], upright: { meaning: 'Progress, expansion, foresight, overseas opportunities', message: 'Your efforts bear fruit. Expansion is possible. Look to distant horizons.' }, reversed: { meaning: 'Playing small, lack of foresight, unexpected delays', message: 'You are playing it too safe. Think bigger. Delays teach patience.' } },
    { id: 25, name: 'Four of Wands', suit: 'Wands', rank: '4', keywords: ['Celebration', 'Joy', 'Harmony', 'Relaxation'], upright: { meaning: 'Celebration, joy, harmony, relaxation, homecoming', message: 'Celebrate your victories. Rest in the harmony you have created. Home is where the heart is.' }, reversed: { meaning: 'Personal celebration, inner harmony, conflict with others', message: 'Conflict disrupts peace. Find harmony within first. Celebrate privately.' } },
    { id: 26, name: 'Five of Wands', suit: 'Wands', rank: '5', keywords: ['Conflict', 'Disagreements', 'Competition'], upright: { meaning: 'Conflict, disagreements, competition, tension, diversity', message: 'Healthy competition pushes you forward. Conflict reveals truth. Stand your ground.' }, reversed: { meaning: 'Inner conflict, conflict avoidance, tension release', message: 'The battle is within. Avoiding conflict prolongs it. Seek resolution.' } },
    { id: 27, name: 'Six of Wands', suit: 'Wands', rank: '6', keywords: ['Success', 'Public recognition', 'Progress'], upright: { meaning: 'Success, public recognition, progress, self-confidence', message: 'Victory is yours. Recognition comes. Own your success with humility.' }, reversed: { meaning: 'Private achievement, personal definition of success, fall from grace', message: 'Success is personal. Do not seek external validation. Beware of pride.' } },
    { id: 28, name: 'Seven of Wands', suit: 'Wands', rank: '7', keywords: ['Challenge', 'Competition', 'Protection'], upright: { meaning: 'Challenge, competition, protection, perseverance', message: 'Stand your ground. Protect what you have built. You have the high ground.' }, reversed: { meaning: 'Exhaustion, giving up, overwhelmed', message: 'You are tired of fighting. Choose your battles wisely. Rest is not defeat.' } },
    { id: 29, name: 'Eight of Wands', suit: 'Wands', rank: '8', keywords: ['Movement', 'Fast paced change', 'Action'], upright: { meaning: 'Movement, fast paced change, action, alignment, air travel', message: 'Things accelerate rapidly. Movement brings progress. Strike while the iron is hot.' }, reversed: { meaning: 'Delays, frustration, resisting change, internal alignment', message: 'Momentum stalls. Patience through delays. Align internally before acting.' } },
    { id: 30, name: 'Nine of Wands', suit: 'Wands', rank: '9', keywords: ['Resilience', 'Courage', 'Persistence'], upright: { meaning: 'Resilience, courage, persistence, test of faith, boundaries', message: 'You are battle-worn but not broken. One final push. Your boundaries protect you.' }, reversed: { meaning: 'Inner resources, struggle, overwhelm, defensive', message: 'You cannot do this alone. Drop your defenses. Seek support.' } },
    { id: 31, name: 'Ten of Wands', suit: 'Wands', rank: '10', keywords: ['Burden', 'Extra responsibility', 'Hard work'], upright: { meaning: 'Burden, extra responsibility, hard work, completion', message: 'The burden is heavy but temporary. Completion is near. Delegate when possible.' }, reversed: { meaning: 'Doing it all, carrying the burden, burnt out', message: 'You carry too much. Burnout looms. Release unnecessary burdens.' } },
    { id: 32, name: 'Page of Wands', suit: 'Wands', rank: 'Page', keywords: ['Inspiration', 'Ideas', 'Discovery'], upright: { meaning: 'Inspiration, ideas, discovery, limitless potential, free spirit', message: 'Explore new ideas. Be playful and curious. Potential is limitless.' }, reversed: { meaning: 'Newly formed ideas, redirecting energy, self-limiting beliefs', message: 'Your ideas need refinement. Redirect scattered energy. Believe in yourself.' } },
    { id: 33, name: 'Knight of Wands', suit: 'Wands', rank: 'Knight', keywords: ['Energy', 'Passion', 'Inspired action'], upright: { meaning: 'Energy, passion, inspired action, adventure, impulsiveness', message: 'Act boldly and swiftly. Passion fuels your journey. Adventure calls.' }, reversed: { meaning: 'Passion project, haste, scattered energy, delays', message: 'Haste makes waste. Focus scattered energy. Patience serves you now.' } },
    { id: 34, name: 'Queen of Wands', suit: 'Wands', rank: 'Queen', keywords: ['Courage', 'Confidence', 'Independence'], upright: { meaning: 'Courage, confidence, independence, social butterfly, determination', message: 'Own your power. Be magnetic and bold. Your confidence inspires others.' }, reversed: { meaning: 'Self-respect, self-confidence, introverted, re-establish sense of self', message: 'Reconnect with yourself. Confidence wavers. Rebuild from within.' } },
    { id: 35, name: 'King of Wands', suit: 'Wands', rank: 'King', keywords: ['Natural leader', 'Vision', 'Entrepreneur'], upright: { meaning: 'Natural leader, vision, entrepreneur, honour', message: 'Lead with vision and integrity. Take bold action. Your kingdom awaits.' }, reversed: { meaning: 'Impulsiveness, haste, ruthless, high expectations', message: 'Slow down, leader. Ruthlessness breeds resentment. Temper expectations.' } },
  ],
  cups: [
    { id: 36, name: 'Ace of Cups', suit: 'Cups', rank: 'Ace', keywords: ['Love', 'New relationships', 'Compassion'], upright: { meaning: 'Love, new relationships, compassion, creativity', message: 'Your cup overflows. Love arrives. Open your heart to new emotions.' }, reversed: { meaning: 'Self-love, intuition, repressed emotions', message: 'Fill your own cup first. Emotions are blocked. Turn inward.' } },
    { id: 37, name: 'Two of Cups', suit: 'Cups', rank: '2', keywords: ['Unified love', 'Partnership', 'Mutual attraction'], upright: { meaning: 'Unified love, partnership, mutual attraction', message: 'Two become one. Partnership brings harmony. Love is reciprocated.' }, reversed: { meaning: 'Self-love, break-ups, disharmony, distrust', message: 'Imbalance in partnership. Love yourself first. Restore trust.' } },
    { id: 38, name: 'Three of Cups', suit: 'Cups', rank: '3', keywords: ['Celebration', 'Friendship', 'Creativity'], upright: { meaning: 'Celebration, friendship, creativity, collaborations', message: 'Celebrate with kindred spirits. Friendship nourishes the soul. Create together.' }, reversed: { meaning: 'Independence, alone time, hardcore partying, three\'s a crowd', message: 'Too much of a good thing. Seek solitude. Balance social energy.' } },
    { id: 39, name: 'Four of Cups', suit: 'Cups', rank: '4', keywords: ['Meditation', 'Contemplation', 'Apathy'], upright: { meaning: 'Meditation, contemplation, apathy, reevaluation', message: 'Withdrawn in contemplation. New opportunities go unseen. Look up.' }, reversed: { meaning: 'Retreat, withdrawal, checking in for alignment', message: 'Conscious withdrawal. Realign with your values. Emerge renewed.' } },
    { id: 40, name: 'Five of Cups', suit: 'Cups', rank: '5', keywords: ['Regret', 'Failure', 'Disappointment'], upright: { meaning: 'Regret, failure, disappointment, pessimism', message: 'Mourning what is lost. Two cups still stand. Turn around and see them.' }, reversed: { meaning: 'Personal setbacks, self-forgiveness, moving on', message: 'Forgive yourself. Learn from loss. The time to move on is now.' } },
    { id: 41, name: 'Six of Cups', suit: 'Cups', rank: '6', keywords: ['Revisiting the past', 'Childhood memories', 'Innocence'], upright: { meaning: 'Revisiting the past, childhood memories, innocence, joy', message: 'Nostalgia brings warmth. Your inner child needs attention. Simple joys matter.' }, reversed: { meaning: 'Living in the past, forgiveness, lacking playfulness', message: 'The past holds you captive. Forgive and release. Play more.' } },
    { id: 42, name: 'Seven of Cups', suit: 'Cups', rank: '7', keywords: ['Opportunities', 'Choices', 'Wishful thinking'], upright: { meaning: 'Opportunities, choices, wishful thinking, illusion', message: 'Many paths appear. Not all that glitters is gold. Choose wisely.' }, reversed: { meaning: 'Alignment, personal values, overwhelmed by choices', message: 'Too many choices paralyze. Return to your values. Eliminate illusions.' } },
    { id: 43, name: 'Eight of Cups', suit: 'Cups', rank: '8', keywords: ['Disappointment', 'Abandonment', 'Withdrawal'], upright: { meaning: 'Disappointment, abandonment, withdrawal, escapism', message: 'Walking away from what no longer serves. The journey inward begins. Seek deeper meaning.' }, reversed: { meaning: 'Trying one more time, indecision, aimless drifting, walking away', message: 'Indecision keeps you stuck. Commit or move on. Stop drifting.' } },
    { id: 44, name: 'Nine of Cups', suit: 'Cups', rank: '9', keywords: ['Contentment', 'Satisfaction', 'Gratitude'], upright: { meaning: 'Contentment, satisfaction, gratitude, wish come true', message: 'Your wish is granted. Satisfaction is yours. Count your blessings.' }, reversed: { meaning: 'Inner happiness, materialism, dissatisfaction, indulgence', message: 'Outer success, inner emptiness. True happiness is within. Release attachment.' } },
    { id: 45, name: 'Ten of Cups', suit: 'Cups', rank: '10', keywords: ['Divine love', 'Blissful relationships', 'Harmony'], upright: { meaning: 'Divine love, blissful relationships, harmony, alignment', message: 'Perfect harmony achieved. Emotional fulfillment. This is what matters most.' }, reversed: { meaning: 'Disconnection, misaligned values, struggling relationships', message: 'Harmony is disrupted. Realign your values. Heal family wounds.' } },
    { id: 46, name: 'Page of Cups', suit: 'Cups', rank: 'Page', keywords: ['Creative opportunities', 'Intuitive messages', 'Curiosity'], upright: { meaning: 'Creative opportunities, intuitive messages, curiosity, possibility', message: 'A creative messenger arrives. Trust your intuition. Be curious and playful.' }, reversed: { meaning: 'New ideas, doubting intuition, creative blocks, emotional immaturity', message: 'Doubt blocks intuition. Creative blocks frustrate. Return to playfulness.' } },
    { id: 47, name: 'Knight of Cups', suit: 'Cups', rank: 'Knight', keywords: ['Creativity', 'Romance', 'Charm'], upright: { meaning: 'Creativity, romance, charm, imagination, beauty', message: 'The romantic arrives. Follow your heart. Beauty inspires action.' }, reversed: { meaning: 'Overactive imagination, unrealistic, jealous, moody', message: 'Fantasy clouds reality. Moodiness sabotages connection. Ground your dreams.' } },
    { id: 48, name: 'Queen of Cups', suit: 'Cups', rank: 'Queen', keywords: ['Compassionate', 'Caring', 'Emotionally stable'], upright: { meaning: 'Compassionate, caring, emotionally stable, intuitive, in flow', message: 'Nurture yourself and others. Emotional wisdom flows. Trust your feelings.' }, reversed: { meaning: 'Inner feelings, self-care, self-love, co-dependency', message: 'Fill your own cup. Co-dependency drains. Practice self-care.' } },
    { id: 49, name: 'King of Cups', suit: 'Cups', rank: 'King', keywords: ['Emotionally balanced', 'Compassionate', 'Diplomatic'], upright: { meaning: 'Emotionally balanced, compassionate, diplomatic', message: 'Master your emotions. Lead with compassion. Balance head and heart.' }, reversed: { meaning: 'Self-compassion, inner feelings, moodiness, emotionally manipulative', message: 'Emotional manipulation harms. Moodiness controls you. Show yourself compassion.' } },
  ],
  swords: [
    { id: 50, name: 'Ace of Swords', suit: 'Swords', rank: 'Ace', keywords: ['Breakthroughs', 'New ideas', 'Mental clarity'], upright: { meaning: 'Breakthroughs, new ideas, mental clarity, success', message: 'A breakthrough arrives. Mental clarity cuts through confusion. Truth prevails.' }, reversed: { meaning: 'Inner clarity, re-thinking an idea, clouded judgement', message: 'Confusion clouds judgment. Rethink your position. Clarity comes from within.' } },
    { id: 51, name: 'Two of Swords', suit: 'Swords', rank: '2', keywords: ['Difficult decisions', 'Weighing options', 'Stalemate'], upright: { meaning: 'Difficult decisions, weighing options, an impasse, avoidance', message: 'A difficult choice looms. You cannot remain neutral forever. Remove the blindfold.' }, reversed: { meaning: 'Indecision, confusion, information overload, stalling', message: 'Analysis paralysis. Too much information. Trust your gut.' } },
    { id: 52, name: 'Three of Swords', suit: 'Swords', rank: '3', keywords: ['Heartbreak', 'Emotional pain', 'Sorrow'], upright: { meaning: 'Heartbreak, emotional pain, sorrow, grief, hurt', message: 'Pain pierces the heart. Grief must be felt. This too shall pass.' }, reversed: { meaning: 'Negative self-talk, releasing pain, optimism, forgiveness', message: 'Release the pain. Forgive. Your heart can heal.' } },
    { id: 53, name: 'Four of Swords', suit: 'Swords', rank: '4', keywords: ['Rest', 'Relaxation', 'Meditation'], upright: { meaning: 'Rest, relaxation, meditation, contemplation, recuperation', message: 'Rest is required. Recharge your batteries. Stillness brings clarity.' }, reversed: { meaning: 'Exhaustion, burn-out, deep contemplation, stagnation', message: 'Rest has become stagnation. Time to re-engage. Heal, then rise.' } },
    { id: 54, name: 'Five of Swords', suit: 'Swords', rank: '5', keywords: ['Conflict', 'Disagreements', 'Competition'], upright: { meaning: 'Conflict, disagreements, competition, defeat, winning at all costs', message: 'Hollow victory. At what cost did you win? Choose battles wisely.' }, reversed: { meaning: 'Reconciliation, making amends, past resentment', message: 'Make amends. Release resentment. True victory is peace.' } },
    { id: 55, name: 'Six of Swords', suit: 'Swords', rank: '6', keywords: ['Transition', 'Change', 'Moving on'], upright: { meaning: 'Transition, change, rite of passage, releasing baggage', message: 'You are in transition. Calmer waters ahead. Release old baggage.' }, reversed: { meaning: 'Personal transition, resistance to change, unfinished business', message: 'Resistance prolongs suffering. Finish what you started. Then move on.' } },
    { id: 56, name: 'Seven of Swords', suit: 'Swords', rank: '7', keywords: ['Betrayal', 'Deception', 'Getting away'], upright: { meaning: 'Betrayal, deception, getting away with something, acting strategically', message: 'Not all is honest here. Someone acts in shadows. Be strategic, not deceptive.' }, reversed: { meaning: 'Imposter syndrome, self-deceit, keeping secrets', message: 'You deceive yourself. Imposter syndrome lies. Own your truth.' } },
    { id: 57, name: 'Eight of Swords', suit: 'Swords', rank: '8', keywords: ['Negative thoughts', 'Self-imposed restriction', 'Prisoner'], upright: { meaning: 'Negative thoughts, self-imposed restriction, imprisonment, victim mentality', message: 'You are your own prison. The bindings are loose. Step out.' }, reversed: { meaning: 'Self-limiting beliefs, inner critic, releasing negative thoughts, open to new perspectives', message: 'You break free from mental prison. New perspectives emerge. Silence the critic.' } },
    { id: 58, name: 'Nine of Swords', suit: 'Swords', rank: '9', keywords: ['Anxiety', 'Worry', 'Fear'], upright: { meaning: 'Anxiety, worry, fear, depression, nightmares', message: 'Anxiety overwhelms. Most fears are illusions. Dawn always comes.' }, reversed: { meaning: 'Inner turmoil, deep-seated fears, secrets, releasing worry', message: 'Face your deepest fears. Release worry. The nightmare ends.' } },
    { id: 59, name: 'Ten of Swords', suit: 'Swords', rank: '10', keywords: ['Painful endings', 'Deep wounds', 'Betrayal'], upright: { meaning: 'Painful endings, deep wounds, betrayal, loss, crisis', message: 'Rock bottom. The only way is up. An ending clears the way.' }, reversed: { meaning: 'Recovery, regeneration, resisting an inevitable end', message: 'You resist the inevitable. Acceptance brings peace. Recovery begins.' } },
    { id: 60, name: 'Page of Swords', suit: 'Swords', rank: 'Page', keywords: ['New ideas', 'Curiosity', 'Thirst for knowledge'], upright: { meaning: 'New ideas, curiosity, thirst for knowledge, new ways of communicating', message: 'Curious and clever. Ask questions. New ideas spark.' }, reversed: { meaning: 'Self-expression, all talk and no action, haphazard action, haste', message: 'All talk, no action. Haste makes waste. Think before speaking.' } },
    { id: 61, name: 'Knight of Swords', suit: 'Swords', rank: 'Knight', keywords: ['Ambitious', 'Action-oriented', 'Driven'], upright: { meaning: 'Ambitious, action-oriented, driven to succeed, fast-thinking', message: 'Swift action. Charge ahead. Your ambition drives success.' }, reversed: { meaning: 'Restless, unfocused, impulsive, burn-out', message: 'Reckless haste. Unfocused energy wastes effort. Slow down.' } },
    { id: 62, name: 'Queen of Swords', suit: 'Swords', rank: 'Queen', keywords: ['Independent', 'Unbiased judgement', 'Clear boundaries'], upright: { meaning: 'Independent, unbiased judgement, clear boundaries, direct communication', message: 'Speak your truth clearly. Set boundaries. Think with your head.' }, reversed: { meaning: 'Overly-emotional, easily influenced, bitchy, cold-hearted', message: 'Coldness pushes others away. Soften your edges. Balance heart and mind.' } },
    { id: 63, name: 'King of Swords', suit: 'Swords', rank: 'King', keywords: ['Mental clarity', 'Intellectual power', 'Authority'], upright: { meaning: 'Mental clarity, intellectual power, authority, truth', message: 'Rule with logic and truth. Mental mastery achieved. Speak with authority.' }, reversed: { meaning: 'Quiet power, inner truth, misuse of power, manipulation', message: 'Power corrupts. Manipulation backfires. Wield truth responsibly.' } },
  ],
  pentacles: [
    { id: 64, name: 'Ace of Pentacles', suit: 'Pentacles', rank: 'Ace', keywords: ['New financial opportunity', 'Manifestation', 'Abundance'], upright: { meaning: 'A new financial or career opportunity, manifestation, abundance', message: 'Seeds of prosperity planted. Opportunity knocks. Ground your dreams in reality.' }, reversed: { meaning: 'Lost opportunity, lack of planning and foresight', message: 'Opportunity slips away. Plan better. Practical action required.' } },
    { id: 65, name: 'Two of Pentacles', suit: 'Pentacles', rank: '2', keywords: ['Multiple priorities', 'Time management', 'Prioritization'], upright: { meaning: 'Multiple priorities, time management, prioritization, adaptability', message: 'Juggling many things. Find balance. Adaptability is key.' }, reversed: { meaning: 'Over-committed, disorganization, reprioritization', message: 'You have taken on too much. Reorganize. Drop what does not serve.' } },
    { id: 66, name: 'Three of Pentacles', suit: 'Pentacles', rank: '3', keywords: ['Teamwork', 'Collaboration', 'Learning'], upright: { meaning: 'Teamwork, collaboration, learning, implementation', message: 'Work together. Your skills complement each other. Mastery through practice.' }, reversed: { meaning: 'Disharmony, misalignment, working alone', message: 'The team is out of sync. Work alone if necessary. Realign goals.' } },
    { id: 67, name: 'Four of Pentacles', suit: 'Pentacles', rank: '4', keywords: ['Saving money', 'Security', 'Conservatism'], upright: { meaning: 'Saving money, security, conservatism, scarcity, control', message: 'Hold tight to what you have. Security through saving. Beware of greed.' }, reversed: { meaning: 'Over-spending, greed, self-protection', message: 'Greed creates scarcity. Let go to receive more. Generosity flows.' } },
    { id: 68, name: 'Five of Pentacles', suit: 'Pentacles', rank: '5', keywords: ['Financial loss', 'Poverty', 'Lack'], upright: { meaning: 'Financial loss, poverty, lack mindset, isolation, worry', message: 'Hard times test you. Help is available. Look for the light.' }, reversed: { meaning: 'Recovery from financial loss, spiritual poverty', message: 'Recovery begins. Spiritual wealth matters more. The tide turns.' } },
    { id: 69, name: 'Six of Pentacles', suit: 'Pentacles', rank: '6', keywords: ['Giving', 'Receiving', 'Sharing wealth'], upright: { meaning: 'Giving, receiving, sharing wealth, generosity, charity', message: 'Give and receive freely. Generosity returns tenfold. Balance the scales.' }, reversed: { meaning: 'Self-care, unpaid debts, one-sided charity', message: 'Charity becomes enabling. Debts unpaid. Give to yourself first.' } },
    { id: 70, name: 'Seven of Pentacles', suit: 'Pentacles', rank: '7', keywords: ['Long-term view', 'Sustainable results', 'Perseverance'], upright: { meaning: 'Long-term view, sustainable results, perseverance, investment', message: 'Patience yields results. Your investment grows. Trust the process.' }, reversed: { meaning: 'Lack of long-term vision, limited success or reward', message: 'Short-term thinking limits growth. Reevaluate your strategy. Patience wanes.' } },
    { id: 71, name: 'Eight of Pentacles', suit: 'Pentacles', rank: '8', keywords: ['Apprenticeship', 'Skill development', 'Quality'], upright: { meaning: 'Apprenticeship, repetitive tasks, mastery, skill development', message: 'Master your craft. Repetition builds skill. Quality over quantity.' }, reversed: { meaning: 'Self-development, perfectionism, misdirected activity', message: 'Perfectionism paralyzes. Work smarter, not harder. Develop yourself.' } },
    { id: 72, name: 'Nine of Pentacles', suit: 'Pentacles', rank: '9', keywords: ['Abundance', 'Luxury', 'Self-sufficiency'], upright: { meaning: 'Abundance, luxury, self-sufficiency, financial independence', message: 'Enjoy the fruits of your labor. Independence achieved. You have enough.' }, reversed: { meaning: 'Self-worth, over-investment in work, hustling', message: 'Worth is not productivity. Stop hustling. You are enough.' } },
    { id: 73, name: 'Ten of Pentacles', suit: 'Pentacles', rank: '10', keywords: ['Wealth', 'Financial security', 'Family'], upright: { meaning: 'Wealth, financial security, family, long-term success, contribution', message: 'Generational wealth. Legacy secured. Family bonds strengthen.' }, reversed: { meaning: 'The dark side of wealth, financial failure, loneliness', message: 'Money cannot buy happiness. Family discord. Reconnect with what matters.' } },
    { id: 74, name: 'Page of Pentacles', suit: 'Pentacles', rank: 'Page', keywords: ['Manifestation', 'Financial opportunity', 'Skill development'], upright: { meaning: 'Manifestation, financial opportunity, new job, skill development', message: 'New opportunity to learn. Manifestation begins. Stay practical.' }, reversed: { meaning: 'Lack of progress, procrastination, learn from failure', message: 'Procrastination blocks progress. Learn from mistakes. Take action.' } },
    { id: 75, name: 'Knight of Pentacles', suit: 'Pentacles', rank: 'Knight', keywords: ['Hard work', 'Productivity', 'Routine'], upright: { meaning: 'Hard work, productivi ty, routine, conservatism, perfectionism', message: 'Steady progress. Hard work pays off. Consistency is key.' }, reversed: { meaning: 'Self-discipline, boredom, feeling stuck, perfectionism', message: 'Stuck in routine. Boredom stifles creativity. Perfection is impossible.' } },
    { id: 76, name: 'Queen of Pentacles', suit: 'Pentacles', rank: 'Queen', keywords: ['Nurturing', 'Practical', 'Down-to-earth'], upright: { meaning: 'Nurturing, practical, providing financially, a working parent', message: 'Nurture with practicality. Abundance through care. Ground yourself.' }, reversed: { meaning: 'Financial independence, self-care, work-home conflict', message: 'Work-life imbalance. Neglecting self-care. Find equilibrium.' } },
    { id: 77, name: 'King of Pentacles', suit: 'Pentacles', rank: 'King', keywords: ['Wealth', 'Business', 'Leadership'], upright: { meaning: 'Wealth, business, leadership, security, discipline, abundance', message: 'Master of the material realm. Build your empire. Lead with prosperity.' }, reversed: { meaning: 'Financially inept, obsessed with wealth, stubborn, greedy', message: 'Obsession corrupts. Stubbornness limits growth. Money is not everything.' } },
  ],
};

// Flatten all cards into single array
export const ALL_TAROT_CARDS = [
  ...MAJOR_ARCANA,
  ...MINOR_ARCANA.wands,
  ...MINOR_ARCANA.cups,
  ...MINOR_ARCANA.swords,
  ...MINOR_ARCANA.pentacles,
];

// Helper functions
export const getCardById = (id) => ALL_TAROT_CARDS.find(card => card.id === id);
export const getCardByName = (name) => ALL_TAROT_CARDS.find(card => card.name === name);
export const getRandomCard = () => ALL_TAROT_CARDS[Math.floor(Math.random() * ALL_TAROT_CARDS.length)];
export const getRandomCards = (count) => {
  const shuffled = [...ALL_TAROT_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
export const getMajorArcana = () => MAJOR_ARCANA;
export const getMinorArcana = () => Object.values(MINOR_ARCANA).flat();
export const getSuit = (suitName) => MINOR_ARCANA[suitName.toLowerCase()];
