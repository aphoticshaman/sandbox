/**
 * VeilPath Tarot - Card Image Registry
 * Complete mapping of all 78 tarot cards to their image assets
 *
 * This file provides the require() mappings needed for React Native
 * to properly bundle and resolve card images at runtime.
 *
 * IMPORTANT: React Native requires static require() calls - dynamic paths won't work.
 * That's why every card must have an explicit require() statement.
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAJOR ARCANA (22 cards)
// ═══════════════════════════════════════════════════════════════════════════

const MAJOR_ARCANA = {
  fool: {
    id: 'fool',
    name: 'The Fool',
    arcana: 'major',
    number: 0,
    common: require('../../assets/art/card_art/common/fool.png'),
    rare: require('../../assets/art/card_art/rare/fool2.png'),
  },
  magician: {
    id: 'magician',
    name: 'The Magician',
    arcana: 'major',
    number: 1,
    common: require('../../assets/art/card_art/common/magician.png'),
    rare: require('../../assets/art/card_art/rare/magician2.png'),
  },
  highpriestess: {
    id: 'highpriestess',
    name: 'The High Priestess',
    arcana: 'major',
    number: 2,
    common: require('../../assets/art/card_art/common/highpriestess.png'),
    rare: require('../../assets/art/card_art/rare/highpriestess2.png'),
  },
  empress: {
    id: 'empress',
    name: 'The Empress',
    arcana: 'major',
    number: 3,
    common: require('../../assets/art/card_art/common/empress.png'),
    rare: require('../../assets/art/card_art/rare/empress2.png'),
  },
  emperor: {
    id: 'emperor',
    name: 'The Emperor',
    arcana: 'major',
    number: 4,
    common: require('../../assets/art/card_art/common/emperor.png'),
    rare: require('../../assets/art/card_art/rare/emperor2.png'),
  },
  hierophant: {
    id: 'hierophant',
    name: 'The Hierophant',
    arcana: 'major',
    number: 5,
    common: require('../../assets/art/card_art/common/hierophant.png'),
    rare: require('../../assets/art/card_art/rare/hierophant2.png'),
  },
  lovers: {
    id: 'lovers',
    name: 'The Lovers',
    arcana: 'major',
    number: 6,
    common: require('../../assets/art/card_art/common/lovers.png'),
    rare: require('../../assets/art/card_art/rare/lovers2.png'),
  },
  chariot: {
    id: 'chariot',
    name: 'The Chariot',
    arcana: 'major',
    number: 7,
    common: require('../../assets/art/card_art/common/chariot.png'),
    rare: require('../../assets/art/card_art/rare/chariot2.png'),
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    arcana: 'major',
    number: 8,
    common: require('../../assets/art/card_art/common/strength.png'),
    rare: require('../../assets/art/card_art/rare/strength2.png'),
  },
  hermit: {
    id: 'hermit',
    name: 'The Hermit',
    arcana: 'major',
    number: 9,
    common: require('../../assets/art/card_art/common/hermit.png'),
    rare: require('../../assets/art/card_art/rare/hermit2.png'),
  },
  wheeloffortune: {
    id: 'wheeloffortune',
    name: 'Wheel of Fortune',
    arcana: 'major',
    number: 10,
    common: require('../../assets/art/card_art/common/wheeloffortune.png'),
    rare: require('../../assets/art/card_art/rare/wheeloffortune2.png'),
  },
  justice: {
    id: 'justice',
    name: 'Justice',
    arcana: 'major',
    number: 11,
    common: require('../../assets/art/card_art/common/justice.png'),
    rare: require('../../assets/art/card_art/rare/justice2.png'),
  },
  hangedman: {
    id: 'hangedman',
    name: 'The Hanged Man',
    arcana: 'major',
    number: 12,
    common: require('../../assets/art/card_art/common/hangedman.png'),
    rare: require('../../assets/art/card_art/rare/hangedman2.png'),
  },
  death: {
    id: 'death',
    name: 'Death',
    arcana: 'major',
    number: 13,
    common: require('../../assets/art/card_art/common/death.png'),
    rare: require('../../assets/art/card_art/rare/death2.png'),
  },
  temperance: {
    id: 'temperance',
    name: 'Temperance',
    arcana: 'major',
    number: 14,
    common: require('../../assets/art/card_art/common/temperance.png'),
    rare: require('../../assets/art/card_art/rare/temperance2.png'),
  },
  devil: {
    id: 'devil',
    name: 'The Devil',
    arcana: 'major',
    number: 15,
    common: require('../../assets/art/card_art/common/devil.png'),
    rare: require('../../assets/art/card_art/rare/devil2.png'),
  },
  tower: {
    id: 'tower',
    name: 'The Tower',
    arcana: 'major',
    number: 16,
    common: require('../../assets/art/card_art/common/tower.png'),
    rare: require('../../assets/art/card_art/rare/tower2.png'),
  },
  star: {
    id: 'star',
    name: 'The Star',
    arcana: 'major',
    number: 17,
    common: require('../../assets/art/card_art/common/star.png'),
    rare: require('../../assets/art/card_art/rare/star2.png'),
  },
  moon: {
    id: 'moon',
    name: 'The Moon',
    arcana: 'major',
    number: 18,
    common: require('../../assets/art/card_art/common/moon.png'),
    rare: require('../../assets/art/card_art/rare/moon2.png'),
  },
  sun: {
    id: 'sun',
    name: 'The Sun',
    arcana: 'major',
    number: 19,
    common: require('../../assets/art/card_art/common/sun.png'),
    rare: require('../../assets/art/card_art/rare/sun2.png'),
  },
  // Note: Manifest uses 'judgement' but file is 'judgment.png'
  judgement: {
    id: 'judgement',
    name: 'Judgement',
    arcana: 'major',
    number: 20,
    common: require('../../assets/art/card_art/common/judgment.png'),
    rare: require('../../assets/art/card_art/rare/judgment2.png'),
  },
  world: {
    id: 'world',
    name: 'The World',
    arcana: 'major',
    number: 21,
    common: require('../../assets/art/card_art/common/world.png'),
    rare: require('../../assets/art/card_art/rare/world2.png'),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MINOR ARCANA - WANDS (14 cards)
// ═══════════════════════════════════════════════════════════════════════════

const WANDS = {
  acewands: {
    id: 'acewands',
    name: 'Ace of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 1,
    common: require('../../assets/art/card_art/common/acewands.png'),
    rare: require('../../assets/art/card_art/rare/acewands2.png'),
  },
  twowands: {
    id: 'twowands',
    name: 'Two of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 2,
    common: require('../../assets/art/card_art/common/twowands.png'),
    rare: require('../../assets/art/card_art/rare/twowands2.png'),
  },
  threewands: {
    id: 'threewands',
    name: 'Three of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 3,
    common: require('../../assets/art/card_art/common/threewands.png'),
    rare: require('../../assets/art/card_art/rare/threewands2.png'),
  },
  fourwands: {
    id: 'fourwands',
    name: 'Four of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 4,
    common: require('../../assets/art/card_art/common/fourwands.png'),
    rare: require('../../assets/art/card_art/rare/fourwands2.png'),
  },
  fivewands: {
    id: 'fivewands',
    name: 'Five of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 5,
    common: require('../../assets/art/card_art/common/fivewands.png'),
    rare: require('../../assets/art/card_art/rare/fivewands2.png'),
  },
  sixwands: {
    id: 'sixwands',
    name: 'Six of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 6,
    common: require('../../assets/art/card_art/common/sixwands.png'),
    rare: require('../../assets/art/card_art/rare/sixwands2.png'),
  },
  sevenwands: {
    id: 'sevenwands',
    name: 'Seven of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 7,
    common: require('../../assets/art/card_art/common/sevenwands.png'),
    rare: require('../../assets/art/card_art/rare/sevenwands2.png'),
  },
  eightwands: {
    id: 'eightwands',
    name: 'Eight of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 8,
    common: require('../../assets/art/card_art/common/eightwands.png'),
    rare: require('../../assets/art/card_art/rare/eightwands2.png'),
  },
  ninewands: {
    id: 'ninewands',
    name: 'Nine of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 9,
    common: require('../../assets/art/card_art/common/ninewands.png'),
    rare: require('../../assets/art/card_art/rare/ninewands2.png'),
  },
  tenwands: {
    id: 'tenwands',
    name: 'Ten of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 10,
    common: require('../../assets/art/card_art/common/tenwands.png'),
    rare: require('../../assets/art/card_art/rare/tenwands2.png'),
  },
  pagewands: {
    id: 'pagewands',
    name: 'Page of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 11,
    common: require('../../assets/art/card_art/common/pagewands.png'),
    rare: require('../../assets/art/card_art/rare/pagewands2.png'),
  },
  knightwands: {
    id: 'knightwands',
    name: 'Knight of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 12,
    common: require('../../assets/art/card_art/common/knightwands.png'),
    rare: require('../../assets/art/card_art/rare/knightwands2.png'),
  },
  queenwands: {
    id: 'queenwands',
    name: 'Queen of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 13,
    common: require('../../assets/art/card_art/common/queenwands.png'),
    rare: require('../../assets/art/card_art/rare/queenwands2.png'),
  },
  kingwands: {
    id: 'kingwands',
    name: 'King of Wands',
    arcana: 'minor',
    suit: 'wands',
    number: 14,
    common: require('../../assets/art/card_art/common/kingwands.png'),
    rare: require('../../assets/art/card_art/rare/kingwands2.png'),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MINOR ARCANA - CUPS (14 cards)
// ═══════════════════════════════════════════════════════════════════════════

const CUPS = {
  acecups: {
    id: 'acecups',
    name: 'Ace of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 1,
    common: require('../../assets/art/card_art/common/acecups.png'),
    rare: require('../../assets/art/card_art/rare/acecups2.png'),
  },
  twocups: {
    id: 'twocups',
    name: 'Two of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 2,
    common: require('../../assets/art/card_art/common/twocups.png'),
    rare: require('../../assets/art/card_art/rare/twocups2.png'),
  },
  threecups: {
    id: 'threecups',
    name: 'Three of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 3,
    common: require('../../assets/art/card_art/common/threecups.png'),
    rare: require('../../assets/art/card_art/rare/threecups2.png'),
  },
  fourcups: {
    id: 'fourcups',
    name: 'Four of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 4,
    common: require('../../assets/art/card_art/common/fourcups.png'),
    rare: require('../../assets/art/card_art/rare/fourcups2.png'),
  },
  fivecups: {
    id: 'fivecups',
    name: 'Five of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 5,
    common: require('../../assets/art/card_art/common/fivecups.png'),
    rare: require('../../assets/art/card_art/rare/fivecups2.png'),
  },
  sixcups: {
    id: 'sixcups',
    name: 'Six of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 6,
    common: require('../../assets/art/card_art/common/sixcups.png'),
    rare: require('../../assets/art/card_art/rare/sixcups2.png'),
  },
  sevencups: {
    id: 'sevencups',
    name: 'Seven of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 7,
    common: require('../../assets/art/card_art/common/sevencups.png'),
    rare: require('../../assets/art/card_art/rare/sevencups2.png'),
  },
  eightcups: {
    id: 'eightcups',
    name: 'Eight of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 8,
    common: require('../../assets/art/card_art/common/eightcups.png'),
    rare: require('../../assets/art/card_art/rare/eightcups2.png'),
  },
  ninecups: {
    id: 'ninecups',
    name: 'Nine of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 9,
    common: require('../../assets/art/card_art/common/ninecups.png'),
    rare: require('../../assets/art/card_art/rare/ninecups2.png'),
  },
  tencups: {
    id: 'tencups',
    name: 'Ten of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 10,
    common: require('../../assets/art/card_art/common/tencups.png'),
    rare: require('../../assets/art/card_art/rare/tencups2.png'),
  },
  pagecups: {
    id: 'pagecups',
    name: 'Page of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 11,
    common: require('../../assets/art/card_art/common/pagecups.png'),
    rare: require('../../assets/art/card_art/rare/pagecups2.png'),
  },
  knightcups: {
    id: 'knightcups',
    name: 'Knight of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 12,
    common: require('../../assets/art/card_art/common/knightcups.png'),
    rare: require('../../assets/art/card_art/rare/knightcups2.png'),
  },
  queencups: {
    id: 'queencups',
    name: 'Queen of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 13,
    common: require('../../assets/art/card_art/common/queencups.png'),
    rare: require('../../assets/art/card_art/rare/queencups2.png'),
  },
  kingcups: {
    id: 'kingcups',
    name: 'King of Cups',
    arcana: 'minor',
    suit: 'cups',
    number: 14,
    common: require('../../assets/art/card_art/common/kingcups.png'),
    rare: require('../../assets/art/card_art/rare/kingcups2.png'),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MINOR ARCANA - SWORDS (14 cards)
// ═══════════════════════════════════════════════════════════════════════════

const SWORDS = {
  aceswords: {
    id: 'aceswords',
    name: 'Ace of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 1,
    common: require('../../assets/art/card_art/common/aceswords.png'),
    rare: require('../../assets/art/card_art/rare/aceswords2.png'),
  },
  twoswords: {
    id: 'twoswords',
    name: 'Two of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 2,
    common: require('../../assets/art/card_art/common/twoswords.png'),
    rare: require('../../assets/art/card_art/rare/twoswords2.png'),
  },
  threeswords: {
    id: 'threeswords',
    name: 'Three of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 3,
    common: require('../../assets/art/card_art/common/threeswords.png'),
    rare: require('../../assets/art/card_art/rare/threeswords2.png'),
  },
  fourswords: {
    id: 'fourswords',
    name: 'Four of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 4,
    common: require('../../assets/art/card_art/common/fourswords.png'),
    rare: require('../../assets/art/card_art/rare/fourswords2.png'),
  },
  fiveswords: {
    id: 'fiveswords',
    name: 'Five of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 5,
    common: require('../../assets/art/card_art/common/fiveswords.png'),
    rare: require('../../assets/art/card_art/rare/fiveswords2.png'),
  },
  sixswords: {
    id: 'sixswords',
    name: 'Six of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 6,
    common: require('../../assets/art/card_art/common/sixswords.png'),
    rare: require('../../assets/art/card_art/rare/sixswords2.png'),
  },
  sevenswords: {
    id: 'sevenswords',
    name: 'Seven of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 7,
    common: require('../../assets/art/card_art/common/sevenswords.png'),
    rare: require('../../assets/art/card_art/rare/sevenswords2.png'),
  },
  eightswords: {
    id: 'eightswords',
    name: 'Eight of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 8,
    common: require('../../assets/art/card_art/common/eightswords.png'),
    rare: require('../../assets/art/card_art/rare/eightswords2.png'),
  },
  nineswords: {
    id: 'nineswords',
    name: 'Nine of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 9,
    common: require('../../assets/art/card_art/common/nineswords.png'),
    rare: require('../../assets/art/card_art/rare/nineswords2.png'),
  },
  tenswords: {
    id: 'tenswords',
    name: 'Ten of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 10,
    common: require('../../assets/art/card_art/common/tenswords.png'),
    rare: require('../../assets/art/card_art/rare/tenswords2.png'),
  },
  pageswords: {
    id: 'pageswords',
    name: 'Page of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 11,
    common: require('../../assets/art/card_art/common/pageswords.png'),
    rare: require('../../assets/art/card_art/rare/pageswords2.png'),
  },
  knightswords: {
    id: 'knightswords',
    name: 'Knight of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 12,
    common: require('../../assets/art/card_art/common/knightswords.png'),
    rare: require('../../assets/art/card_art/rare/knightswords2.png'),
  },
  queenswords: {
    id: 'queenswords',
    name: 'Queen of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 13,
    common: require('../../assets/art/card_art/common/queenswords.png'),
    rare: require('../../assets/art/card_art/rare/queenswords2.png'),
  },
  kingswords: {
    id: 'kingswords',
    name: 'King of Swords',
    arcana: 'minor',
    suit: 'swords',
    number: 14,
    common: require('../../assets/art/card_art/common/kingswords.png'),
    rare: require('../../assets/art/card_art/rare/kingswords2.png'),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MINOR ARCANA - PENTACLES (14 cards)
// ═══════════════════════════════════════════════════════════════════════════

const PENTACLES = {
  acepentacles: {
    id: 'acepentacles',
    name: 'Ace of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 1,
    common: require('../../assets/art/card_art/common/acepentacles.png'),
    rare: require('../../assets/art/card_art/rare/acepentacles2.png'),
  },
  twopentacles: {
    id: 'twopentacles',
    name: 'Two of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 2,
    common: require('../../assets/art/card_art/common/twopentacles.png'),
    rare: require('../../assets/art/card_art/rare/twopentacles2.png'),
  },
  threepentacles: {
    id: 'threepentacles',
    name: 'Three of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 3,
    common: require('../../assets/art/card_art/common/threepentacles.png'),
    rare: require('../../assets/art/card_art/rare/threepentacles2.png'),
  },
  fourpentacles: {
    id: 'fourpentacles',
    name: 'Four of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 4,
    common: require('../../assets/art/card_art/common/fourpentacles.png'),
    rare: require('../../assets/art/card_art/rare/fourpentacles2.png'),
  },
  fivepentacles: {
    id: 'fivepentacles',
    name: 'Five of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 5,
    common: require('../../assets/art/card_art/common/fivepentacles.png'),
    rare: require('../../assets/art/card_art/rare/fivepentacles2.png'),
  },
  sixpentacles: {
    id: 'sixpentacles',
    name: 'Six of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 6,
    common: require('../../assets/art/card_art/common/sixpentacles.png'),
    rare: require('../../assets/art/card_art/rare/sixpentacles2.png'),
  },
  sevenpentacles: {
    id: 'sevenpentacles',
    name: 'Seven of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 7,
    common: require('../../assets/art/card_art/common/sevenpentacles.png'),
    rare: require('../../assets/art/card_art/rare/sevenpentacles2.png'),
  },
  eightpentacles: {
    id: 'eightpentacles',
    name: 'Eight of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 8,
    common: require('../../assets/art/card_art/common/eightpentacles.png'),
    rare: require('../../assets/art/card_art/rare/eightpentacles2.png'),
  },
  ninepentacles: {
    id: 'ninepentacles',
    name: 'Nine of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 9,
    common: require('../../assets/art/card_art/common/ninepentacles.png'),
    rare: require('../../assets/art/card_art/rare/ninepentacles2.png'),
  },
  tenpentacles: {
    id: 'tenpentacles',
    name: 'Ten of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 10,
    common: require('../../assets/art/card_art/common/tenpentacles.png'),
    rare: require('../../assets/art/card_art/rare/tenpentacles2.png'),
  },
  pagepentacles: {
    id: 'pagepentacles',
    name: 'Page of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 11,
    common: require('../../assets/art/card_art/common/pagepentacles.png'),
    rare: require('../../assets/art/card_art/rare/pagepentacles2.png'),
  },
  knightpentacles: {
    id: 'knightpentacles',
    name: 'Knight of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 12,
    common: require('../../assets/art/card_art/common/knightpentacles.png'),
    rare: require('../../assets/art/card_art/rare/knightpentacles2.png'),
  },
  queenpentacles: {
    id: 'queenpentacles',
    name: 'Queen of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 13,
    common: require('../../assets/art/card_art/common/queenpentacles.png'),
    rare: require('../../assets/art/card_art/rare/queenpentacles2.png'),
  },
  kingpentacles: {
    id: 'kingpentacles',
    name: 'King of Pentacles',
    arcana: 'minor',
    suit: 'pentacles',
    number: 14,
    common: require('../../assets/art/card_art/common/kingpentacles.png'),
    rare: require('../../assets/art/card_art/rare/kingpentacles2.png'),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CARD BACK
// ═══════════════════════════════════════════════════════════════════════════

const CARD_BACK = require('../../assets/art/cardback/card_back.png');

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete registry of all 78 tarot cards
 */
export const CARD_REGISTRY = {
  ...MAJOR_ARCANA,
  ...WANDS,
  ...CUPS,
  ...SWORDS,
  ...PENTACLES,
};

/**
 * Grouped by suit/arcana for easier access
 */
export const CARDS_BY_GROUP = {
  major: MAJOR_ARCANA,
  wands: WANDS,
  cups: CUPS,
  swords: SWORDS,
  pentacles: PENTACLES,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get card image by ID
 * @param {string} cardId - Card identifier (e.g., 'fool', 'acewands')
 * @param {'common' | 'rare'} variant - Which art variant to use
 * @returns {number | null} - React Native image source or null if not found
 */
export function getCardImage(cardId, variant = 'common') {
  const card = CARD_REGISTRY[cardId];
  if (!card) {
    console.warn(`[CardImages] Unknown card ID: ${cardId}`);
    return null;
  }

  // Return requested variant, fall back to common if rare not available
  if (variant === 'rare' && card.rare) {
    return card.rare;
  }
  return card.common;
}

/**
 * Get card back image
 * @returns {number} - React Native image source for card back
 */
export function getCardBack() {
  return CARD_BACK;
}

/**
 * Get card metadata by ID
 * @param {string} cardId - Card identifier
 * @returns {Object | null} - Card metadata or null if not found
 */
export function getCardMeta(cardId) {
  const card = CARD_REGISTRY[cardId];
  if (!card) return null;

  return {
    id: card.id,
    name: card.name,
    arcana: card.arcana,
    suit: card.suit || null,
    number: card.number,
    hasRare: !!card.rare,
  };
}

/**
 * Get all cards in a suit
 * @param {'wands' | 'cups' | 'swords' | 'pentacles'} suit
 * @returns {Array} - Array of card entries
 */
export function getCardsBySuit(suit) {
  const group = CARDS_BY_GROUP[suit];
  if (!group) return [];
  return Object.values(group);
}

/**
 * Get all Major Arcana cards
 * @returns {Array} - Array of Major Arcana card entries
 */
export function getMajorArcana() {
  return Object.values(MAJOR_ARCANA);
}

/**
 * Get all Minor Arcana cards
 * @returns {Array} - Array of Minor Arcana card entries
 */
export function getMinorArcana() {
  return [
    ...Object.values(WANDS),
    ...Object.values(CUPS),
    ...Object.values(SWORDS),
    ...Object.values(PENTACLES),
  ];
}

/**
 * Get all card IDs
 * @returns {Array<string>} - Array of all card IDs
 */
export function getAllCardIds() {
  return Object.keys(CARD_REGISTRY);
}

/**
 * Check if a card has a rare variant
 * @param {string} cardId - Card identifier
 * @returns {boolean}
 */
export function hasRareVariant(cardId) {
  return !!CARD_REGISTRY[cardId]?.rare;
}

/**
 * Get all cards that have rare variants
 * @returns {Array<string>} - Array of card IDs with rare variants
 */
export function getCardsWithRareVariants() {
  return Object.keys(CARD_REGISTRY).filter(id => CARD_REGISTRY[id].rare);
}

/**
 * Get image for user's cosmetic card skin
 * @param {string} cardId - Base card identifier
 * @param {Object} userCosmetics - User's cosmetic inventory/preferences
 * @returns {number} - React Native image source
 */
export function getCardImageWithCosmetics(cardId, userCosmetics = {}) {
  const card = CARD_REGISTRY[cardId];
  if (!card) {
    return CARD_BACK; // Fallback to card back if unknown card
  }

  // Check if user has unlocked and equipped rare variant
  const unlockedRares = userCosmetics.unlockedRareCards || [];
  const equippedVariants = userCosmetics.equippedVariants || {};

  if (card.rare && unlockedRares.includes(cardId) && equippedVariants[cardId] === 'rare') {
    return card.rare;
  }

  return card.common;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate that all expected cards are present
 * @returns {{ valid: boolean, missing: string[], extra: string[] }}
 */
export function validateRegistry() {
  const expectedIds = [
    // Major Arcana
    'fool', 'magician', 'highpriestess', 'empress', 'emperor', 'hierophant',
    'lovers', 'chariot', 'strength', 'hermit', 'wheeloffortune', 'justice',
    'hangedman', 'death', 'temperance', 'devil', 'tower', 'star', 'moon',
    'sun', 'judgement', 'world',
    // Wands
    'acewands', 'twowands', 'threewands', 'fourwands', 'fivewands', 'sixwands',
    'sevenwands', 'eightwands', 'ninewands', 'tenwands', 'pagewands',
    'knightwands', 'queenwands', 'kingwands',
    // Cups
    'acecups', 'twocups', 'threecups', 'fourcups', 'fivecups', 'sixcups',
    'sevencups', 'eightcups', 'ninecups', 'tencups', 'pagecups',
    'knightcups', 'queencups', 'kingcups',
    // Swords
    'aceswords', 'twoswords', 'threeswords', 'fourswords', 'fiveswords', 'sixswords',
    'sevenswords', 'eightswords', 'nineswords', 'tenswords', 'pageswords',
    'knightswords', 'queenswords', 'kingswords',
    // Pentacles
    'acepentacles', 'twopentacles', 'threepentacles', 'fourpentacles', 'fivepentacles',
    'sixpentacles', 'sevenpentacles', 'eightpentacles', 'ninepentacles', 'tenpentacles',
    'pagepentacles', 'knightpentacles', 'queenpentacles', 'kingpentacles',
  ];

  const registryIds = Object.keys(CARD_REGISTRY);
  const missing = expectedIds.filter(id => !registryIds.includes(id));
  const extra = registryIds.filter(id => !expectedIds.includes(id));

  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra,
    total: registryIds.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default CARD_REGISTRY;

// Re-export individual groups for direct imports
export { MAJOR_ARCANA, WANDS, CUPS, SWORDS, PENTACLES, CARD_BACK };
