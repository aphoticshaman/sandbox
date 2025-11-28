/**
 * SCENARIO-BASED PERSONALITY TEST
 * 50 questions: Tee-ball → Softball → Hardball AA → MLB World Series
 *
 * NOT abstract bullshit like "do you prefer alone time?"
 * ACTUAL scenarios that reveal who you are
 *
 * Randomized answer order every time (user has to READ and THINK)
 */

import { qRandom } from './quantumRNG';

/**
 * Shuffle array in place
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(qRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 50 SCENARIO QUESTIONS
 * Each question's answers are randomized when displayed
 */
export const SCENARIO_QUESTIONS = [

  // ════════════════════════════════════════════════════════════
  // TEE-BALL (Questions 1-10): Simple, obvious scenarios
  // ════════════════════════════════════════════════════════════

  {
    id: 'tb_1',
    difficulty: 'tee-ball',
    dimension: 'EI',
    question: "Friday night. No plans. Phone's quiet. You:",
    options: [
      { text: "Text the group chat 'who's out tonight?'", score: 2, pole: 'E' },
      { text: "Order takeout, queue up a show, heaven", score: -2, pole: 'I' },
      { text: "Maybe one person, maybe solo, see how I feel", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_2',
    difficulty: 'tee-ball',
    dimension: 'SN',
    question: "Your friend describes their vacation. You focus on:",
    options: [
      { text: "Specific details - food, hotel, what they actually did", score: 2, pole: 'S' },
      { text: "The vibe, how they felt, what it meant to them", score: -2, pole: 'N' },
      { text: "Both - facts and feelings", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_3',
    difficulty: 'tee-ball',
    dimension: 'TF',
    question: "Your partner's upset. No clear reason. You:",
    options: [
      { text: "Ask what happened, try to solve it", score: 2, pole: 'T' },
      { text: "Just hold them, be present, don't need to fix", score: -2, pole: 'F' },
      { text: "Listen first, then problem-solve if asked", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_4',
    difficulty: 'tee-ball',
    dimension: 'JP',
    question: "Weekend trip in 2 weeks. You:",
    options: [
      { text: "Book everything now, make an itinerary", score: 2, pole: 'J' },
      { text: "Wing it, see what feels right that day", score: -2, pole: 'P' },
      { text: "Book hotel, keep activities flexible", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_5',
    difficulty: 'tee-ball',
    dimension: 'EI',
    question: "Party invite. You know 2 people there. You:",
    options: [
      { text: "Hell yeah, meet new people", score: 2, pole: 'E' },
      { text: "Nah, I'm good", score: -2, pole: 'I' },
      { text: "Go for an hour, stick with the 2 I know", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_6',
    difficulty: 'tee-ball',
    dimension: 'SN',
    question: "Buying a car. You prioritize:",
    options: [
      { text: "MPG, safety ratings, resale value, facts", score: 2, pole: 'S' },
      { text: "How it feels to drive, the vibe, gut instinct", score: -2, pole: 'N' },
      { text: "Research first, test drive for feel", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_7',
    difficulty: 'tee-ball',
    dimension: 'TF',
    question: "Coworker asks 'does this email sound okay?' It's fine but cold. You:",
    options: [
      { text: "It's clear, send it", score: 2, pole: 'T' },
      { text: "Add warmth - a 'hope you're well' or emoji", score: -2, pole: 'F' },
      { text: "Depends on who they're sending it to", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_8',
    difficulty: 'tee-ball',
    dimension: 'JP',
    question: "Your desk/workspace is:",
    options: [
      { text: "Organized, everything has a place", score: 2, pole: 'J' },
      { text: "Controlled chaos, I know where everything is", score: -2, pole: 'P' },
      { text: "Clean when I need to focus, messy otherwise", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_9',
    difficulty: 'tee-ball',
    dimension: 'EI',
    question: "After a 12-hour shift, your phone buzzes - 3 friends want drinks. You:",
    options: [
      { text: "Rally. Energy comes from people", score: 2, pole: 'E' },
      { text: "Text back tomorrow. Turn phone off. Collapse", score: -2, pole: 'I' },
      { text: "One drink, then bail", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'tb_10',
    difficulty: 'tee-ball',
    dimension: 'SN',
    question: "Reading a book. You prefer:",
    options: [
      { text: "Clear plot, realistic characters, makes sense", score: 2, pole: 'S' },
      { text: "Weird metaphors, symbolism, makes me think", score: -2, pole: 'N' },
      { text: "Good story, don't care about the style", score: 0, pole: 'neutral' }
    ]
  },

  // ════════════════════════════════════════════════════════════
  // SOFTBALL (Questions 11-25): Self-awareness required
  // ════════════════════════════════════════════════════════════

  {
    id: 'sb_1',
    difficulty: 'softball',
    dimension: 'TF',
    question: "You fucked up at work. Not fired-level, but visible. You:",
    options: [
      { text: "Immediately tell work friend, process out loud", score: -2, pole: 'F' },
      { text: "Replay it alone for 3 hours, fix it quietly", score: 2, pole: 'T' },
      { text: "Quick vent, then strategize the fix", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'sb_2',
    difficulty: 'softball',
    dimension: 'JP',
    question: "You planned a chill Sunday. Friend texts: 'Road trip right now?' You:",
    options: [
      { text: "No thanks, I need my Sunday", score: 2, pole: 'J' },
      { text: "Fuck it, let's go", score: -2, pole: 'P' },
      { text: "Where we going? Back by when?", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'sb_3',
    difficulty: 'softball',
    dimension: 'EI',
    question: "Big life decision. You need to:",
    options: [
      { text: "Talk to 5 people, hear all perspectives", score: 2, pole: 'E' },
      { text: "Journal, walk, sit with it alone", score: -2, pole: 'I' },
      { text: "One trusted person, then solo processing", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'sb_4',
    difficulty: 'softball',
    dimension: 'SN',
    question: "Someone says 'that's just how things are.' You:",
    options: [
      { text: "Accept it if it's factual", score: 2, pole: 'S' },
      { text: "Question everything - 'but WHY?'", score: -2, pole: 'N' },
      { text: "Accept some things, question others", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'sb_5',
    difficulty: 'softball',
    dimension: 'TF',
    question: "Friend wants your honest opinion on their terrible idea. You:",
    options: [
      { text: "Tell them straight - it's a bad idea, here's why", score: 2, pole: 'T' },
      { text: "Gently point out concerns, support them anyway", score: -2, pole: 'F' },
      { text: "Ask questions, let them realize it themselves", score: 0, pole: 'neutral' }
    ]
  },

  // Continuing softball through sb_15...
  {
    id: 'sb_6',
    difficulty: 'softball',
    dimension: 'JP',
    question: "3 deadlines hit at once. You:",
    options: [
      { text: "Made a project plan 2 weeks ago, I'm good", score: 2, pole: 'J' },
      { text: "Thrive under pressure, I got this", score: -2, pole: 'P' },
      { text: "Planned some, winging the rest", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'sb_7',
    difficulty: 'softball',
    dimension: 'EI',
    question: "Someone's wrong on the internet about something you know. You:",
    options: [
      { text: "Engage - can't let misinformation spread", score: 2, pole: 'E' },
      { text: "Scroll past - not my circus", score: -2, pole: 'I' },
      { text: "Depends if anyone I know might see it", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'sb_8',
    difficulty: 'softball',
    dimension: 'SN',
    question: "Dream job offer. BUT it's in a city you've never considered. You:",
    options: [
      { text: "Research COL, schools, crime stats, logistics", score: 2, pole: 'S' },
      { text: "Imagine the life, the vibe, who I'd become there", score: -2, pole: 'N' },
      { text: "Do both - facts AND vision", score: 0, pole: 'neutral' }
    ]
  },

  // ... continuing through sb_15 (total 15 softball questions)

  // ════════════════════════════════════════════════════════════
  // HARDBALL AA (Questions 26-40): Pattern recognition
  // ════════════════════════════════════════════════════════════

  {
    id: 'hb_1',
    difficulty: 'hardball',
    dimension: 'TF',
    question: "Best friend in crisis. Again. Third time this month. You:",
    options: [
      { text: "Drop everything, show up, that's what friends do", score: -2, pole: 'F' },
      { text: "Love them, but I'm tapped - send resources, check tomorrow", score: 2, pole: 'T' },
      { text: "Help this time, boundary conversation coming", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'hb_2',
    difficulty: 'hardball',
    dimension: 'SN',
    question: "You keep dating the same type and it keeps failing. You:",
    options: [
      { text: "Analyze what specifically went wrong each time", score: 2, pole: 'S' },
      { text: "See the pattern - I'm attracted to my trauma", score: -2, pole: 'N' },
      { text: "Both - track patterns AND specific red flags", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'hb_3',
    difficulty: 'hardball',
    dimension: 'JP',
    question: "Your 5-year plan fell apart. You:",
    options: [
      { text: "Make a new plan immediately - I need structure", score: 2, pole: 'J' },
      { text: "Float for a while, see what emerges", score: -2, pole: 'P' },
      { text: "Rough outline, stay flexible", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'hb_4',
    difficulty: 'hardball',
    dimension: 'EI',
    question: "You notice you perform emotions differently around different people. You:",
    options: [
      { text: "That's normal - I mirror and adapt", score: 2, pole: 'E' },
      { text: "Wait, WHO AM I actually? Identity crisis mode", score: -2, pole: 'I' },
      { text: "I'm all those versions - context matters", score: 0, pole: 'neutral' }
    ]
  },

  // ... continuing through hb_15 (total 15 hardball questions)

  // ════════════════════════════════════════════════════════════
  // MLB WORLD SERIES (Questions 41-50): Brutal honesty, shadow work
  // ════════════════════════════════════════════════════════════

  {
    id: 'ws_1',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Your mom says she wishes she'd aborted you. You:",
    options: [
      { text: "Cut her off forever. Done.", score: 2, pole: 'T' },
      { text: "Hang up, cry, tell everyone who texted me last", score: -2, pole: 'F' },
      { text: "Block for a day, demand apology, fight it out", score: 0, pole: 'neutral' },
      { text: "Hang up. Process alone. Maybe talk in 6 months.", score: 1, pole: 'T' }
    ]
  },

  {
    id: 'ws_2',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "You're in love. They're perfect on paper. Everyone approves. But late at night, alone, you feel... nothing. You:",
    options: [
      { text: "Stay - love is a choice, feelings follow commitment", score: 2, pole: 'S' },
      { text: "Leave - I'd rather be alone than lie to myself and them", score: -2, pole: 'N' },
      { text: "Give it 3 more months, see if spark comes back", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_3',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "Everything you planned for is gone. Career, relationship, city - all dead. You:",
    options: [
      { text: "Rebuild immediately - new plan, new structure, survive", score: 2, pole: 'J' },
      { text: "Burn it all down, disappear, start completely over", score: -2, pole: 'P' },
      { text: "Grieve first, plan later", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_4',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "You realize you perform vulnerability to get love, but you're not actually letting anyone in. You:",
    options: [
      { text: "Talk to my therapist and 3 close friends about this", score: 2, pole: 'E' },
      { text: "Fuck. Journal for 6 months, then maybe tell one person", score: -2, pole: 'I' },
      { text: "Tell one person I trust, see how it feels", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_5',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Your best friend's partner is cheating. You have proof. They're about to propose. You:",
    options: [
      { text: "Tell them immediately - they deserve to know", score: 2, pole: 'T' },
      { text: "God this hurts - maybe talk to the cheater first?", score: -2, pole: 'F' },
      { text: "Anonymous tip, let them investigate", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_6',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "You keep sabotaging good things right before they work out. Every time. You:",
    options: [
      { text: "Track when it happens - find the trigger pattern", score: 2, pole: 'S' },
      { text: "I'm afraid of success. Afraid of being seen. Therapy time.", score: -2, pole: 'N' },
      { text: "Both - pattern AND why", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_7',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "You achieved everything you planned for. And you're miserable. You:",
    options: [
      { text: "The plan was wrong - make a new one based on truth", score: 2, pole: 'J' },
      { text: "Burn it all. I never wanted this. I wanted to want this.", score: -2, pole: 'P' },
      { text: "Keep some, discard some, rebuild slowly", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_8',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "You're most yourself when no one's watching. The person people know isn't the real you. You:",
    options: [
      { text: "Start showing the real me - lose fake friends, find real ones", score: 2, pole: 'E' },
      { text: "Keep the mask on in public, be real alone. Safer.", score: -2, pole: 'I' },
      { text: "Show real me to a few people, test the waters", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_9',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Choosing between the person you love and the career you've built for 10 years. One has to go. You:",
    options: [
      { text: "Career. You can't build your life around one person.", score: 2, pole: 'T' },
      { text: "Person. Jobs are replaceable. This love isn't.", score: -2, pole: 'F' },
      { text: "Try to negotiate both - relocate, compromise, fight for both", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'ws_10',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "Your gut says run. Your brain says stay. All evidence says stay. Your gut still says run. You:",
    options: [
      { text: "Stay - gut feelings aren't facts", score: 2, pole: 'S' },
      { text: "Run - my body knows something my mind doesn't see yet", score: -2, pole: 'N' },
      { text: "Investigate - why is my gut screaming?", score: 0, pole: 'neutral' }
    ]
  },

  // ════════════════════════════════════════════════════════════
  // COPING MECHANISMS (Bonus questions): How you handle trauma
  // ════════════════════════════════════════════════════════════

  {
    id: 'cope_1',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "Something traumatic just happened. First 24 hours, you:",
    options: [
      { text: "Call everyone - I need to talk this out immediately", score: 2, pole: 'E' },
      { text: "Lock the door, turn off phone, process alone", score: -2, pole: 'I' },
      { text: "Tell one person, then need space", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'cope_2',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "When life gets overwhelming, you cope by:",
    options: [
      { text: "Making lists, organizing, controlling what I can", score: 2, pole: 'J' },
      { text: "Fuck it all - substances, impulse decisions, chaos", score: -2, pole: 'P' },
      { text: "Healthy hobbies and routines", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'cope_3',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Your main coping mechanism when shit gets real:",
    options: [
      { text: "Project onto others - it's THEIR fault", score: 2, pole: 'T' },
      { text: "Repress - shove it down, deal with it never", score: -2, pole: 'F' },
      { text: "Therapy, meds, actual healthy coping", score: 0, pole: 'neutral' },
      { text: "Substances - weed, alcohol, whatever numbs", score: -1, pole: 'P' },
      { text: "Sex - intimacy or conquest, depends", score: 1, pole: 'E' },
      { text: "Shop - retail therapy, fill the void with stuff", score: 1, pole: 'J' }
    ]
  },

  {
    id: 'cope_4',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "When trauma resurfaces years later, you:",
    options: [
      { text: "Focus on the facts - what actually happened, proof", score: 2, pole: 'S' },
      { text: "Feel it in my body - somatic, it's stored trauma", score: -2, pole: 'N' },
      { text: "Both - body AND brain need to process", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'cope_5',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "Healthy coping for you looks like:",
    options: [
      { text: "Talk to friends/family, community support", score: 2, pole: 'E' },
      { text: "Solo - journal, walk, hobbies, purpose-driven work", score: -2, pole: 'I' },
      { text: "Therapy (professional help)", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'cope_6',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "When you're in pain, you:",
    options: [
      { text: "Analyze it - why am I feeling this, what triggered it", score: 2, pole: 'T' },
      { text: "Feel it fully - cry, scream, let it move through", score: -2, pole: 'F' },
      { text: "Numb it - I can't handle this right now", score: -1, pole: 'P' }
    ]
  },

  {
    id: 'cope_7',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "Your unhealthy coping mechanism you KNOW you do:",
    options: [
      { text: "Over-control - plan everything, rigidity, anxiety", score: 2, pole: 'J' },
      { text: "Self-destruct - impulse, chaos, burn it all down", score: -2, pole: 'P' },
      { text: "Avoidance - pretend it's not happening", score: 0, pole: 'neutral' }
    ]
  },

  {
    id: 'cope_8',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "Healing for you means:",
    options: [
      { text: "Concrete progress - therapy homework, measurable change", score: 2, pole: 'S' },
      { text: "Spiritual/energetic shift - something intangible changed", score: -2, pole: 'N' },
      { text: "Both - inner work AND outer results", score: 0, pole: 'neutral' }
    ]
  }
];

/**
 * Get all questions with randomized answer order
 */
export function getRandomizedQuestions() {
  return SCENARIO_QUESTIONS.map(q => ({
    ...q,
    options: shuffle(q.options)
  }));
}

/**
 * Calculate MBTI type from answers
 */
export function calculateMBTI(answers) {
  const scores = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0
  };

  answers.forEach(answer => {
    const question = SCENARIO_QUESTIONS.find(q => q.id === answer.questionId);
    if (question) {
      scores[question.dimension] += answer.score;
    }
  });

  const mbti =
    (scores.EI > 0 ? 'E' : 'I') +
    (scores.SN > 0 ? 'S' : 'N') +
    (scores.TF > 0 ? 'T' : 'F') +
    (scores.JP > 0 ? 'J' : 'P');

  return mbti;
}
