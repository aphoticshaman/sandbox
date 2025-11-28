/**
 * PROFILE SETUP SCREEN - Name and birthday entry
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Platform, Modal, Alert } from 'react-native';
import { NeonText, LPMUDText, MatrixRain } from '../components/TerminalEffects';
import { NEON_COLORS } from '../styles/cyberpunkColors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate Western zodiac sign from month/day
function getZodiacSign(month, day) {
  const zodiac = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] }
  ];

  for (const sign of zodiac) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign.name;
    }
  }

  return null;
}

// Calculate Chinese zodiac animal from birth year
function getChineseZodiac(year) {
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  // Chinese zodiac starts from 1900 (Year of the Rat)
  const baseYear = 1900;
  const index = (year - baseYear) % 12;
  return animals[index];
}

// Gender options
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Fluid', 'IDK'];

// Western Zodiac Descriptions (200-250 words each)
const WESTERN_ZODIAC_DESC = {
  'Aries': 'The fearless pioneer of the zodiac, Aries charges forward with raw courage and unapologetic authenticity. You don\'t wait for permission—you create your own path, fueled by an inner fire that refuses to dim. Your greatest strength is your willingness to begin, to take the first step when everyone else hesitates. But this same fire can burn bridges if left unchecked. Learning to pause, to channel your warrior energy with wisdom rather than impulse, is your life\'s work. You\'re here to lead, to inspire others through bold action, and to prove that fear is just fuel for transformation. The world needs your courage, but it also needs you to understand that true strength includes vulnerability and patience.',
  'Taurus': 'You are the embodiment of earth\'s steady power—grounded, sensual, and unshakeable when rooted in your values. While others chase fleeting trends, you build empires of beauty, comfort, and lasting worth. Your relationship with the physical world—food, touch, nature, art—runs deep. You understand that pleasure isn\'t frivolous; it\'s sacred. But your greatest challenge is the shadow side of stability: stubbornness that becomes rigidity, comfort that becomes stagnation. Growth asks you to release what no longer serves, even when letting go feels like tearing apart your foundation. You\'re learning that true security comes from within, not from external accumulation. When you master this, you become the alchemist who transforms raw earth into gold.',
  'Gemini': 'Your mind is a kaleidoscope, constantly shifting perspectives, connecting dots others can\'t see. You\'re the storyteller, the messenger, the one who translates complexity into clarity. Your superpower is adaptability—you can become anyone, speak any language, navigate any social terrain. But this gift becomes a curse when you lose yourself in the performance, when you become so many people that you forget who you actually are. Your life\'s work is integration: bringing all your fragmented selves into wholeness, finding your authentic voice beneath the clever words. When you ground your brilliant mind in embodied truth, you become the bridge between worlds, the translator of human experience.',
  'Cancer': 'You feel everything. The moon governs your tides, and you understand emotional truth in a way others can only theorize about. Your gift is your capacity to nurture, to create safe spaces where others can finally exhale. You\'re the keeper of memories, the guardian of home, the one who remembers everyone\'s birthday. But your challenge is learning that you can\'t heal the world by absorbing its pain, that empathy without boundaries destroys you. Your shell isn\'t armor—it\'s a necessary threshold. You\'re here to teach humanity about emotional intelligence, to model that feelings aren\'t weaknesses but portals to deeper wisdom. When you learn to mother yourself as fiercely as you mother others, you become unstoppable.',
  'Leo': 'You are solar fire incarnate—radiant, creative, impossible to ignore. You don\'t just enter rooms; you transform them with your presence. Your heart is generous to the point of recklessness, and you believe in magic because you are magic. But your shadow lurks in the need for constant validation, the performance that becomes prison. You\'re learning that true sovereignty doesn\'t require an audience, that your light doesn\'t dim when others shine. Your life\'s work is recognizing that you\'re already the main character in your own story—you don\'t need to prove it. When you step into authentic self-love rather than ego-driven performance, you become the sun that makes everything else grow.',
  'Virgo': 'You see what\'s broken and know how to fix it. Your mind is a precision instrument, analyzing, refining, perfecting. You serve others through excellence, through attention to details everyone else overlooks. But your greatest strength becomes your deepest wound when perfectionism turns into paralysis, when "not good enough" becomes your mantra. You\'re learning that wholeness doesn\'t require perfection, that your worth isn\'t measured by your productivity. Your sacred work is self-compassion—offering yourself the same grace you extend to others. When you integrate your critical mind with your tender heart, you become the healer who knows that true medicine begins with acceptance, not fixing.',
  'Libra': 'You are the diplomat, the artist, the one who sees beauty in balance. Your gift is your ability to hold multiple perspectives, to find harmony in chaos, to create peace where there was conflict. You understand that relationships are the crucible where we become fully human. But your shadow emerges in the loss of self, in the performance of agreeability, in avoiding confrontation at the cost of your truth. You\'re learning that real peace doesn\'t require you to silence your voice, that true partnership demands your full authentic presence. Your life\'s work is mastering the art of assertive grace—saying no with love, setting boundaries without guilt, standing in your truth while honoring others.',
  'Scorpio': 'You are the alchemist, the phoenix, the one who isn\'t afraid to descend into hell because you know resurrection awaits. Intensity is your native language—you don\'t do surface, you don\'t do shallow, you don\'t do fake. Your power lies in your willingness to face what others flee: death, sex, shadow, transformation. But your gift becomes poison when you weaponize it, when you manipulate instead of empower, when you hoard your power instead of sharing it. You\'re learning that true strength is vulnerability, that control is an illusion, that surrender is the path to rebirth. When you channel your depth toward healing rather than destruction, you become the guide who shows others that their darkness holds their greatest light.',
  'Sagittarius': 'You are the eternal optimist, the philosopher-adventurer who believes life is meant to be lived at full volume. Your spirit can\'t be caged—you need freedom like others need air. Your gift is your ability to find meaning in chaos, to see the big picture when others are lost in details, to inspire through your contagious faith in possibilities. But your shadow appears in reckless escapism, in spiritual bypassing, in running from commitment under the guise of "seeking." You\'re learning that true freedom isn\'t running away; it\'s the ability to stay and still feel expansive. Your work is grounding your vast vision in tangible reality, bringing your philosophy to earth.',
  'Capricorn': 'You are the mountain—steady, enduring, built to last. While others chase shortcuts, you understand that mastery requires time, that empires are built brick by brick. Your relationship with discipline borders on sacred; you know that structure isn\'t limitation—it\'s the foundation of true freedom. But your shadow emerges when ambition becomes addiction, when you climb so high you forget why you started, when achievement replaces authentic connection. You\'re learning that success without soul is hollow, that your worth isn\'t your resume. Your sacred work is integrating your heart with your hustle, remembering that the summit means nothing if you sacrificed your humanity to reach it.',
  'Aquarius': 'You are the revolutionary, the visionary who sees futures others can\'t imagine. You\'re wired differently—your mind operates on frequencies most people can\'t access. Your gift is your capacity to detach from groupthink, to question everything, to champion the underdog, to believe in human potential when evidence suggests otherwise. But your shadow lives in disconnection, in intellectualizing emotions, in sacrificing intimacy for ideology. You\'re learning that revolution begins with self, that you can\'t heal humanity while bypassing your own wounds. Your work is bringing your brilliant vision down from the clouds and into embodied relationship, remembering that we\'re all in this together.',
  'Pisces': 'You are the mystic, the empath, the one whose boundaries between self and universe blur. You feel the collective pain and joy as if it were your own because, to you, it is. Your gift is your capacity to channel the divine, to create art that heals, to love without conditions. You understand that reality is fluid, that magic is real, that we\'re all connected in ways science is only beginning to understand. But your shadow emerges in martyrdom, in losing yourself to save others, in escaping reality through addiction or fantasy. You\'re learning that true compassion includes yourself, that boundaries aren\'t betrayals, that you can be sensitive without being a victim. When you anchor your vast spirit in your body, you become the bridge between heaven and earth.'
};

// Chinese Zodiac Descriptions (200-250 words each)
const CHINESE_ZODIAC_DESC = {
  'Rat': 'Clever, resourceful, and quick-witted, the Rat is the zodiac\'s opportunist—in the best sense. You have an uncanny ability to spot potential where others see obstacles, to turn scarcity into abundance through sheer ingenuity. Your mind moves fast, connecting dots, solving problems, charming your way through closed doors. You\'re a natural survivor with impeccable instincts and the charisma to build powerful networks. But your shadow appears in restlessness, in hoarding resources out of fear, in manipulating situations for personal gain. You\'re learning that true wealth comes from generosity, that sometimes slowing down reveals opportunities speed would miss. Your life\'s work is balancing your sharp intelligence with compassion, using your gifts to uplift others, not just yourself.',
  'Ox': 'Steady, reliable, and impossibly strong, the Ox embodies patience and perseverance. When everyone else has given up, you\'re still plowing forward, one step at a time. You understand that greatness isn\'t built in sprints—it\'s the result of showing up daily, doing the work, honoring your commitments. Your word is your bond, and you create safety through your unwavering dependability. But your shadow lives in stubbornness, in refusing to pivot when the path changes, in sacrificing joy for duty. You\'re learning that flexibility isn\'t weakness, that rest is productive, that life isn\'t just about enduring—it\'s about thriving. Your work is softening your edges without losing your strength, discovering that vulnerability and power can coexist.',
  'Tiger': 'Courageous, passionate, and fiercely independent, the Tiger is the zodiac\'s warrior. You charge into life with confidence, unafraid to take risks, to challenge authority, to defend the defenseless. Your presence commands respect—you don\'t ask for permission; you take action. Your charisma is magnetic, your heart generous, your spirit untamed. But your shadow emerges in recklessness, in burning bridges, in mistaking pride for strength. You\'re learning that true power includes humility, that not every battle needs fighting, that collaboration doesn\'t diminish your sovereignty. Your life\'s work is channeling your warrior energy with wisdom, becoming the leader who inspires through both courage and compassion.',
  'Rabbit': 'Graceful, diplomatic, and deeply intuitive, the Rabbit moves through life with quiet elegance. You understand that softness is strength, that patience outplays aggression, that true power doesn\'t need to announce itself. Your gift is your ability to create harmony, to sense what others need before they ask, to navigate conflict with grace. You\'re the peacemaker, the artist, the one who finds beauty in simplicity. But your shadow appears in avoidance, in people-pleasing at the cost of your truth, in fleeing from necessary confrontation. You\'re learning that real peace requires honesty, that your voice matters, that you can be gentle without being weak. Your work is standing in your truth with the same grace you extend to others.',
  'Dragon': 'Powerful, visionary, and impossibly charismatic, the Dragon is the zodiac\'s force of nature. You don\'t just dream big—you manifest impossibilities, bend reality to your will, inspire others to believe in magic. Your presence is commanding, your confidence unshakeable, your potential limitless. You\'re meant for greatness, and you know it. But your shadow lives in ego, in arrogance, in assuming your vision is the only one that matters. You\'re learning that true leadership serves others, that power without humility becomes tyranny, that even dragons need community. Your life\'s work is using your immense gifts to uplift humanity, becoming the visionary who creates space for all voices, not just your own.',
  'Snake': 'Wise, mysterious, and deeply intuitive, the Snake operates in realms others fear to explore. You understand that truth lives beneath surfaces, that transformation requires death of the old, that wisdom is earned through shadow work. Your mind is strategic, your intuition razor-sharp, your presence hypnotic. You see through facades, sense hidden motives, and move with calculated grace. But your shadow emerges in manipulation, in hoarding knowledge as power, in isolation. You\'re learning that true wisdom is shared, that vulnerability is the ultimate strength, that connection heals what control cannot. Your work is using your depth to heal, not to manipulate, becoming the sage who guides others through their own transformations.',
  'Horse': 'Free-spirited, energetic, and wildly enthusiastic, the Horse can\'t be tamed. You need movement, adventure, wide-open spaces to run. Your optimism is infectious, your passion undeniable, your independence sacred. You inspire others through your courage to live authentically, to chase dreams, to refuse mediocrity. Your heart is generous, your spirit young, your faith in life unbreakable. But your shadow appears in restlessness, in running from intimacy, in mistaking freedom for lack of commitment. You\'re learning that true freedom isn\'t running away—it\'s the ability to stay and still feel expansive. Your work is grounding your wild spirit without clipping your wings, discovering that commitment can be liberating.',
  'Goat': 'Creative, gentle, and deeply artistic, the Goat sees beauty where others see chaos. You move through life guided by intuition and aesthetics, creating art, cultivating peace, nurturing what\'s tender. Your empathy runs deep, your heart is kind, and you believe in the power of gentleness. You\'re the dreamer, the artist, the one who reminds us that beauty matters. But your shadow lives in escapism, in avoiding responsibility, in expecting others to provide what only you can create. You\'re learning that sensitivity doesn\'t exempt you from life\'s demands, that your gifts require discipline to manifest. Your work is pairing your creativity with accountability, becoming the artist who builds sustainable beauty.',
  'Monkey': 'Clever, playful, and endlessly curious, the Monkey approaches life as a grand adventure. Your mind is quick, your humor sharp, your ability to adapt unmatched. You solve problems with creativity, navigate challenges with wit, and refuse to take life too seriously. Your gift is your capacity to find joy in chaos, to innovate when others follow formulas. But your shadow emerges in trickery, in using intelligence to manipulate, in avoiding depth through constant distraction. You\'re learning that true wisdom includes stillness, that not everything is a game, that depth and playfulness can coexist. Your work is channeling your brilliance toward meaningful impact, becoming the innovator who creates lasting value.',
  'Rooster': 'Confident, organized, and fiercely honest, the Rooster announces truth whether others want to hear it or not. You have high standards—for yourself and everyone else—and you believe integrity is non-negotiable. Your gift is your ability to cut through BS, to lead with clarity, to stand up for what\'s right even when it\'s unpopular. You\'re the truth-teller, the organizer, the one who demands excellence. But your shadow lives in self-righteousness, in criticism without compassion, in perfectionism that alienates. You\'re learning that honesty without kindness is cruelty, that people need grace as much as truth. Your work is softening your delivery without compromising your values, becoming the leader who inspires through both integrity and empathy.',
  'Dog': 'Loyal, protective, and deeply principled, the Dog is the zodiac\'s guardian. You show up for people unconditionally, fight for justice tirelessly, and embody integrity in every action. Your heart is pure, your loyalty unbreakable, your sense of right and wrong unwavering. You\'re the friend everyone calls in crisis, the one who never abandons their people. But your shadow emerges in anxiety, in carrying everyone\'s burdens, in martyrdom disguised as service. You\'re learning that you can\'t save everyone, that boundaries are love, that your worth isn\'t measured by your usefulness. Your work is extending yourself the same fierce loyalty you give others, becoming whole before trying to rescue the world.',
  'Pig': 'Generous, optimistic, and deeply compassionate, the Pig embodies abundance and joy. You believe in the goodness of people, the possibility of peace, and the importance of pleasure. Your heart is open, your spirit kind, and you create warmth wherever you go. You understand that life is meant to be enjoyed, that connection matters more than achievement, that giving freely creates wealth. But your shadow appears in naivety, in trusting the untrustworthy, in indulgence that becomes escapism. You\'re learning that discernment isn\'t cynicism, that boundaries protect your generosity, that you can be kind without being used. Your work is maintaining your beautiful heart while developing wise discernment, becoming the embodiment of grounded compassion.'
};

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState(null);
  const [zodiacSign, setZodiacSign] = useState(null);
  const [chineseZodiac, setChineseZodiac] = useState(null);
  const [error, setError] = useState('');
  const [showBackupWarning, setShowBackupWarning] = useState(false);

  // Input refs for auto-advance
  const nameInputRef = useRef(null);
  const monthInputRef = useRef(null);
  const dayInputRef = useRef(null);
  const yearInputRef = useRef(null);

  // Auto-focus name input on mount
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  }, []);

  // Auto-calculate Western zodiac sign
  useEffect(() => {
    if (month && day) {
      const m = parseInt(month);
      const d = parseInt(day);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const sign = getZodiacSign(m, d);
        setZodiacSign(sign);
        setError('');
      }
    }
  }, [month, day]);

  // Auto-calculate Chinese zodiac from year
  useEffect(() => {
    if (year && year.length === 4) {
      const y = parseInt(year);
      if (y >= 1900 && y <= 2025) {
        const animal = getChineseZodiac(y);
        setChineseZodiac(animal);
      }
    }
  }, [year]);

  // Handle month input with auto-advance
  const handleMonthChange = (text) => {
    // Only allow digits
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length <= 2) {
      setMonth(cleaned);
      setError('');

      // Auto-advance to day when month is complete (2 digits entered)
      if (cleaned.length === 2) {
        const monthNum = parseInt(cleaned);
        if (monthNum >= 1 && monthNum <= 12) {
          dayInputRef.current?.focus();
        }
      }
    }
  };

  // Handle day input with auto-advance
  const handleDayChange = (text) => {
    // Only allow digits
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length <= 2) {
      setDay(cleaned);
      setError('');

      // Auto-advance to year when day is complete (2 digits entered)
      if (cleaned.length === 2) {
        const dayNum = parseInt(cleaned);
        if (dayNum >= 1 && dayNum <= 31) {
          yearInputRef.current?.focus();
        }
      }
    }
  };

  // Handle year input
  const handleYearChange = (text) => {
    // Only allow digits
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length <= 4) {
      setYear(cleaned);
      setError('');
    }
  };

  const handleContinue = () => {
    // Validate
    if (!name.trim()) {
      setError('Enter a profile name');
      return;
    }

    if (!month || !day || !year) {
      setError('Enter complete birth date');
      return;
    }

    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);

    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2025) {
      setError('Invalid date');
      return;
    }

    if (!zodiacSign) {
      setError('Invalid date');
      return;
    }

    if (!gender) {
      setError('Please select gender');
      return;
    }

    // Show backup warning before proceeding
    setShowBackupWarning(true);
  };

  const proceedToMBTI = () => {
    setShowBackupWarning(false);

    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);

    // Go to MBTI personality test (50 questions)
    navigation.navigate('MBTITest', {
      userProfile: {
        profileName: name.trim(),
        birthdate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        zodiacSign,
        chineseZodiac,
        gender
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Matrix rain background */}
      <View style={StyleSheet.absoluteFill}>
        <MatrixRain width={SCREEN_WIDTH} height={SCREEN_HEIGHT} speed={30} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LPMUDText style={styles.headerTitle}>
            $HIM${'>'} CREATE PROFILE$NOR$
          </LPMUDText>
        </View>

        {/* Name input */}
        <View style={styles.section}>
          <LPMUDText style={styles.label}>
            $HIY${'>'} PROFILE NAME$NOR$
          </LPMUDText>
          <TextInput
            ref={nameInputRef}
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor={NEON_COLORS.dimCyan}
            maxLength={20}
            returnKeyType="next"
            onSubmitEditing={() => monthInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        {/* Birthday input */}
        <View style={styles.section}>
          <LPMUDText style={styles.label}>
            $HIY${'>'} BIRTH DATE$NOR$
          </LPMUDText>
          <View style={styles.dateRow}>
            <View style={styles.inputBox}>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.inputLabel}>
                MM
              </NeonText>
              <TextInput
                ref={monthInputRef}
                style={styles.input}
                value={month}
                onChangeText={handleMonthChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor={NEON_COLORS.dimCyan}
              />
            </View>

            <View style={styles.inputBox}>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.inputLabel}>
                DD
              </NeonText>
              <TextInput
                ref={dayInputRef}
                style={styles.input}
                value={day}
                onChangeText={handleDayChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="DD"
                placeholderTextColor={NEON_COLORS.dimCyan}
              />
            </View>

            <View style={styles.inputBox}>
              <NeonText color={NEON_COLORS.dimCyan} style={styles.inputLabel}>
                YYYY
              </NeonText>
              <TextInput
                ref={yearInputRef}
                style={styles.input}
                value={year}
                onChangeText={handleYearChange}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="YYYY"
                placeholderTextColor={NEON_COLORS.dimCyan}
              />
            </View>
          </View>

          {/* Western Zodiac Display */}
          {zodiacSign && (
            <View style={styles.zodiacContainer}>
              <LPMUDText style={styles.zodiacTitle}>
                $HIM${'>'} WESTERN ZODIAC: $HIW${zodiacSign.toUpperCase()}$NOR$
              </LPMUDText>
              <ScrollView style={styles.descriptionScroll} nestedScrollEnabled={true}>
                <NeonText color={NEON_COLORS.dimWhite} style={styles.descriptionText}>
                  {WESTERN_ZODIAC_DESC[zodiacSign]}
                </NeonText>
              </ScrollView>
            </View>
          )}

          {/* Chinese Zodiac Display */}
          {chineseZodiac && (
            <View style={styles.zodiacContainer}>
              <LPMUDText style={styles.zodiacTitle}>
                $HIM${'>'} CHINESE ZODIAC: $HIW${chineseZodiac.toUpperCase()}$NOR$
              </LPMUDText>
              <ScrollView style={styles.descriptionScroll} nestedScrollEnabled={true}>
                <NeonText color={NEON_COLORS.dimWhite} style={styles.descriptionText}>
                  {CHINESE_ZODIAC_DESC[chineseZodiac]}
                </NeonText>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Gender Selection */}
        {zodiacSign && chineseZodiac && (
          <View style={styles.section}>
            <LPMUDText style={styles.label}>
              $HIY${'>'} GENDER$NOR$
            </LPMUDText>
            <View style={styles.genderGrid}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderButton,
                    gender === option && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender(option)}
                >
                  <LPMUDText style={[
                    styles.genderButtonText,
                    gender === option && styles.genderButtonTextSelected
                  ]}>
                    {gender === option ? '$HIG$' : '$NOR$'}{option}$NOR$
                  </LPMUDText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Error */}
        {error && (
          <NeonText color={NEON_COLORS.hiRed} style={styles.errorText}>
            {'>'} {error}
          </NeonText>
        )}

        {/* Continue button */}
        <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
          <LPMUDText style={styles.continueButtonText}>
            $HIC${'[ '} $HIW$CONTINUE TO QUESTIONS$NOR$ $HIC${' ]'}$NOR$
          </LPMUDText>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <NeonText color={NEON_COLORS.dimCyan} style={styles.backButtonText}>
            {'[ ← BACK ]'}
          </NeonText>
        </TouchableOpacity>
      </ScrollView>

      {/* BACKUP WARNING MODAL */}
      <Modal
        visible={showBackupWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBackupWarning(false)}
      >
        <View style={styles.warningModalOverlay}>
          <View style={styles.warningModalContent}>
            <View style={styles.warningHeader}>
              <LPMUDText style={styles.warningTitle}>
                $HIW$⚠ CRITICAL: DATA BACKUP WARNING ⚠$NOR$
              </LPMUDText>
            </View>

            <View style={styles.warningBody}>
              <NeonText color={NEON_COLORS.hiYellow} style={styles.warningText}>
                ⚠ NO CLOUD BACKUP{'\n'}
                ⚠ NO REMOTE SERVERS{'\n'}
                ⚠ LOCAL STORAGE ONLY
              </NeonText>

              <NeonText color={NEON_COLORS.hiWhite} style={styles.warningMessage}>
                YOUR DATA WILL BE LOST IF:
              </NeonText>

              <NeonText color={NEON_COLORS.hiRed} style={styles.warningList}>
                • You uninstall this app{'\n'}
                • You clear app data{'\n'}
                • Your device is lost/damaged{'\n'}
                • You factory reset your phone
              </NeonText>

              <NeonText color={NEON_COLORS.hiGreen} style={styles.warningMessage}>
                YOU ARE RESPONSIBLE FOR:
              </NeonText>

              <NeonText color={NEON_COLORS.dimGreen} style={styles.warningList}>
                • Backing up your profile regularly{'\n'}
                • Exporting your reading history{'\n'}
                • Storing backups safely
              </NeonText>

              <NeonText color={NEON_COLORS.hiYellow} style={styles.warningFooter}>
                Use the Backup feature in Settings to export your data!
              </NeonText>
            </View>

            <View style={styles.warningButtons}>
              <TouchableOpacity
                style={styles.warningCancelButton}
                onPress={() => setShowBackupWarning(false)}
              >
                <NeonText color={NEON_COLORS.dimCyan} style={styles.warningButtonText}>
                  [ CANCEL ]
                </NeonText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.warningProceedButton}
                onPress={proceedToMBTI}
              >
                <LPMUDText style={styles.warningProceedText}>
                  $HIW$[ I UNDERSTAND - PROCEED ]$NOR$
                </LPMUDText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: NEON_COLORS.dimCyan,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    lineHeight: 22,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 10,
    lineHeight: 18,
  },
  nameInput: {
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    padding: 15,
    fontSize: 16,
    fontFamily: 'monospace',
    color: NEON_COLORS.hiWhite,
    backgroundColor: '#000000',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    padding: 10,
    backgroundColor: '#000000',
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  input: {
    color: NEON_COLORS.hiCyan,
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    backgroundColor: '#000000',
    textAlign: 'center',
  },
  zodiacContainer: {
    marginTop: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiMagenta,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
  },
  zodiacTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 10,
    lineHeight: 18,
  },
  descriptionScroll: {
    maxHeight: 150,
  },
  descriptionText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: NEON_COLORS.hiGreen,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  genderButtonText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  genderButtonTextSelected: {
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  continueButton: {
    padding: 18,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiCyan,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    marginTop: 20,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: NEON_COLORS.dimCyan,
    alignItems: 'center',
    marginTop: 15,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  // Warning modal styles
  warningModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningModalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#0a0a0a',
    borderWidth: 4,
    borderColor: NEON_COLORS.hiRed,
    borderRadius: 8,
    overflow: 'hidden',
  },
  warningHeader: {
    backgroundColor: NEON_COLORS.hiRed,
    padding: 15,
    borderBottomWidth: 3,
    borderBottomColor: NEON_COLORS.hiYellow,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  warningBody: {
    padding: 25,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  warningMessage: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
  },
  warningList: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 20,
    marginLeft: 10,
  },
  warningFooter: {
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  },
  warningButtons: {
    flexDirection: 'row',
    borderTopWidth: 3,
    borderTopColor: NEON_COLORS.hiRed,
    padding: 15,
    gap: 10,
  },
  warningCancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: NEON_COLORS.dimCyan,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningProceedButton: {
    flex: 2,
    padding: 15,
    backgroundColor: NEON_COLORS.hiRed,
    borderWidth: 2,
    borderColor: NEON_COLORS.hiYellow,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningButtonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  warningProceedText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});
