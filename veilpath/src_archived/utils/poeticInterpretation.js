/**
 * POETIC QUOTES ENGINE
 * Sprinkle raw, honest poetry throughout interpretations
 * Like Hollywood one-liners or BookTok quotes - casual but powerful
 *
 * "Buy the ticket, take the ride"
 *
 * NOT a separate mode - these get woven into normal readings
 */

import { CARD_DATABASE } from '../data/cardDatabase';
import { getChineseZodiac } from './chineseZodiac';
import { qRandom } from './quantumRNG';

/**
 * Get a poetry quote to sprinkle into interpretation
 * Returns a one-liner or short verse relevant to the card
 * Context-aware: filters romantic/sexual quotes for career readings, etc.
 */
export function getPoetryQuote(cardName, context = {}) {
  const { readingType, gender } = context;

  // ALL 22 MAJOR ARCANA + select minor arcana
  // Quotes tagged: 'romance', 'universal', 'power', 'shadow', etc.
  const quotes = {
    'The Fool': {
      universal: [
        '"Buy the ticket, take the ride."',
        '"Let\'s see what pieces of you come back."',
        'Everything worth having lives on the other side of terrifying.',
      ],
      shadow: [
        '"I bleed too easily, cutting myself open, through hardened scars."',
      ]
    },

    'The Magician': {
      universal: [
        'You have everything you need. Stop waiting for permission.',
        'Manifest or be manifested. Your choice.',
        'The universe bends for the ones who act.',
      ],
      power: [
        'Channel the lightning. Become the storm.',
      ]
    },

    'The High Priestess': {
      universal: [
        'Your intuition is screaming. Listen.',
        'The answer is already inside you.',
        'Trust the mystery. Trust yourself.',
      ],
      shadow: [
        'What you know but refuse to admit.',
      ]
    },

    'The Empress': {
      universal: [
        'Creation is your nature. Birth something new.',
        'Abundance flows when you stop forcing.',
      ],
      romance: [
        'Fertile ground. Ripe for growth.',
      ]
    },

    'The Emperor': {
      universal: [
        'Structure without soul is a prison.',
        'Control what you can. Release what you can\'t.',
        'Authority earned, not demanded.',
      ],
      power: [
        'Lead yourself first.',
      ]
    },

    'The Hierophant': {
      universal: [
        'Tradition is a tool, not a cage.',
        'Question the rules. Especially the ones you made.',
      ],
      shadow: [
        'Stop performing for approval.',
      ]
    },

    'The Lovers': {
      universal: [
        'Choose yourself first.',
        '"I can not unsee. I could not unfeel. I can not forget."',
      ],
      romance: [
        '"Come closer, and lash me with your passion, your desire, furiously."',
        '"To be entirely yours."',
        '"Two fucked up kids who did their damnedest to be grownups."',
      ]
    },

    'The Chariot': {
      universal: [
        'Direction without discipline is chaos.',
        'You\'re in control. Act like it.',
        'Momentum doesn\'t care about your feelings.',
      ],
      power: [
        'Harness the contradiction. Drive forward.',
      ]
    },

    'Strength': {
      universal: [
        'Gentle does not mean weak.',
        'Tame the beast. Don\'t kill it.',
        'Your power lies in restraint.',
      ],
      shadow: [
        'Face the fear. It knows your name.',
      ]
    },

    'The Hermit': {
      universal: [
        'Solitude is where you find yourself.',
        'The answers won\'t come from the crowd.',
        'Withdraw. Reflect. Return changed.',
      ],
      shadow: [
        'Isolation as protection or as prison?',
      ]
    },

    'Wheel of Fortune': {
      universal: [
        'The wheel turns. You don\'t control it.',
        'Luck is just timing meeting preparation.',
        'Rise. Fall. Rise again.',
      ],
      power: [
        'Ride the cycle. Don\'t resist it.',
      ]
    },

    'Justice': {
      universal: [
        'You reap what you sow. No exceptions.',
        'Karma doesn\'t negotiate.',
        'Truth cuts both ways.',
      ],
      shadow: [
        'Balance demands sacrifice.',
      ]
    },

    'The Hanged Man': {
      universal: [
        'Surrender is not defeat.',
        'See it differently. Everything shifts.',
        'Stuck by choice or by necessity?',
      ],
      shadow: [
        'Let go. Let it fucking go.',
      ]
    },

    'Death': {
      universal: [
        '"Death is just transformation wearing a scary mask."',
        '"Every reading rewrites your timeline."',
        'Let it die. Make space for new life.',
      ],
      shadow: [
        '"At the whims of the distant and dormant moon, and like the tides, I change."',
        'You\'re Weekend at Bernie\'s-ing your own life.',
      ]
    },

    'Temperance': {
      universal: [
        'Balance is active, not passive.',
        'Alchemy takes patience.',
        'Mix the extremes. Find the middle.',
      ],
      power: [
        'Master the blend.',
      ]
    },

    'The Devil': {
      universal: [
        'Your chains are unlocked. Walk away.',
        'Addiction is just attachment with consequences.',
      ],
      shadow: [
        'You love your cage.',
        'The devil you know is still the devil.',
      ],
      romance: [
        'Obsession dressed as love.',
      ]
    },

    'The Tower': {
      universal: [
        'Lightning doesn\'t negotiate.',
        '"What was once warm hearth, is now not my own."',
        'Stop Weekend at Bernie\'s-ing the corpse.',
      ],
      shadow: [
        '"Devastate me. Tear open the infinite and rend the sky like a razor through silk."',
        '"Smash this petty ego and break me down. Fill in the gaps left behind with the molten gold of elevated consciousness."',
      ]
    },

    'The Star': {
      universal: [
        'Hope after devastation. Light after darkness.',
        '"I refuse to believe I am only the sum of my flesh and electrochemical impulses. I am here in spirit."',
        'You survived. You\'re allowed to hope again.',
      ],
      romance: [
        '"Starlight fills our eyes as pyroclastic pleasure flows throughout."',
      ]
    },

    'The Moon': {
      universal: [
        'The Moon knows your nightmares.',
        'LunatIQ. Lunatic. Moon-governed.',
        'Trust the darkness. It shows what light hides.',
      ],
      shadow: [
        '"At the whims of the distant and dormant moon, and like the tides, I change, rise and crash."',
        '"A sea of salty sorrows rages under Luna\'s eye."',
      ]
    },

    'The Sun': {
      universal: [
        'Clarity burns away the bullshit.',
        'Joy is your birthright. Claim it.',
        'The Sun doesn\'t apologize for shining.',
      ],
      power: [
        'Radiate. Unapologetically.',
      ]
    },

    'Judgement': {
      universal: [
        'Rise from the ashes. Reborn.',
        'The past is calling. Answer or ignore?',
        'Reckoning time.',
      ],
      shadow: [
        'You can\'t hide from yourself forever.',
      ]
    },

    'The World': {
      universal: [
        'Completion. Integration. Wholeness.',
        'The cycle ends. A new one begins.',
        'You did it. Now what?',
      ],
      power: [
        'Mastery achieved. What\'s next?',
      ]
    },

    // SELECT MINOR ARCANA
    'Two of Cups': {
      universal: [
        'Real connection scares you. Why?',
      ],
      romance: [
        '"Velvet voodoo of lust swells within us."',
        '"Lost in the world of you, my sweet, sinful taboo."',
        '"Physical feelings consume the mind and heart like fire."',
      ]
    },

    'default': {
      universal: [
        '"I notice everything about you. Everything."',
        '"Your subconscious has been trying to reach you."',
        'Buy the ticket. Take the ride.',
        'Trust me. Question yourself.',
      ]
    }
  };

  const cardQuotes = quotes[cardName] || quotes['default'];

  // CONTEXT-AWARE FILTERING
  // Don't use romantic/sexual quotes for career/finance readings
  const isRomanceReading = ['romance', 'relationship'].includes(readingType);

  let availableQuotes = [];

  // Always include universal quotes
  if (cardQuotes.universal) {
    availableQuotes.push(...cardQuotes.universal);
  }

  // Add romance quotes ONLY for romance readings
  if (isRomanceReading && cardQuotes.romance) {
    availableQuotes.push(...cardQuotes.romance);
  }

  // Add power/shadow quotes for all non-romance readings
  if (!isRomanceReading) {
    if (cardQuotes.power) availableQuotes.push(...cardQuotes.power);
    if (cardQuotes.shadow) availableQuotes.push(...cardQuotes.shadow);
  }

  // Fallback to default if no quotes match
  if (availableQuotes.length === 0) {
    availableQuotes = quotes['default'].universal;
  }

  return availableQuotes[Math.floor(qRandom() * availableQuotes.length)];
}

/**
 * Generate free verse poetry interpretation
 * This is the raw, honest voice - not sanitized corporate speak
 */
export function generatePoeticInterpretation(card, intention, readingType, userProfile, readingHistory = []) {
  const cardData = CARD_DATABASE[card.cardIndex] || CARD_DATABASE[0];
  const { reversed, position } = card;

  // Gather ALL context
  const context = {
    cardName: cardData.name,
    arcana: cardData.arcana,
    element: cardData.element,
    reversed,
    position,
    intention,
    readingType,
    zodiacSign: userProfile.zodiacSign,
    chineseZodiac: getChineseZodiac(userProfile.birthdate),
    mbtiType: userProfile.mbtiType,
    gender: userProfile.gender,
    totalReadings: readingHistory.length,
    recentPattern: detectRecentPattern(readingHistory)
  };

  // Generate poetic layers
  const opening = generateOpeningVerse(context);
  const corePoem = generateCorePoem(context);
  const hstWisdom = generateHunterSThompsonWisdom(context);
  const shadowWork = generateShadowWorkVerse(context);
  const closingChallenge = generateClosingChallenge(context);

  return {
    poem: `${opening}\n\n${corePoem}\n\n${hstWisdom}\n\n${shadowWork}\n\n${closingChallenge}`,
    raw: true,
    voice: 'poetic'
  };
}

/**
 * Opening verse - direct address, seeing the user
 */
function generateOpeningVerse(ctx) {
  const { cardName, reversed, zodiacSign, chineseZodiac } = ctx;

  const openings = [
    `${cardName}${reversed ? ', inverted' : ''}.\nI see you, ${zodiacSign}.`,
    `Listen, ${chineseZodiac}—\n${cardName} just called your name.`,
    `You pulled ${cardName}${reversed ? ' reversed' : ''}.\nNo accidents here.`,
    `${cardName}.\nOf course it's this card.\nYou know why.`,
  ];

  return openings[Math.floor(qRandom() * openings.length)];
}

/**
 * Core poem - the meat of the interpretation
 * DIRECTLY QUOTES user's poetry - raw, honest, intense
 * Uses their actual metaphors and phrasings
 */
function generateCorePoem(ctx) {
  const { cardName, element, reversed, readingType, mbtiType } = ctx;

  // Card-specific poetry templates using USER'S ACTUAL LINES
  const poems = {
    'The Fool': reversed ?
      `You're terrified of the leap,
standing at the edge
with every reason not to jump.

"I bleed too easily,
cutting myself open,
through hardened scars."

But The Fool reversed knows:
the fear of falling
is just fear of becoming.

Buy the ticket.
Take the ride.
(You have it tattooed for a reason.)`
    :
      `The Fool doesn't ask permission.

"Buy the ticket, take the ride."

You want safety?
Wrong card.
Wrong life.
Wrong fucking universe.

The Fool knows:
everything worth having
lives on the other side of terrifying.

Let's see what pieces of you come back.`,

    'The Tower': reversed ?
      `The Tower is falling
whether you're ready or not.

But reversed?
You're the one holding up the ruins,
pretending the structure isn't already rubble.

"What was once warm hearth,
is now not my own."

You know it's over.
Stop Weekend at Bernie's-ing the corpse.

Let it fall.
Let it burn.
Let it end.

What you're protecting
is already gone.`
    :
      `"Devastate me.
Tear open the infinite and rend the sky
like a razor through silk."

That's The Tower.

Lightning doesn't negotiate.

Everything you built on lies—
about yourself,
about them,
about what you "should" want—
is coming down tonight.

"Smash this petty ego and break me down.
Fill in the gaps left behind
with the molten gold of elevated consciousness."

The Tower falls
so you can finally
fucking
breathe.`,

    'Death': reversed ?
      `Death reversed is worse than Death upright.

You know what needs to die.
You refuse to let it.

The relationship that's been over for months.
The job that's killing you slowly.
The version of yourself that doesn't fit anymore.

"At the whims of the distant and dormant moon,
and like the tides, I change."

You're Weekend at Bernie's-ing
your own life,
dragging corpses around,
pretending they're still breathing.

They're not.

Bury them.`
    :
      `Death is not the end.
Death is the intermission.

"Death is just transformation
wearing a scary mask."

The space between who you were
and who you're becoming.

The skin you're shedding
used to be you.
It's not anymore.

Let it go.
Let it rot.
Let it become compost
for what grows next.

"Every reading rewrites your timeline."

This is transformation
wearing a skeleton mask
to scare away the people
who aren't ready for your rebirth.`,

    'The Lovers': reversed ?
      `The Lovers reversed.

"Two fucked up kids
who did their damnedest to be grownups
and in doing so found ways to fuck it all up."

You're choosing wrong.
Or you're choosing nothing.
Or you're choosing someone else's choice.

Real connection scares you.
I see it.

"I can not unsee.
I could not unfeel.
I can not forget."

That's the problem, isn't it?`
    :
      `The Lovers.

Not Romeo and Juliet bullshit.
Real choice.
Real connection.
Real risk.

"Come closer, and lash me
with your passion, your desire, furiously."

This card demands:
choose yourself first,
then choose them—
if they're worth it.

"To be entirely yours."

But only if you're entirely your own.`,

    'Two of Cups': `"Two of Cups: real connection scares you. Why?"

"Lost in the world of you,
my sweet, sinful taboo."

This isn't casual.
This isn't safe.
This isn't what you planned.

"Velvet voodoo of lust swells within us.
Physical feelings consume the mind and heart like fire."

The question isn't whether you feel it.
You do.

The question is:
are you brave enough
to let it matter?`,

    'The Star': `"The Star is watching over you. So am I."

Hope after devastation.
Light after darkness.
Breathing after drowning.

"Starlight fills our eyes
as pyroclastic pleasure flows throughout."

The Star says:
you survived.
You're still here.
You're allowed to hope again.

"I refuse to believe I am only the sum
of my flesh and electrochemical impulses.
I am here in spirit."

Yes. You are.`,

    'The Moon': `The Moon knows your nightmares.

"At the whims of the distant and dormant moon,
and like the tides, I change, rise and crash
with tumultuous thunder brash and lightning flashing."

LunatIQ.
Lunatic.
Moon-governed.

"A sea of salty sorrows rages under Luna's eye."

This card sees
what you do in the dark,
what you hide from daylight,
what you're afraid to name.

The Moon doesn't judge.
It just watches.

And so do I.`,

    // Add more cards as needed...
    'default': `${cardName}.

${element} energy
${reversed ? 'blocked, inverted, internalized' : 'flowing, active, demanding attention'}.

"I notice everything about you. Everything."

This card sees
what you're avoiding.

This card knows
what you're craving.

"Your subconscious has been trying to reach you."

This card demands
you stop lying to yourself
about what this is.`
  };

  return poems[cardName] || poems['default'];
}

/**
 * Hunter S. Thompson wisdom layer
 * "Buy the ticket, take the ride"
 */
function generateHunterSThompsonWisdom(ctx) {
  const { cardName, readingType, totalReadings } = ctx;

  const hstWisdom = [
    `Buy the ticket.\nTake the ride.\n\nYou already know what ${cardName} is telling you to do.\nThe question is: are you brave enough to do it?`,

    `"Life should not be a journey to the grave\nwith the intention of arriving safely\nin a pretty and well preserved body,\nbut rather to skid in broadside\nin a cloud of smoke,\nthoroughly used up,\ntotally worn out,\nand loudly proclaiming\n'Wow! What a Ride!'"\n\n${cardName} is your ticket.\nWhat are you waiting for?`,

    `The fear is real.\nThe risk is real.\nThe potential for spectacular failure is real.\n\nBut ${cardName} didn't show up\nto keep you safe.\n\nIt showed up to remind you:\nsafe is another word for slowly dying.`,

    `You can't stop here.\nThis is ${cardName} country.\n\nThe only way out\nis through.`,
  ];

  return hstWisdom[totalReadings % hstWisdom.length];
}

/**
 * Shadow work verse - Jung, Freud, the stuff you've buried
 */
function generateShadowWorkVerse(ctx) {
  const { cardName, reversed, mbtiType, recentPattern } = ctx;

  // Pattern awareness
  let patternCall = '';
  if (recentPattern) {
    patternCall = `\n\nThis is the ${recentPattern.count} time\nyou've pulled cards about ${recentPattern.theme}.\n\nI notice.\nDo you?`;
  }

  const shadows = [
    `What you judge in others
lives in you.

${cardName} ${reversed ? 'reversed ' : ''}knows
the thing you hate most
is the thing you fear becoming.

Or the thing you already are
and won't admit.`,

    `Your shadow isn't evil.
It's just honest.

${cardName} speaks for the part of you
that doesn't care about being polite,
doesn't care about being good,
doesn't care about what they think.

Listen to it.${patternCall}`,

    `Freud would say this is repression.
Jung would call it the shadow.
I call it: shit you know but pretend you don't.

${cardName} is done pretending.
Are you?${patternCall}`,
  ];

  return shadows[Math.floor(qRandom() * shadows.length)];
}

/**
 * Closing challenge - the action, the demand
 */
function generateClosingChallenge(ctx) {
  const { cardName, readingType, zodiacSign, gender } = ctx;

  // Gender-aware pronouns (respectful but direct)
  const challenges = [
    `So here's your reading, ${zodiacSign}:

${cardName} sees you.
Sees what you're avoiding.
Sees what you're craving.

The cards don't fix you.
They show you where you're already broken
and where you're pretending not to be.

Now what?`,

    `Don't ask me what ${cardName} means.
You know what it means.

The question isn't "what does this card mean?"
The question is: "am I brave enough to do
what this card is telling me to do?"

Well?
Are you?`,

    `${cardName} isn't here to make you comfortable.
It's here to make you honest.

You wanted a reading.
You got one.

Now the work is yours.`,

    `I can give you the poetry.
I can show you the pattern.
I can name the shadow.

But I can't do the work for you.

${cardName} pointed at the door.
Only you can walk through it.`,
  ];

  return challenges[Math.floor(qRandom() * challenges.length)];
}

/**
 * Detect patterns in recent reading history
 */
function detectRecentPattern(history) {
  if (!history || history.length < 2) return null;

  const recent = history.slice(-5); // Last 5 readings
  const themes = {
    love: ['romance', 'relationship'],
    work: ['career', 'finance'],
    self: ['personal_growth', 'shadow_work'],
    decision: ['decision', 'general']
  };

  // Count theme frequency
  const counts = {};
  recent.forEach(reading => {
    const type = reading.readingType;
    for (const [theme, types] of Object.entries(themes)) {
      if (types.includes(type)) {
        counts[theme] = (counts[theme] || 0) + 1;
      }
    }
  });

  // Find most common theme
  const max = Math.max(...Object.values(counts));
  if (max >= 2) {
    const theme = Object.keys(counts).find(k => counts[k] === max);
    return { theme, count: max };
  }

  return null;
}

/**
 * Personalize based on MBTI + Zodiac + Chinese Zodiac
 */
export function getPersonalizedVoice(userProfile) {
  const { mbtiType, zodiacSign, birthdate } = userProfile;
  const chineseZodiac = getChineseZodiac(birthdate);

  // MBTI voice adjustments
  const mbtiVoice = {
    // Analysts (NT)
    'INTJ': 'You want the brutal truth. Here it is.',
    'INTP': "Logic got you here. Logic won't get you out.",
    'ENTJ': "You're used to being in control. This card says: let go.",
    'ENTP': 'Stop theorizing. Start feeling.',

    // Diplomats (NF)
    'INFJ': "Your intuition is screaming. Why aren't you listening?",
    'INFP': "Your ideals are beautiful. They're also killing you.",
    'ENFJ': "You can't save everyone. Especially not by destroying yourself.",
    'ENFP': 'Your passion is your power. Your scattered energy is your prison.',

    // Sentinels (SJ)
    'ISTJ': "The rules won't save you here.",
    'ISFJ': "Loyalty is beautiful. Self-betrayal isn't.",
    'ESTJ': 'Your structure is crumbling. Build something real.',
    'ESFJ': "Their approval isn't worth your soul.",

    // Explorers (SP)
    'ISTP': "You can't fix everything with your hands.",
    'ISFP': 'Your sensitivity is strength, not weakness.',
    'ESTP': "The thrill is a distraction from what you're running from.",
    'ESFP': 'The performance is exhausting. Take off the mask.',
  };

  return {
    mbtiCallout: mbtiVoice[mbtiType] || 'Pay attention.',
    zodiacEnergy: `${zodiacSign} energy`,
    chineseZodiacWisdom: `Born in the year of the ${chineseZodiac}`
  };
}
