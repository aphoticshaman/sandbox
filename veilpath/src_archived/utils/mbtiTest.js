/**
 * MBTI PERSONALITY TEST - SCENARIO-BASED
 * 50 real-world scenarios that reveal who you actually are
 *
 * NOT abstract bullshit like "do you prefer alone time?"
 * ACTUAL scenarios: tee-ball → World Series escalation
 *
 * Determines user's MBTI type across 4 dimensions:
 * - E/I: Extraversion vs Introversion
 * - S/N: Sensing vs Intuition
 * - T/F: Thinking vs Feeling
 * - J/P: Judging vs Perceiving
 *
 * Question breakdown:
 * - Tee-ball (10): Simple, obvious scenarios
 * - Softball (13): Self-awareness required
 * - Hardball (9): Pattern recognition
 * - World Series (10): Brutal honesty, shadow work
 * - Coping mechanisms (8): Trauma response patterns
 *
 * Answer order is RANDOMIZED per question - forces user to READ and THINK
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
 * MBTI Question Battery - 50 SCENARIO-BASED QUESTIONS
 * Answer options are randomized when displayed
 */
export const MBTI_QUESTIONS = [

  // ════════════════════════════════════════════════════════════
  // TEE-BALL (Questions 1-10): Simple, obvious scenarios
  // ════════════════════════════════════════════════════════════

  {
    id: 'tb_1',
    difficulty: 'tee-ball',
    dimension: 'EI',
    question: "Friday night. No plans. Phone's quiet. You:",
    options: shuffle([
      { text: "Text the group chat 'who's out tonight?'", score: 2, pole: 'E' },
      { text: "Order takeout, queue up a show, heaven", score: -2, pole: 'I' },
      { text: "Maybe one person, maybe solo, see how I feel", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_2',
    difficulty: 'tee-ball',
    dimension: 'SN',
    question: "Your friend describes their vacation. You focus on:",
    options: shuffle([
      { text: "Specific details - food, hotel, what they actually did", score: 2, pole: 'S' },
      { text: "The vibe, how they felt, what it meant to them", score: -2, pole: 'N' },
      { text: "Both - facts and feelings", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_3',
    difficulty: 'tee-ball',
    dimension: 'TF',
    question: "Your partner's upset. No clear reason. You:",
    options: shuffle([
      { text: "Ask what happened, try to solve it", score: 2, pole: 'T' },
      { text: "Just hold them, be present, don't need to fix", score: -2, pole: 'F' },
      { text: "Listen first, then problem-solve if asked", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_4',
    difficulty: 'tee-ball',
    dimension: 'JP',
    question: "Weekend trip in 2 weeks. You:",
    options: shuffle([
      { text: "Book everything now, make an itinerary", score: 2, pole: 'J' },
      { text: "Wing it, see what feels right that day", score: -2, pole: 'P' },
      { text: "Book hotel, keep activities flexible", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_5',
    difficulty: 'tee-ball',
    dimension: 'EI',
    question: "Party invite. You know 2 people there. You:",
    options: shuffle([
      { text: "Hell yeah, meet new people", score: 2, pole: 'E' },
      { text: "Nah, I'm good", score: -2, pole: 'I' },
      { text: "Go for an hour, stick with the 2 I know", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_6',
    difficulty: 'tee-ball',
    dimension: 'SN',
    question: "Buying a car. You prioritize:",
    options: shuffle([
      { text: "MPG, safety ratings, resale value, facts", score: 2, pole: 'S' },
      { text: "How it feels to drive, the vibe, gut instinct", score: -2, pole: 'N' },
      { text: "Research first, test drive for feel", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_7',
    difficulty: 'tee-ball',
    dimension: 'TF',
    question: "Coworker asks 'does this email sound okay?' It's fine but cold. You:",
    options: shuffle([
      { text: "It's clear, send it", score: 2, pole: 'T' },
      { text: "Add warmth - a 'hope you're well' or emoji", score: -2, pole: 'F' },
      { text: "Depends on who they're sending it to", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_8',
    difficulty: 'tee-ball',
    dimension: 'JP',
    question: "Your desk/workspace is:",
    options: shuffle([
      { text: "Organized, everything has a place", score: 2, pole: 'J' },
      { text: "Controlled chaos, I know where everything is", score: -2, pole: 'P' },
      { text: "Clean when I need to focus, messy otherwise", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_9',
    difficulty: 'tee-ball',
    dimension: 'EI',
    question: "After a 12-hour shift, your phone buzzes - 3 friends want drinks. You:",
    options: shuffle([
      { text: "Rally. Energy comes from people", score: 2, pole: 'E' },
      { text: "Text back tomorrow. Turn phone off. Collapse", score: -2, pole: 'I' },
      { text: "One drink, then bail", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'tb_10',
    difficulty: 'tee-ball',
    dimension: 'SN',
    question: "Reading a book. You prefer:",
    options: shuffle([
      { text: "Clear plot, realistic characters, makes sense", score: 2, pole: 'S' },
      { text: "Weird metaphors, symbolism, makes me think", score: -2, pole: 'N' },
      { text: "Good story, don't care about the style", score: 0, pole: 'neutral' }
    ])
  },

  // ════════════════════════════════════════════════════════════
  // SOFTBALL (Questions 11-25): Self-awareness required
  // ════════════════════════════════════════════════════════════

  {
    id: 'sb_1',
    difficulty: 'softball',
    dimension: 'TF',
    question: "You made a mistake at work. Not fired-level, but visible. You:",
    options: shuffle([
      { text: "Immediately tell work friend, process out loud", score: -2, pole: 'F' },
      { text: "Replay it alone for 3 hours, fix it quietly", score: 2, pole: 'T' },
      { text: "Quick vent, then strategize the fix", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_2',
    difficulty: 'softball',
    dimension: 'JP',
    question: "You planned a chill Sunday. Friend texts: 'Road trip right now?' You:",
    options: shuffle([
      { text: "No thanks, I need my Sunday", score: 2, pole: 'J' },
      { text: "Sure, let's go", score: -2, pole: 'P' },
      { text: "Where we going? Back by when?", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_3',
    difficulty: 'softball',
    dimension: 'EI',
    question: "Big life decision. You need to:",
    options: shuffle([
      { text: "Talk to 5 people, hear all perspectives", score: 2, pole: 'E' },
      { text: "Journal, walk, sit with it alone", score: -2, pole: 'I' },
      { text: "One trusted person, then solo processing", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_4',
    difficulty: 'softball',
    dimension: 'SN',
    question: "Someone says 'that's just how things are.' You:",
    options: shuffle([
      { text: "Accept it if it's factual", score: 2, pole: 'S' },
      { text: "Question everything - 'but WHY?'", score: -2, pole: 'N' },
      { text: "Accept some things, question others", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_5',
    difficulty: 'softball',
    dimension: 'TF',
    question: "Friend wants your honest opinion on their terrible idea. You:",
    options: shuffle([
      { text: "Tell them straight - it's a bad idea, here's why", score: 2, pole: 'T' },
      { text: "Gently point out concerns, support them anyway", score: -2, pole: 'F' },
      { text: "Ask questions, let them realize it themselves", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_6',
    difficulty: 'softball',
    dimension: 'JP',
    question: "3 deadlines hit at once. You:",
    options: shuffle([
      { text: "Made a project plan 2 weeks ago, I'm good", score: 2, pole: 'J' },
      { text: "Thrive under pressure, I got this", score: -2, pole: 'P' },
      { text: "Planned some, winging the rest", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_7',
    difficulty: 'softball',
    dimension: 'EI',
    question: "Someone's wrong on the internet about something you know. You:",
    options: shuffle([
      { text: "Engage - can't let misinformation spread", score: 2, pole: 'E' },
      { text: "Scroll past - not my circus", score: -2, pole: 'I' },
      { text: "Depends if anyone I know might see it", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_8',
    difficulty: 'softball',
    dimension: 'SN',
    question: "Dream job offer. BUT it's in a city you've never considered. You:",
    options: shuffle([
      { text: "Research COL, schools, crime stats, logistics", score: 2, pole: 'S' },
      { text: "Imagine the life, the vibe, who I'd become there", score: -2, pole: 'N' },
      { text: "Do both - facts AND vision", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_9',
    difficulty: 'softball',
    dimension: 'TF',
    question: "Your partner forgot your birthday. Again. You:",
    options: shuffle([
      { text: "Tell them calmly it hurt - clear communication", score: 2, pole: 'T' },
      { text: "Cry, shut down, wait for them to notice", score: -2, pole: 'F' },
      { text: "Remind them next year, let this one go", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_10',
    difficulty: 'softball',
    dimension: 'JP',
    question: "You're running 10 minutes late to meet a friend. You:",
    options: shuffle([
      { text: "Stress the entire time - I'm NEVER late", score: 2, pole: 'J' },
      { text: "They'll be fine, shit happens", score: -2, pole: 'P' },
      { text: "Text them, apologize, keep moving", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_11',
    difficulty: 'softball',
    dimension: 'EI',
    question: "You just learned something that changed how you see the world. You:",
    options: shuffle([
      { text: "Text 6 people immediately - 'you need to hear this'", score: 2, pole: 'E' },
      { text: "Sit with it for days, integrate it alone first", score: -2, pole: 'I' },
      { text: "Tell one close friend, process together", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_12',
    difficulty: 'softball',
    dimension: 'SN',
    question: "Someone asks 'how are you?' You:",
    options: shuffle([
      { text: "Fine/good/busy - accurate surface answer", score: 2, pole: 'S' },
      { text: "Depends - do they actually want to know or is this ritual?", score: -2, pole: 'N' },
      { text: "Good! How are you?", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'sb_13',
    difficulty: 'softball',
    dimension: 'TF',
    question: "Friend asks to borrow money. Third time. They never paid you back. You:",
    options: shuffle([
      { text: "No - clear boundary, explain why", score: 2, pole: 'T' },
      { text: "Lend it even though it hurts - they need help", score: -2, pole: 'F' },
      { text: "Offer to help another way - not cash", score: 0, pole: 'neutral' }
    ])
  },

  // ════════════════════════════════════════════════════════════
  // HARDBALL AA (Questions 26-40): Pattern recognition
  // ════════════════════════════════════════════════════════════

  {
    id: 'hb_1',
    difficulty: 'hardball',
    dimension: 'TF',
    question: "Best friend in crisis. Again. Third time this month. You:",
    options: shuffle([
      { text: "Drop everything, show up, that's what friends do", score: -2, pole: 'F' },
      { text: "Love them, but I'm tapped - send resources, check tomorrow", score: 2, pole: 'T' },
      { text: "Help this time, boundary conversation coming", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_2',
    difficulty: 'hardball',
    dimension: 'SN',
    question: "You keep dating the same type and it keeps failing. You:",
    options: shuffle([
      { text: "Analyze what specifically went wrong each time", score: 2, pole: 'S' },
      { text: "See the pattern - I'm attracted to my trauma", score: -2, pole: 'N' },
      { text: "Both - track patterns AND specific red flags", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_3',
    difficulty: 'hardball',
    dimension: 'JP',
    question: "Your 5-year plan fell apart. You:",
    options: shuffle([
      { text: "Make a new plan immediately - I need structure", score: 2, pole: 'J' },
      { text: "Float for a while, see what emerges", score: -2, pole: 'P' },
      { text: "Rough outline, stay flexible", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_4',
    difficulty: 'hardball',
    dimension: 'EI',
    question: "You notice you perform emotions differently around different people. You:",
    options: shuffle([
      { text: "That's normal - I mirror and adapt", score: 2, pole: 'E' },
      { text: "Wait, WHO AM I actually? Identity crisis mode", score: -2, pole: 'I' },
      { text: "I'm all those versions - context matters", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_5',
    difficulty: 'hardball',
    dimension: 'TF',
    question: "You realize the 'friend group' only contacts you when they need something. You:",
    options: shuffle([
      { text: "Cut them off - I'm done being used", score: 2, pole: 'T' },
      { text: "Keep showing up - maybe they'll change", score: -2, pole: 'F' },
      { text: "Distance myself slowly, find new people", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_6',
    difficulty: 'hardball',
    dimension: 'SN',
    question: "Your body keeps getting sick/injured in the same pattern. You:",
    options: shuffle([
      { text: "Doctor, tests, find the physical cause", score: 2, pole: 'S' },
      { text: "This is psychosomatic - my body is trying to tell me something", score: -2, pole: 'N' },
      { text: "Both - rule out physical, explore emotional", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_7',
    difficulty: 'hardball',
    dimension: 'JP',
    question: "You've been 'getting ready to start' that thing for 6 months. You:",
    options: shuffle([
      { text: "Make a specific plan with deadlines NOW", score: 2, pole: 'J' },
      { text: "I'm not ready yet - when it's time, I'll know", score: -2, pole: 'P' },
      { text: "Start small today - one tiny action", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_8',
    difficulty: 'hardball',
    dimension: 'EI',
    question: "You're exhausted from masking/performing in social situations. You:",
    options: shuffle([
      { text: "Find people I don't have to mask around", score: 2, pole: 'E' },
      { text: "Just be alone more - it's easier", score: -2, pole: 'I' },
      { text: "Therapy to figure out why I mask so hard", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'hb_9',
    difficulty: 'hardball',
    dimension: 'TF',
    question: "Someone you love is making terrible choices. You've told them. They won't listen. You:",
    options: shuffle([
      { text: "Step back - they're an adult, let them learn", score: 2, pole: 'T' },
      { text: "Keep trying - I can't watch them destroy themselves", score: -2, pole: 'F' },
      { text: "Set boundary: I love you but I can't watch this", score: 0, pole: 'neutral' }
    ])
  },

  // ════════════════════════════════════════════════════════════
  // MLB WORLD SERIES (Questions 41-50): Brutal honesty, shadow work
  // ════════════════════════════════════════════════════════════

  {
    id: 'ws_1',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Your mom says she wishes she'd aborted you. You:",
    options: shuffle([
      { text: "Cut her off forever. Done.", score: 2, pole: 'T' },
      { text: "Hang up, cry, tell everyone who texted me last", score: -2, pole: 'F' },
      { text: "Block for a day, demand apology, fight it out", score: 0, pole: 'neutral' },
      { text: "Hang up. Process alone. Maybe talk in 6 months.", score: 1, pole: 'T' }
    ])
  },

  {
    id: 'ws_2',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "You're in love. They're perfect on paper. Everyone approves. But late at night, alone, you feel... nothing. You:",
    options: shuffle([
      { text: "Stay - love is a choice, feelings follow commitment", score: 2, pole: 'S' },
      { text: "Leave - I'd rather be alone than lie to myself and them", score: -2, pole: 'N' },
      { text: "Give it 3 more months, see if spark comes back", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_3',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "Everything you planned for is gone. Career, relationship, city - all dead. You:",
    options: shuffle([
      { text: "Rebuild immediately - new plan, new structure, survive", score: 2, pole: 'J' },
      { text: "Burn it all down, disappear, start completely over", score: -2, pole: 'P' },
      { text: "Grieve first, plan later", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_4',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "You realize you perform vulnerability to get love, but you're not actually letting anyone in. You:",
    options: shuffle([
      { text: "Talk to my therapist and 3 close friends about this", score: 2, pole: 'E' },
      { text: "Journal for months, then maybe tell one person", score: -2, pole: 'I' },
      { text: "Tell one person I trust, see how it feels", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_5',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Your best friend's partner is cheating. You have proof. They're about to propose. You:",
    options: shuffle([
      { text: "Tell them immediately - they deserve to know", score: 2, pole: 'T' },
      { text: "God this hurts - maybe talk to the cheater first?", score: -2, pole: 'F' },
      { text: "Anonymous tip, let them investigate", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_6',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "You keep sabotaging good things right before they work out. Every time. You:",
    options: shuffle([
      { text: "Track when it happens - find the trigger pattern", score: 2, pole: 'S' },
      { text: "I'm afraid of success. Afraid of being seen. Therapy time.", score: -2, pole: 'N' },
      { text: "Both - pattern AND why", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_7',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "You achieved everything you planned for. And you're miserable. You:",
    options: shuffle([
      { text: "The plan was wrong - make a new one based on truth", score: 2, pole: 'J' },
      { text: "Burn it all. I never wanted this. I wanted to want this.", score: -2, pole: 'P' },
      { text: "Keep some, discard some, rebuild slowly", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_8',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "You're most yourself when no one's watching. The person people know isn't the real you. You:",
    options: shuffle([
      { text: "Start showing the real me - lose fake friends, find real ones", score: 2, pole: 'E' },
      { text: "Keep the mask on in public, be real alone. Safer.", score: -2, pole: 'I' },
      { text: "Show real me to a few people, test the waters", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_9',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Choosing between the person you love and the career you've built for 10 years. One has to go. You:",
    options: shuffle([
      { text: "Career. You can't build your life around one person.", score: 2, pole: 'T' },
      { text: "Person. Jobs are replaceable. This love isn't.", score: -2, pole: 'F' },
      { text: "Try to negotiate both - relocate, compromise, fight for both", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'ws_10',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "Your gut says run. Your brain says stay. All evidence says stay. Your gut still says run. You:",
    options: shuffle([
      { text: "Stay - gut feelings aren't facts", score: 2, pole: 'S' },
      { text: "Run - my body knows something my mind doesn't see yet", score: -2, pole: 'N' },
      { text: "Investigate - why is my gut screaming?", score: 0, pole: 'neutral' }
    ])
  },

  // ════════════════════════════════════════════════════════════
  // COPING MECHANISMS (Bonus questions): How you handle trauma
  // ════════════════════════════════════════════════════════════

  {
    id: 'cope_1',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "Something traumatic just happened. First 24 hours, you:",
    options: shuffle([
      { text: "Call everyone - I need to talk this out immediately", score: 2, pole: 'E' },
      { text: "Lock the door, turn off phone, process alone", score: -2, pole: 'I' },
      { text: "Tell one person, then need space", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'cope_2',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "When life gets overwhelming, you cope by:",
    options: shuffle([
      { text: "Making lists, organizing, controlling what I can", score: 2, pole: 'J' },
      { text: "Substances, impulse decisions, chaos", score: -2, pole: 'P' },
      { text: "Healthy hobbies and routines", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'cope_3',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "Your main coping mechanism when things get difficult:",
    options: shuffle([
      { text: "Therapy - talk to a professional", score: 0, pole: 'neutral' },
      { text: "Medication - medical management", score: 0, pole: 'neutral' },
      { text: "Exercise - physical outlet", score: 1, pole: 'T' },
      { text: "Social support - talk to friends and family", score: -1, pole: 'F' },
      { text: "Hobbies - creative or focused distraction", score: 1, pole: 'I' },
      { text: "Work harder - productivity as escape", score: 2, pole: 'T' },
      { text: "Substances - numb it out", score: -2, pole: 'P' },
      { text: "Avoidance - pretend it's not happening", score: -2, pole: 'F' }
    ])
  },

  {
    id: 'cope_4',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "When trauma resurfaces years later, you:",
    options: shuffle([
      { text: "Focus on the facts - what actually happened, proof", score: 2, pole: 'S' },
      { text: "Feel it in my body - somatic, it's stored trauma", score: -2, pole: 'N' },
      { text: "Both - body AND brain need to process", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'cope_5',
    difficulty: 'world-series',
    dimension: 'EI',
    question: "Healthy coping for you looks like:",
    options: shuffle([
      { text: "Talk to friends/family, community support", score: 2, pole: 'E' },
      { text: "Solo - journal, walk, hobbies, purpose-driven work", score: -2, pole: 'I' },
      { text: "Therapy (professional help)", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'cope_6',
    difficulty: 'world-series',
    dimension: 'TF',
    question: "When you're in pain, you:",
    options: shuffle([
      { text: "Analyze it - why am I feeling this, what triggered it", score: 2, pole: 'T' },
      { text: "Feel it fully - cry, scream, let it move through", score: -2, pole: 'F' },
      { text: "Numb it - I can't handle this right now", score: -1, pole: 'P' }
    ])
  },

  {
    id: 'cope_7',
    difficulty: 'world-series',
    dimension: 'JP',
    question: "Your unhealthy coping mechanism you KNOW you do:",
    options: shuffle([
      { text: "Over-control - plan everything, rigidity, anxiety", score: 2, pole: 'J' },
      { text: "Self-destruct - impulse, chaos, burn it all down", score: -2, pole: 'P' },
      { text: "Avoidance - pretend it's not happening", score: 0, pole: 'neutral' }
    ])
  },

  {
    id: 'cope_8',
    difficulty: 'world-series',
    dimension: 'SN',
    question: "Healing for you means:",
    options: shuffle([
      { text: "Concrete progress - therapy homework, measurable change", score: 2, pole: 'S' },
      { text: "Spiritual/energetic shift - something intangible changed", score: -2, pole: 'N' },
      { text: "Both - inner work AND outer results", score: 0, pole: 'neutral' }
    ])
  }
];

/**
 * Calculate MBTI type from answers
 * @param {Array} answers - Array of { questionId, selectedOptionIndex } objects
 * @returns {Object} - { type: 'INTJ', scores: { EI: -12, SN: 4, TF: 10, JP: 8 }, ... }
 */
export function calculateMBTI(answers) {
  // Initialize dimension scores
  const scores = {
    EI: 0,  // Positive = E, Negative = I
    SN: 0,  // Positive = S, Negative = N
    TF: 0,  // Positive = T, Negative = F
    JP: 0   // Positive = J, Negative = P
  };

  // Tally scores
  answers.forEach(answer => {
    const question = MBTI_QUESTIONS.find(q => q.id === answer.questionId);
    if (!question) return;

    const option = question.options[answer.selectedOptionIndex];
    if (!option) return;

    scores[question.dimension] += option.score;
  });

  // Determine type letters
  const type =
    (scores.EI >= 0 ? 'E' : 'I') +
    (scores.SN >= 0 ? 'S' : 'N') +
    (scores.TF >= 0 ? 'T' : 'F') +
    (scores.JP >= 0 ? 'J' : 'P');

  // Calculate strength of preferences (0-100%)
  const maxScore = 60; // Rough estimate: 58 questions with varying point values
  const strengths = {
    EI: Math.min(100, Math.abs(scores.EI) / maxScore * 100),
    SN: Math.min(100, Math.abs(scores.SN) / maxScore * 100),
    TF: Math.min(100, Math.abs(scores.TF) / maxScore * 100),
    JP: Math.min(100, Math.abs(scores.JP) / maxScore * 100)
  };

  return {
    type,
    scores,
    strengths,
    description: getMBTIDescription(type)
  };
}

/**
 * Get MBTI type description and tarot interpretation style
 */
export function getMBTIDescription(type) {
  const descriptions = {
    // Analysts
    INTJ: {
      nickname: 'The Architect',
      core: 'Strategic, independent, visionary thinker',
      tarotStyle: 'Prefers deep symbolic analysis, long-term patterns, systems thinking. Wants interpretations that challenge them intellectually and offer strategic insights.',
      communicationPreference: 'Direct, precise, focuses on underlying patterns and future implications'
    },
    INTP: {
      nickname: 'The Logician',
      core: 'Analytical, curious, theory-focused',
      tarotStyle: 'Loves exploring abstract connections, philosophical depth, logical frameworks. Wants interpretations that satisfy intellectual curiosity and reveal hidden structures.',
      communicationPreference: 'Theoretical, exploratory, enjoys complexity and nuance'
    },
    ENTJ: {
      nickname: 'The Commander',
      core: 'Decisive, strategic, leadership-oriented',
      tarotStyle: 'Action-focused, wants clear strategy and concrete steps. Values efficiency and results-oriented guidance.',
      communicationPreference: 'Bold, direct, focused on goals and execution'
    },
    ENTP: {
      nickname: 'The Debater',
      core: 'Innovative, argumentative, possibility-seeker',
      tarotStyle: 'Loves exploring multiple perspectives, alternative interpretations, creative possibilities. Wants interpretations that challenge assumptions.',
      communicationPreference: 'Playful, provocative, enjoys intellectual sparring'
    },

    // Diplomats
    INFJ: {
      nickname: 'The Advocate',
      core: 'Idealistic, empathetic, purpose-driven',
      tarotStyle: 'Seeks deep meaning, spiritual significance, personal growth insights. Wants interpretations connecting to life purpose and authenticity.',
      communicationPreference: 'Compassionate, visionary, focuses on meaning and transformation'
    },
    INFP: {
      nickname: 'The Mediator',
      core: 'Idealistic, values-driven, introspective',
      tarotStyle: 'Emotional resonance, authenticity, personal values alignment. Wants interpretations honoring feelings and inner truth.',
      communicationPreference: 'Gentle, poetic, focuses on emotions and values'
    },
    ENFJ: {
      nickname: 'The Protagonist',
      core: 'Charismatic, inspiring, people-focused',
      tarotStyle: 'Relationship dynamics, empowering others, social harmony. Wants interpretations supporting connection and positive impact.',
      communicationPreference: 'Warm, encouraging, focuses on potential and relationships'
    },
    ENFP: {
      nickname: 'The Campaigner',
      core: 'Enthusiastic, creative, free-spirited',
      tarotStyle: 'Possibilities, creative expression, authentic self-discovery. Wants interpretations that inspire and liberate.',
      communicationPreference: 'Enthusiastic, imaginative, celebrates uniqueness'
    },

    // Sentinels
    ISTJ: {
      nickname: 'The Logistician',
      core: 'Practical, reliable, detail-oriented',
      tarotStyle: 'Clear, practical guidance with specific steps. Values tradition and proven methods.',
      communicationPreference: 'Factual, organized, focuses on concrete details and duty'
    },
    ISFJ: {
      nickname: 'The Defender',
      core: 'Caring, loyal, tradition-oriented',
      tarotStyle: 'Supportive, nurturing guidance focused on caring for self and others. Values stability and kindness.',
      communicationPreference: 'Warm, practical, focuses on caregiving and responsibility'
    },
    ESTJ: {
      nickname: 'The Executive',
      core: 'Organized, efficient, takes charge',
      tarotStyle: 'Direct action plans, clear structure, efficiency. Wants no-nonsense practical guidance.',
      communicationPreference: 'Direct, structured, focuses on logic and results'
    },
    ESFJ: {
      nickname: 'The Consul',
      core: 'Social, helpful, harmony-seeking',
      tarotStyle: 'Relationship guidance, community harmony, helping others. Wants warm, supportive interpretations.',
      communicationPreference: 'Friendly, supportive, focuses on social connection'
    },

    // Explorers
    ISTP: {
      nickname: 'The Virtuoso',
      core: 'Practical, hands-on, flexible',
      tarotStyle: 'Concrete, action-oriented, focused on immediate practical application. Minimal fluff.',
      communicationPreference: 'Concise, practical, focuses on what works'
    },
    ISFP: {
      nickname: 'The Adventurer',
      core: 'Artistic, spontaneous, present-focused',
      tarotStyle: 'Aesthetic, experiential, honors present moment feelings. Wants authentic, sensory-rich interpretations.',
      communicationPreference: 'Gentle, artistic, focuses on beauty and experience'
    },
    ESTP: {
      nickname: 'The Entrepreneur',
      core: 'Bold, energetic, action-taker',
      tarotStyle: 'Fast-paced, opportunity-focused, risk-taking guidance. Wants immediate actionable insights.',
      communicationPreference: 'Bold, direct, focuses on seizing opportunities'
    },
    ESFP: {
      nickname: 'The Entertainer',
      core: 'Enthusiastic, fun-loving, spontaneous',
      tarotStyle: 'Playful, experiential, celebrates joy and connection. Wants uplifting, present-focused guidance.',
      communicationPreference: 'Enthusiastic, warm, focuses on fun and experience'
    }
  };

  return descriptions[type] || {
    nickname: 'Unique Individual',
    core: 'Multifaceted personality',
    tarotStyle: 'Balanced interpretation approach',
    communicationPreference: 'Adaptable communication'
  };
}

/**
 * Get MBTI-specific interpretation variations
 * Used to customize language/focus for each type
 */
export function getMBTIInterpretationGuidelines(mbtiType) {
  const guidelines = {
    // Analysts - Want depth, systems, strategy
    INTJ: {
      emphasize: ['long-term patterns', 'strategic implications', 'systems thinking', 'mastery'],
      avoid: ['emotional appeals', 'vague platitudes', 'surface-level advice'],
      tone: 'intellectual, strategic, future-focused'
    },
    INTP: {
      emphasize: ['logical frameworks', 'theoretical connections', 'abstract patterns', 'curiosity'],
      avoid: ['rigid action plans', 'emotional pressure', 'oversimplification'],
      tone: 'analytical, exploratory, complex'
    },
    ENTJ: {
      emphasize: ['clear goals', 'actionable strategy', 'efficiency', 'leadership'],
      avoid: ['indecisiveness', 'excessive emotion', 'lack of direction'],
      tone: 'decisive, bold, results-oriented'
    },
    ENTP: {
      emphasize: ['multiple perspectives', 'innovation', 'possibilities', 'debate'],
      avoid: ['rigid rules', 'single interpretations', 'lack of creativity'],
      tone: 'playful, provocative, expansive'
    },

    // Diplomats - Want meaning, growth, authenticity
    INFJ: {
      emphasize: ['deeper meaning', 'personal growth', 'authenticity', 'vision'],
      avoid: ['superficiality', 'inauthentic positivity', 'ignoring intuition'],
      tone: 'meaningful, visionary, transformative'
    },
    INFP: {
      emphasize: ['values alignment', 'emotional truth', 'authenticity', 'ideals'],
      avoid: ['harsh criticism', 'forcing practicality', 'dismissing feelings'],
      tone: 'gentle, authentic, values-centered'
    },
    ENFJ: {
      emphasize: ['relationship harmony', 'helping others', 'potential', 'connection'],
      avoid: ['selfishness', 'conflict', 'isolation'],
      tone: 'warm, encouraging, people-focused'
    },
    ENFP: {
      emphasize: ['possibilities', 'authenticity', 'creativity', 'inspiration'],
      avoid: ['rigid structure', 'crushing spontaneity', 'limiting options'],
      tone: 'enthusiastic, imaginative, liberating'
    },

    // Sentinels - Want structure, duty, practicality
    ISTJ: {
      emphasize: ['concrete steps', 'practical application', 'duty', 'tradition'],
      avoid: ['abstract theory', 'impractical advice', 'chaos'],
      tone: 'clear, organized, reliable'
    },
    ISFJ: {
      emphasize: ['caring for others', 'stability', 'responsibility', 'support'],
      avoid: ['selfishness', 'disruption', 'harsh criticism'],
      tone: 'warm, nurturing, practical'
    },
    ESTJ: {
      emphasize: ['efficiency', 'structure', 'clear plans', 'logic'],
      avoid: ['disorganization', 'emotional excess', 'impracticality'],
      tone: 'direct, organized, no-nonsense'
    },
    ESFJ: {
      emphasize: ['social harmony', 'helping others', 'tradition', 'community'],
      avoid: ['conflict', 'selfishness', 'social rejection'],
      tone: 'friendly, supportive, conventional'
    },

    // Explorers - Want action, experience, flexibility
    ISTP: {
      emphasize: ['practical action', 'hands-on solutions', 'flexibility', 'efficiency'],
      avoid: ['emotional drama', 'abstract theory', 'rigid plans'],
      tone: 'concise, practical, action-focused'
    },
    ISFP: {
      emphasize: ['present experience', 'aesthetics', 'authenticity', 'sensory'],
      avoid: ['harsh judgment', 'rigid structure', 'dismissing feelings'],
      tone: 'gentle, experiential, authentic'
    },
    ESTP: {
      emphasize: ['immediate action', 'opportunities', 'risk-taking', 'results'],
      avoid: ['over-planning', 'analysis paralysis', 'waiting'],
      tone: 'bold, fast-paced, opportunistic'
    },
    ESFP: {
      emphasize: ['joy', 'experience', 'connection', 'spontaneity'],
      avoid: ['heavy negativity', 'rigid plans', 'missing fun'],
      tone: 'enthusiastic, experiential, joyful'
    }
  };

  return guidelines[mbtiType] || {
    emphasize: ['balance', 'clarity', 'actionable insights'],
    avoid: ['extremes', 'vagueness'],
    tone: 'balanced, clear, supportive'
  };
}
