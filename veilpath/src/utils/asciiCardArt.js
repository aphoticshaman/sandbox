/**
 * ASCII CARD ART GENERATOR
 * S-tier retro-cyberpunk tarot card designs
 * Procedural generation for all 78 cards with Blizzard polish
 */

import { qRandom } from './quantumRNG';

/**
 * CARD BACK DESIGN
 * One unified design for all face-down cards
 * Quantum/cyberpunk aesthetic with MINDPATH branding
 */
export const CARD_BACK_ASCII = `
╔═══════════════════╗
║   ╭─────────╮     ║
║   │ ⟨ψ|ψ⟩   │     ║
║   ╰─────────╯     ║
║                   ║
║   L U N A T I Q   ║
║                   ║
║  Quantum  Tarot   ║
║                   ║
║   ╭─────────╮     ║
║   │  ⟨ψ⟩    │     ║
║   ╰─────────╯     ║
╚═══════════════════╝
`;

/**
 * SUIT SYMBOLS
 * Cyberpunk-inspired interpretations of traditional suits
 */
const SUIT_SYMBOLS = {
  wands: {
    symbol: '⚡',
    ascii: '▲',
    element: 'FIRE',
    theme: 'ACTION',
  },
  cups: {
    symbol: '◈',
    ascii: '◇',
    element: 'WATER',
    theme: 'EMOTION',
  },
  swords: {
    symbol: '†',
    ascii: '┼',
    element: 'AIR',
    theme: 'INTELLECT',
  },
  pentacles: {
    symbol: '◉',
    ascii: '●',
    element: 'EARTH',
    theme: 'MATERIAL',
  },
};

/**
 * MAJOR ARCANA SYMBOLS
 * Unique ASCII art for each major arcana card
 */
const MAJOR_ARCANA_ART = {
  'The Fool': `
    ╭───╮
    │ 0 │
    ╰───╯
   ╱     ╲
  ◎   ?   ◎
   ╲     ╱
`,
  'The Magician': `
    ∞
   ╱│╲
  │ I │
  │ λ │
   ╲│╱
`,
  'The High Priestess': `
   ═══
  ╱ ☾ ╲
 │ II  │
 │ ≈≈  │
  ╲___╱
`,
  'The Empress': `
   ♀
  ╱═╲
 │III│
 │♥♥♥│
  ╲═╱
`,
  'The Emperor': `
   ♂
  ╱═╲
 │ IV│
 │▓▓▓│
  ╲═╱
`,
  'The Hierophant': `
   †
  ╱═╲
 │ V │
 │═══│
  ╲═╱
`,
  'The Lovers': `
  ◎ ◎
   ╲╱
  │VI│
  │♥♥│
   ══
`,
  'The Chariot': `
  ┌─┐
  │▼│
 │VII│
 │═╬═│
  └┬┘
`,
  'Strength': `
   ∞
  ╱◎╲
 │VIII│
 │ ≋ │
  ╲═╱
`,
  'The Hermit': `
    ☆
   ╱│╲
  │IX│
  │ ◈ │
   ╲│╱
`,
  'Wheel of Fortune': `
  ◉═◉
  ║ X║
  ◉═◉
   ╰╯
`,
  'Justice': `
   ⚖
  ╱═╲
 │ XI│
 │═══│
  ╲═╱
`,
  'The Hanged Man': `
   ═══
   │◎│
  │XII│
  ╱ ╲
`,
  'Death': `
   ☠
  ╱═╲
 │XIII│
 │≈≈≈│
  ╲═╱
`,
  'Temperance': `
   ◈
  ╱☯╲
 │XIV│
 │≈♥≈│
  ╲═╱
`,
  'The Devil': `
   ⛧
  ╱═╲
 │ XV│
 │◉◉◉│
  ╲═╱
`,
  'The Tower': `
   ⚡
  ║▓║
 │XVI│
  ║▓║
   ▼
`,
  'The Star': `
   ✦
  ◦ ◦
 │XVII│
 ◦ ☆ ◦
  ◦ ◦
`,
  'The Moon': `
   ☾
  ◦ ◦
 │XVIII│
 ≈≈≈
  ◦ ◦
`,
  'The Sun': `
   ☀
  ╱═╲
 │XIX│
 │♥◈♥│
  ╲═╱
`,
  'Judgement': `
   ♪
  ╱═╲
 │ XX│
 │◎◎◎│
  ╲═╱
`,
  'The World': `
  ═╗╔═
  ║◎║
 │XXI│
  ║♥║
  ═╝╚═
`,
};

/**
 * Generate ASCII art for a minor arcana card
 * @param {string} suit - wands, cups, swords, pentacles
 * @param {number} rank - 1-14 (1=Ace, 11=Page, 12=Knight, 13=Queen, 14=King)
 * @returns {string} ASCII art
 */
function generateMinorArcanaArt(suit, rank) {
  const suitData = SUIT_SYMBOLS[suit.toLowerCase()];
  if (!suitData) return '';

  // Court cards
  if (rank === 11) return generateCourtCard(suitData, 'PAGE');
  if (rank === 12) return generateCourtCard(suitData, 'KNIGHT');
  if (rank === 13) return generateCourtCard(suitData, 'QUEEN');
  if (rank === 14) return generateCourtCard(suitData, 'KING');

  // Number cards (Ace - 10)
  const displayRank = rank === 1 ? 'A' : rank.toString();
  const symbols = suitData.ascii;

  // Arrange symbols based on rank (pip layout)
  let symbolLayout = '';

  if (rank === 1) {
    // Ace - single large symbol
    symbolLayout = `
    ╔═══╗
    ║   ║
    ║ ${symbols} ║
    ║   ║
    ╚═══╝
`;
  } else if (rank === 2) {
    symbolLayout = `
    ${symbols}



    ${symbols}
`;
  } else if (rank === 3) {
    symbolLayout = `
    ${symbols}

    ${symbols}

    ${symbols}
`;
  } else if (rank === 4) {
    symbolLayout = `
   ${symbols}   ${symbols}



   ${symbols}   ${symbols}
`;
  } else if (rank === 5) {
    symbolLayout = `
   ${symbols}   ${symbols}

     ${symbols}

   ${symbols}   ${symbols}
`;
  } else if (rank === 6) {
    symbolLayout = `
   ${symbols}   ${symbols}

   ${symbols}   ${symbols}

   ${symbols}   ${symbols}
`;
  } else if (rank === 7) {
    symbolLayout = `
   ${symbols}   ${symbols}
     ${symbols}
   ${symbols}   ${symbols}
     ${symbols}
   ${symbols}   ${symbols}
`;
  } else if (rank === 8) {
    symbolLayout = `
   ${symbols} ${symbols} ${symbols}

   ${symbols}   ${symbols}

   ${symbols} ${symbols} ${symbols}
`;
  } else if (rank === 9) {
    symbolLayout = `
   ${symbols} ${symbols} ${symbols}

   ${symbols} ${symbols} ${symbols}

   ${symbols} ${symbols} ${symbols}
`;
  } else if (rank === 10) {
    symbolLayout = `
   ${symbols} ${symbols} ${symbols}
   ${symbols}   ${symbols}
   ${symbols} ${symbols} ${symbols}
   ${symbols}   ${symbols}
`;
  }

  return `
╭─────────────╮
│ ${displayRank}  ${suitData.element.slice(0, 4).padEnd(4)} │
│             │
${symbolLayout}
│             │
│ ${suitData.theme.slice(0, 7).padEnd(7)} │
╰─────────────╯
`;
}

/**
 * Generate ASCII art for court cards
 */
function generateCourtCard(suitData, rank) {
  const rankSymbols = {
    'PAGE': '◈',
    'KNIGHT': '⚔',
    'QUEEN': '♛',
    'KING': '♚',
  };

  const symbol = rankSymbols[rank];
  const s = suitData.ascii;

  return `
╭─────────────╮
│ ${rank.slice(0, 1)}  ${suitData.element.slice(0, 4).padEnd(4)} │
│             │
│    ${symbol}      │
│   ╱ ╲     │
│  ${s}   ${s}    │
│   ╲_╱     │
│             │
│ ${suitData.theme.slice(0, 7).padEnd(7)} │
╰─────────────╯
`;
}

/**
 * Main function to get ASCII art for any tarot card
 * @param {string} cardName - Full card name (e.g., "The Fool", "Ace of Wands", "King of Cups")
 * @param {boolean} reversed - If card is reversed
 * @returns {string} ASCII art for the card
 */
export function getCardArt(cardName, reversed = false) {
  // Check if it's a Major Arcana card
  if (MAJOR_ARCANA_ART[cardName]) {
    let art = MAJOR_ARCANA_ART[cardName];

    // Add reversed indicator
    if (reversed) {
      art = `
╔═══════════════╗
║   REVERSED    ║
${art}
╚═══════════════╝
`;
    }

    return art;
  }

  // Parse Minor Arcana card name
  const match = cardName.match(/^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Wands|Cups|Swords|Pentacles)$/i);

  if (!match) {
    // Fallback for unrecognized card
    return `
╔═══════════════╗
║               ║
║  ${cardName.slice(0, 13).padEnd(13)}  ║
║               ║
╚═══════════════╝
`;
  }

  const [, rankName, suit] = match;

  // Convert rank name to number
  const rankMap = {
    'ace': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'page': 11, 'knight': 12, 'queen': 13, 'king': 14,
  };

  const rank = rankMap[rankName.toLowerCase()];
  let art = generateMinorArcanaArt(suit, rank);

  // Add reversed indicator
  if (reversed) {
    art = `
  [REVERSED]
${art}
`;
  }

  return art;
}

/**
 * Get compact version of card art for smaller displays
 * @param {string} cardName
 * @param {boolean} reversed
 * @returns {string} Compact ASCII art
 */
export function getCompactCardArt(cardName, reversed = false) {
  // Major Arcana - just show number and symbol
  if (MAJOR_ARCANA_ART[cardName]) {
    const lines = MAJOR_ARCANA_ART[cardName].trim().split('\n');
    const symbolLine = lines[0] || '?';
    const numberLine = lines[2] || '';

    return `
  ${symbolLine}
 ${numberLine}
${reversed ? ' [R]' : ''}
`.trim();
  }

  // Minor Arcana - show suit symbol and rank
  const match = cardName.match(/^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Wands|Cups|Swords|Pentacles)$/i);

  if (match) {
    const [, rankName, suit] = match;
    const suitData = SUIT_SYMBOLS[suit.toLowerCase()];
    const rankShort = rankName[0];

    return `
  ${suitData.symbol}
 ${rankShort}${reversed ? 'R' : ''}
`.trim();
  }

  return '?';
}

/**
 * Get card border/frame style based on card type
 * @param {string} cardName
 * @returns {object} Border styling info
 */
export function getCardBorderStyle(cardName) {
  // Major Arcana - special borders
  if (MAJOR_ARCANA_ART[cardName]) {
    return {
      style: 'double',
      color: 'hiMagenta',
      glow: true,
    };
  }

  // Minor Arcana - suit-based borders
  if (cardName.includes('Wands')) {
    return { style: 'single', color: 'hiRed', glow: false };
  }
  if (cardName.includes('Cups')) {
    return { style: 'single', color: 'hiCyan', glow: false };
  }
  if (cardName.includes('Swords')) {
    return { style: 'single', color: 'hiYellow', glow: false };
  }
  if (cardName.includes('Pentacles')) {
    return { style: 'single', color: 'hiGreen', glow: false };
  }

  return { style: 'single', color: 'dimCyan', glow: false };
}

/**
 * Get cyberpunk glitch variant of card art
 * Randomly corrupts some characters for visual effect
 * @param {string} art
 * @param {number} glitchIntensity - 0.0 to 1.0
 * @returns {string}
 */
export function getGlitchedCardArt(art, glitchIntensity = 0.1) {
  const glitchChars = ['▓', '▒', '░', '█', '▄', '▀', '╳', '╱', '╲'];

  return art.split('').map(char => {
    if (char === ' ' || char === '\n') return char;
    if (qRandom() < glitchIntensity) {
      return glitchChars[Math.floor(qRandom() * glitchChars.length)];
    }
    return char;
  }).join('');
}
