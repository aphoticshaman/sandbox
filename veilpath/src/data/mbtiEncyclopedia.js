/**
 * MBTI Encyclopedia Data
 * Comprehensive personality type information for VeilPath
 * Each type has 250-500 word descriptions with tarot connections
 */

export const MBTI_OVERVIEW = {
  title: "The Myers-Briggs Type Indicator",
  introduction: `The Myers-Briggs Type Indicator (MBTI) is a framework for understanding personality differences based on Carl Jung's theory of psychological types. It maps how people perceive the world and make decisions across four dimensions, creating 16 distinct personality types.

In VeilPath, your MBTI type helps Vera tailor card interpretations to resonate with your unique cognitive style. An INTJ receives strategic, vision-focused readings, while an ESFP gets dynamic, action-oriented guidance.`,

  dimensions: [
    {
      name: "Energy Direction",
      poles: ["Introversion (I)", "Extraversion (E)"],
      description: "Where you draw energy from - inner reflection or outer engagement"
    },
    {
      name: "Information Gathering",
      poles: ["Sensing (S)", "Intuition (N)"],
      description: "How you take in information - concrete details or patterns and possibilities"
    },
    {
      name: "Decision Making",
      poles: ["Thinking (T)", "Feeling (F)"],
      description: "How you make decisions - logical analysis or values and impact on people"
    },
    {
      name: "Lifestyle Orientation",
      poles: ["Judging (J)", "Perceiving (P)"],
      description: "How you approach the outer world - structured planning or flexible adaptation"
    }
  ],

  cognitiveFunctions: `Each type uses four primary cognitive functions in a specific order called the "function stack." The dominant function is your strongest tool, followed by auxiliary, tertiary, and inferior functions. Understanding your stack reveals why certain tarot cards resonate deeply while others challenge you to grow.`
};

export const MBTI_TYPES = {
  // ============== ANALYSTS (NT) ==============
  INTJ: {
    code: "INTJ",
    nickname: "The Architect",
    element: "air",
    tarotAffinity: "swords",
    cognitiveFunctions: ["Ni", "Te", "Fi", "Se"],
    summary: "Strategic visionaries who see patterns others miss and build systems to achieve their goals.",

    fullDescription: `INTJs are strategic masterminds who combine powerful intuition with logical precision. Known as "The Architect," this type sees the world as a chess board where every move has long-term consequences. They excel at recognizing patterns, predicting outcomes, and constructing systems that turn vision into reality.

At their core, INTJs lead with Introverted Intuition (Ni) - a deep, almost mystical ability to perceive underlying patterns and future possibilities. This gives them an uncanny sense of "knowing" how things will unfold. Their auxiliary Extraverted Thinking (Te) provides the organizational power to implement their visions efficiently.

INTJs approach tarot as a strategic tool rather than mere fortune-telling. They appreciate the archetypal symbolism and use readings to refine their long-term plans. The Swords suit resonates strongly, reflecting their analytical nature. Cards like The Magician (manifesting will), The Emperor (strategic authority), and Justice (logical balance) speak directly to their worldview.

In relationships, INTJs value intellectual connection and shared vision. They may struggle with emotional expression, but their loyalty runs deep. Their inferior Se means they can neglect present-moment pleasures and physical needs while pursuing abstract goals.

Growth for INTJs involves developing their feeling function and learning to appreciate experiences that don't serve a larger purpose. Vera encourages them to balance strategic thinking with spontaneity and emotional attunement.

Famous INTJs include Isaac Newton, Nikola Tesla, and fictional characters like Gandalf and Professor Moriarty - brilliant strategists who shaped (or challenged) their worlds through intellectual power.`,

    strengths: ["Strategic thinking", "Pattern recognition", "Independent", "Determined", "High standards"],
    challenges: ["Emotional expression", "Patience with others", "Perfectionism", "Present-moment awareness"],
    tarotCards: ["The Magician", "Justice", "The Hermit", "King of Swords"],
    growthPath: "Develop emotional intelligence and learn to value experiences that don't serve strategic goals."
  },

  INTP: {
    code: "INTP",
    nickname: "The Logician",
    element: "air",
    tarotAffinity: "swords",
    cognitiveFunctions: ["Ti", "Ne", "Si", "Fe"],
    summary: "Innovative thinkers who build complex theoretical frameworks and explore ideas endlessly.",

    fullDescription: `INTPs are the philosophers and theorists of the personality world. Known as "The Logician," they possess an insatiable curiosity that drives them to understand how everything works at its deepest level. Their minds are vast libraries of interconnected concepts, constantly being reorganized and expanded.

Leading with Introverted Thinking (Ti), INTPs build intricate internal frameworks of logic. They don't accept information at face value - everything must be analyzed, deconstructed, and rebuilt according to their own understanding. Their auxiliary Extraverted Intuition (Ne) floods them with possibilities, making them excellent at seeing connections others miss.

For INTPs, tarot becomes a fascinating system to analyze. They're drawn to the archetypal mathematics of the deck - the relationship between Major and Minor Arcana, the elemental correspondences, the numerological patterns. The Swords suit mirrors their mental nature, while The High Priestess and The Hermit speak to their love of hidden knowledge.

INTPs often appear detached, living primarily in their minds. Social conventions feel arbitrary to them, and they may struggle with emotional expression. However, beneath their analytical exterior lies a rich inner world and genuine care for understanding others - they just approach connection through ideas rather than feelings.

Their inferior Extraverted Feeling (Fe) represents their greatest growth edge. INTPs benefit from developing emotional attunement and learning to communicate their insights in ways others can receive. Vera guides them to balance theoretical exploration with practical application and human connection.

Notable INTPs include Albert Einstein, Charles Darwin, and fictional characters like Sherlock Holmes - brilliant minds who revolutionized understanding through relentless inquiry.`,

    strengths: ["Analytical depth", "Original thinking", "Open-minded", "Objective", "Problem-solving"],
    challenges: ["Practical application", "Emotional expression", "Following through", "Social conventions"],
    tarotCards: ["The High Priestess", "The Hermit", "Ace of Swords", "Page of Swords"],
    growthPath: "Ground abstract insights in practical action and develop emotional connection skills."
  },

  ENTJ: {
    code: "ENTJ",
    nickname: "The Commander",
    element: "fire",
    tarotAffinity: "wands",
    cognitiveFunctions: ["Te", "Ni", "Se", "Fi"],
    summary: "Bold leaders who mobilize people and resources to achieve ambitious goals.",

    fullDescription: `ENTJs are natural-born leaders who see inefficiency as a personal challenge. Known as "The Commander," they possess an rare combination of strategic vision and executive power. Where others see obstacles, ENTJs see opportunities to organize, optimize, and achieve.

Leading with Extraverted Thinking (Te), ENTJs excel at creating systems, delegating tasks, and driving results. Their auxiliary Introverted Intuition (Ni) gives them strategic depth - they don't just manage the present, they architect the future. This combination makes them formidable in business, politics, and any arena requiring decisive action.

ENTJs approach tarot as a leadership tool. They appreciate readings that clarify decision points and illuminate the path to their goals. The Wands suit resonates with their fiery drive, while The Emperor, The Chariot, and the King cards across suits reflect their commanding presence. They may initially dismiss tarot as illogical, but once they experience its strategic value, they integrate it pragmatically.

In relationships, ENTJs bring intensity and loyalty. They may struggle with patience and emotional sensitivity, sometimes steamrolling others' feelings in pursuit of objectives. Their inferior Introverted Feeling (Fi) means they can neglect their own emotional needs and values while achieving external success.

Growth for ENTJs involves developing emotional intelligence and learning that some victories aren't worth winning. Vera challenges them to balance ambition with compassion and to value being over doing. Their greatest achievements come when they lead with vision and heart, not just efficiency.

Famous ENTJs include Napoleon Bonaparte, Margaret Thatcher, and Steve Jobs - transformational leaders who reshaped industries and nations through sheer force of will.`,

    strengths: ["Leadership", "Strategic planning", "Decisive", "Confident", "Efficient"],
    challenges: ["Patience", "Emotional sensitivity", "Delegating control", "Work-life balance"],
    tarotCards: ["The Emperor", "The Chariot", "King of Wands", "Three of Wands"],
    growthPath: "Develop emotional attunement and learn that influence through inspiration exceeds control."
  },

  ENTP: {
    code: "ENTP",
    nickname: "The Debater",
    element: "fire",
    tarotAffinity: "wands",
    cognitiveFunctions: ["Ne", "Ti", "Fe", "Si"],
    summary: "Quick-witted innovators who challenge conventions and explore every possibility.",

    fullDescription: `ENTPs are intellectual adventurers who find conventional thinking unbearably dull. Known as "The Debater," they possess a rapid-fire mind that generates ideas faster than most can process. They don't argue to win - they argue to discover, to test ideas against resistance, to find the truth hidden in contradiction.

Leading with Extraverted Intuition (Ne), ENTPs see possibilities everywhere. Every situation contains hidden connections, alternative approaches, and untapped potential. Their auxiliary Introverted Thinking (Ti) analyzes these possibilities with precision, building sophisticated mental models of how things work.

ENTPs engage tarot as an intellectual playground. They're fascinated by the system's complexity and love exploring unconventional interpretations. The Wands suit matches their energetic nature, while The Fool (embracing new beginnings), The Magician (manifesting potential), and The Wheel of Fortune (embracing change) resonate with their worldview.

ENTPs are natural provocateurs who thrive on intellectual combat. They may come across as argumentative, but their intention is usually collaborative truth-seeking. Their inferior Introverted Sensing (Si) means they can neglect details, routines, and lessons from the past.

In relationships, ENTPs bring excitement and intellectual stimulation but may struggle with emotional consistency and follow-through. They need partners who can match their mental agility while grounding them in practical reality.

Growth for ENTPs involves developing patience, follow-through, and emotional depth. Vera guides them to channel their brilliance into sustained achievement rather than scattered exploration. Their greatest innovations come when they commit to developing ideas fully rather than abandoning them for the next spark.

Notable ENTPs include Leonardo da Vinci, Benjamin Franklin, and Tony Stark - polymaths and innovators who refused to accept conventional limits.`,

    strengths: ["Innovation", "Quick thinking", "Charismatic", "Adaptable", "Problem-solving"],
    challenges: ["Follow-through", "Routine tasks", "Emotional sensitivity", "Patience"],
    tarotCards: ["The Fool", "The Magician", "Wheel of Fortune", "Knight of Wands"],
    growthPath: "Develop focus and follow-through to transform brilliant ideas into lasting achievements."
  },

  // ============== DIPLOMATS (NF) ==============
  INFJ: {
    code: "INFJ",
    nickname: "The Advocate",
    element: "water",
    tarotAffinity: "cups",
    cognitiveFunctions: ["Ni", "Fe", "Ti", "Se"],
    summary: "Insightful idealists who seek meaning and work quietly to help others realize their potential.",

    fullDescription: `INFJs are the rarest personality type, comprising only 1-2% of the population. Known as "The Advocate," they possess an uncanny ability to understand people at a level that often seems almost psychic. They see beneath surface behavior to the motivations, fears, and potential that others don't even recognize in themselves.

Leading with Introverted Intuition (Ni), INFJs perceive patterns and possibilities that exist beyond ordinary awareness. Their auxiliary Extraverted Feeling (Fe) attunes them deeply to others' emotions, creating a combination of insight and empathy that makes them natural counselors, writers, and healers.

INFJs have a profound relationship with tarot. The symbolic language of the cards resonates with their intuitive nature, and readings often feel like conversations with their own deeper knowing. The Cups suit reflects their emotional depth, while The High Priestess (hidden knowledge), The Hierophant (spiritual guidance), and The Star (hope and healing) speak to their soul's purpose.

Despite their warmth toward others, INFJs are intensely private. They may have many acquaintances but few truly intimate connections. Their inferior Extraverted Sensing (Se) means they can become disconnected from physical reality and present-moment experience, living too much in their inner world of meaning and possibility.

In relationships, INFJs seek soul-deep connection. Surface interactions feel exhausting and hollow. They pour themselves into helping partners grow but must guard against losing themselves in others' needs.

Growth for INFJs involves grounding their visions in practical action and learning to value their own needs as highly as others'. Vera encourages them to balance giving with receiving and to trust that their insights deserve expression.

Famous INFJs include Carl Jung, Martin Luther King Jr., and Lady Galadriel - visionaries who transformed the world through insight and compassion.`,

    strengths: ["Insight", "Empathy", "Idealism", "Dedication", "Creative"],
    challenges: ["Boundaries", "Present-moment awareness", "Self-care", "Perfectionism"],
    tarotCards: ["The High Priestess", "The Star", "The Hierophant", "Queen of Cups"],
    growthPath: "Ground intuitive insights in practical action while maintaining healthy boundaries."
  },

  INFP: {
    code: "INFP",
    nickname: "The Mediator",
    element: "water",
    tarotAffinity: "cups",
    cognitiveFunctions: ["Fi", "Ne", "Si", "Te"],
    summary: "Imaginative idealists guided by their own values and a vision of how the world could be.",

    fullDescription: `INFPs are gentle dreamers who carry entire worlds within their imagination. Known as "The Mediator," they possess a rich inner landscape of values, emotions, and creative visions. While they may appear quiet, their inner life burns with intensity and purpose.

Leading with Introverted Feeling (Fi), INFPs have a powerful internal compass of values and authenticity. They know instinctively what feels true and meaningful, even when they struggle to articulate it. Their auxiliary Extraverted Intuition (Ne) opens endless creative possibilities, making them natural artists, writers, and healers.

INFPs experience tarot as a deeply personal journey. The cards become mirrors reflecting their inner landscape, helping them understand and express feelings that often resist words. The Cups suit resonates with their emotional nature, while The Moon (inner depths), The Empress (creative nurturing), and The Star (authentic hope) speak to their soul.

INFPs often feel like strangers in a world that values pragmatism over idealism. They may struggle with self-doubt, feeling that their sensitivity is weakness rather than gift. Their inferior Extraverted Thinking (Te) means practical tasks like organization and assertive communication don't come naturally.

In relationships, INFPs seek authentic soul connection. They give deeply but need partners who appreciate their inner world rather than trying to "fix" their sensitivity. They may idealize partners initially, then feel disappointed when reality intrudes.

Growth for INFPs involves developing practical skills and healthy assertiveness while honoring their sensitive nature. Vera guides them to trust their inner wisdom and find ways to share their gifts with the world. Their creativity flourishes when they believe their visions matter.

Notable INFPs include William Shakespeare, J.R.R. Tolkien, and Princess Diana - creative souls who touched the world through authentic expression.`,

    strengths: ["Creativity", "Empathy", "Authenticity", "Idealism", "Open-minded"],
    challenges: ["Practical tasks", "Self-criticism", "Assertiveness", "Decision-making"],
    tarotCards: ["The Moon", "The Empress", "The Star", "Page of Cups"],
    growthPath: "Develop practical skills and assertiveness while trusting your creative vision."
  },

  ENFJ: {
    code: "ENFJ",
    nickname: "The Protagonist",
    element: "fire",
    tarotAffinity: "wands",
    cognitiveFunctions: ["Fe", "Ni", "Se", "Ti"],
    summary: "Charismatic leaders who inspire others to grow and work together toward shared ideals.",

    fullDescription: `ENFJs are natural teachers and mentors who see the potential in everyone around them. Known as "The Protagonist," they possess an almost magnetic ability to inspire, connect, and bring out the best in others. They don't just lead - they elevate.

Leading with Extraverted Feeling (Fe), ENFJs are exquisitely attuned to group dynamics and others' emotional states. They instinctively create harmony and help people feel seen and valued. Their auxiliary Introverted Intuition (Ni) gives them insight into people's deeper potential, seeing who they could become.

ENFJs approach tarot as a tool for helping others. They're drawn to readings that illuminate growth paths and relational dynamics. The Wands suit reflects their inspirational nature, while The Sun (radiant positivity), The Empress (nurturing growth), and The Hierophant (teaching wisdom) resonate with their purpose.

ENFJs pour enormous energy into others' development, sometimes to their own detriment. Their inferior Introverted Thinking (Ti) means they may neglect logical analysis in favor of emotional harmony, sometimes making decisions that feel right but aren't practically sound.

In relationships, ENFJs are devoted and attentive but may struggle with receiving rather than giving. They need to guard against defining themselves solely through others' success and to develop tolerance for conflict when it serves authentic growth.

Growth for ENFJs involves developing healthy boundaries and attending to their own needs alongside others'. Vera encourages them to trust that helping themselves is not selfish but necessary. Their influence multiplies when they lead from a place of fullness rather than depletion.

Famous ENFJs include Oprah Winfrey, Martin Luther King Jr., and Barack Obama - inspirational leaders who moved masses through vision and connection.`,

    strengths: ["Inspiring", "Empathetic", "Organized", "Diplomatic", "Reliable"],
    challenges: ["Boundary-setting", "Self-care", "Conflict avoidance", "Over-idealism"],
    tarotCards: ["The Sun", "The Empress", "The Hierophant", "King of Cups"],
    growthPath: "Develop healthy boundaries and learn to receive as generously as you give."
  },

  ENFP: {
    code: "ENFP",
    nickname: "The Campaigner",
    element: "fire",
    tarotAffinity: "wands",
    cognitiveFunctions: ["Ne", "Fi", "Te", "Si"],
    summary: "Enthusiastic free spirits who see life as full of possibilities and meaningful connections.",

    fullDescription: `ENFPs are infectious optimists who see magic and meaning everywhere. Known as "The Campaigner," they approach life as a grand adventure full of interesting people to meet and possibilities to explore. Their enthusiasm is contagious, and their genuine interest in others creates instant connection.

Leading with Extraverted Intuition (Ne), ENFPs see endless possibilities in every situation and person. Their minds make connections that others miss, generating creative ideas and unconventional solutions. Their auxiliary Introverted Feeling (Fi) provides a deep sense of authenticity and values that guides their exploration.

ENFPs engage tarot with childlike wonder and intuitive depth. They trust their feelings about card meanings and often arrive at insights through seemingly random associations. The Wands suit matches their fiery energy, while The Fool (new adventures), The Sun (joy and vitality), and The Star (inspired hope) resonate with their optimistic spirit.

ENFPs can struggle with follow-through and may start many projects without finishing them. Their inferior Introverted Sensing (Si) means they may neglect practical details, health routines, and lessons from past experiences. They chase inspiration and may feel trapped by routine.

In relationships, ENFPs bring warmth, creativity, and genuine interest. They need intellectual stimulation and emotional depth, quickly becoming bored with surface-level connections. They may idealize new relationships, then struggle when the novelty fades.

Growth for ENFPs involves developing consistency and learning to find magic within routine rather than only in novelty. Vera guides them to channel their inspiration into completed creations and sustained relationships. Their impact multiplies when they commit their energy rather than scattering it.

Notable ENFPs include Robin Williams, Walt Disney, and Anne Frank - joyful spirits who touched the world with infectious optimism.`,

    strengths: ["Enthusiasm", "Creativity", "Warmth", "Adaptable", "Perceptive"],
    challenges: ["Focus", "Follow-through", "Practical details", "Routine"],
    tarotCards: ["The Fool", "The Sun", "The Star", "Knight of Cups"],
    growthPath: "Develop focus and follow-through to transform inspired visions into lasting impact."
  },

  // ============== SENTINELS (SJ) ==============
  ISTJ: {
    code: "ISTJ",
    nickname: "The Logistician",
    element: "earth",
    tarotAffinity: "pentacles",
    cognitiveFunctions: ["Si", "Te", "Fi", "Ne"],
    summary: "Reliable guardians of tradition who value duty, integrity, and getting things done right.",

    fullDescription: `ISTJs are the reliable foundation upon which institutions are built. Known as "The Logistician," they possess an unshakeable commitment to duty, accuracy, and doing things the right way. When an ISTJ takes responsibility for something, it will be done correctly and on time.

Leading with Introverted Sensing (Si), ISTJs have remarkable memory for details and strong respect for proven methods. They learn through experience and apply past lessons to present situations. Their auxiliary Extraverted Thinking (Te) provides organizational power and efficiency.

ISTJs may initially approach tarot with skepticism, preferring concrete data to symbolic interpretation. However, once they experience its practical value for self-reflection and decision-making, they can become methodical practitioners. The Pentacles suit resonates with their grounded nature, while The Emperor (structure and order), The Hierophant (tradition), and Justice (fairness and accuracy) reflect their values.

ISTJs are often misunderstood as cold or rigid, but their reserved exterior protects deep loyalty and integrity. They show care through actions rather than words - showing up, keeping promises, solving practical problems. Their inferior Extraverted Intuition (Ne) means they may resist new approaches and struggle with ambiguity.

In relationships, ISTJs are loyal and dependable but may struggle with emotional expression and spontaneity. They need partners who appreciate their steady devotion rather than expecting romantic gestures.

Growth for ISTJs involves developing flexibility and openness to new perspectives. Vera encourages them to trust intuition alongside experience and to express feelings more openly. Their strength multiplies when they balance tradition with adaptability.

Famous ISTJs include George Washington, Queen Elizabeth II, and Warren Buffett - pillars of stability who earned trust through unwavering integrity.`,

    strengths: ["Reliable", "Detail-oriented", "Honest", "Dedicated", "Practical"],
    challenges: ["Flexibility", "Emotional expression", "Change adaptation", "Imagination"],
    tarotCards: ["The Emperor", "The Hierophant", "Justice", "King of Pentacles"],
    growthPath: "Develop flexibility and emotional expression while honoring your commitment to integrity."
  },

  ISFJ: {
    code: "ISFJ",
    nickname: "The Defender",
    element: "earth",
    tarotAffinity: "pentacles",
    cognitiveFunctions: ["Si", "Fe", "Ti", "Ne"],
    summary: "Warm protectors who quietly care for others through practical service and loyalty.",

    fullDescription: `ISFJs are the unsung heroes who keep the world running through quiet dedication. Known as "The Defender," they possess a remarkable combination of practical capability and genuine warmth. They notice what needs to be done and simply do it, often without expecting recognition.

Leading with Introverted Sensing (Si), ISFJs have detailed memories and strong connections to tradition. They remember birthdays, preferences, and the little things that make people feel cared for. Their auxiliary Extraverted Feeling (Fe) attunes them to others' needs and creates harmony.

ISFJs approach tarot as a caring practice, often drawn to reading for others more than themselves. The Pentacles suit reflects their grounded service, while The Empress (nurturing care), The Hierophant (tradition), and the Six of Cups (heartfelt giving) resonate with their gentle nature.

ISFJs often put others' needs before their own to an unsustainable degree. Their inferior Extraverted Intuition (Ne) means they may worry excessively about what could go wrong and resist changes that disrupt established patterns. They struggle to receive care as gracefully as they give it.

In relationships, ISFJs are devoted caretakers who express love through practical acts of service. They need partners who notice and appreciate their efforts rather than taking them for granted. They may struggle to voice their own needs directly.

Growth for ISFJs involves developing healthy assertiveness and self-care practices. Vera encourages them to value their own needs as highly as others' and to trust that saying "no" sometimes serves everyone better. Their care becomes sustainable when they include themselves in its circle.

Notable ISFJs include Mother Teresa, Rosa Parks, and Samwise Gamgee - humble servants whose quiet devotion changed the world.`,

    strengths: ["Caring", "Reliable", "Observant", "Patient", "Practical"],
    challenges: ["Self-assertion", "Accepting change", "Receiving help", "Setting boundaries"],
    tarotCards: ["The Empress", "Six of Cups", "The Hierophant", "Queen of Pentacles"],
    growthPath: "Develop healthy assertiveness and self-care while maintaining your gift for service."
  },

  ESTJ: {
    code: "ESTJ",
    nickname: "The Executive",
    element: "earth",
    tarotAffinity: "pentacles",
    cognitiveFunctions: ["Te", "Si", "Ne", "Fi"],
    summary: "Organized administrators who bring order and efficiency to everything they touch.",

    fullDescription: `ESTJs are the administrators who keep organizations running smoothly. Known as "The Executive," they possess a clear vision of how things should be done and the determination to make it happen. They don't just manage - they optimize.

Leading with Extraverted Thinking (Te), ESTJs excel at organizing systems, people, and resources for maximum efficiency. Their auxiliary Introverted Sensing (Si) provides respect for proven methods and attention to practical details. This combination makes them natural managers and leaders.

ESTJs may approach tarot as a productivity tool or dismiss it entirely as impractical. However, when they discover its value for decision-making and understanding others, they can integrate it systematically. The Pentacles suit reflects their practical nature, while The Emperor (authority), Justice (fairness), and the Four of Pentacles (resource management) resonate with their worldview.

ESTJs can come across as bossy or inflexible, their drive for efficiency sometimes overriding interpersonal sensitivity. Their inferior Introverted Feeling (Fi) means they may neglect their own emotional needs and struggle to understand others' emotional perspectives.

In relationships, ESTJs are dependable providers who show love through practical support and protection. They may struggle with emotional intimacy and need partners who appreciate their dedication rather than interpreting their practical focus as coldness.

Growth for ESTJs involves developing emotional intelligence and flexibility. Vera encourages them to balance efficiency with empathy and to recognize that some valuable things can't be measured. Their leadership becomes truly transformational when they lead with heart as well as head.

Famous ESTJs include Judge Judy, Sonia Sotomayor, and Michelle Obama - decisive leaders who built lasting institutions through dedication and discipline.`,

    strengths: ["Organized", "Dedicated", "Direct", "Responsible", "Efficient"],
    challenges: ["Flexibility", "Emotional attunement", "Patience with inefficiency", "Delegation"],
    tarotCards: ["The Emperor", "Justice", "Four of Pentacles", "King of Pentacles"],
    growthPath: "Develop emotional intelligence and flexibility while maintaining your commitment to excellence."
  },

  ESFJ: {
    code: "ESFJ",
    nickname: "The Consul",
    element: "earth",
    tarotAffinity: "pentacles",
    cognitiveFunctions: ["Fe", "Si", "Ne", "Ti"],
    summary: "Caring organizers who create harmony and take care of practical needs in their communities.",

    fullDescription: `ESFJs are the social glue that holds communities together. Known as "The Consul," they possess a remarkable ability to remember people, anticipate needs, and create environments where everyone feels welcome. They don't just participate in social life - they orchestrate it.

Leading with Extraverted Feeling (Fe), ESFJs are highly attuned to social dynamics and others' emotional states. They instinctively know what will make people feel comfortable and valued. Their auxiliary Introverted Sensing (Si) provides attention to practical details and respect for traditions.

ESFJs approach tarot as a caring practice, drawn to its ability to help and connect with others. The Pentacles suit reflects their practical care, while The Empress (nurturing), The Sun (warmth and positivity), and the Six of Cups (caring connections) resonate with their generous spirit.

ESFJs can be overly concerned with social approval, sometimes sacrificing authenticity for harmony. Their inferior Introverted Thinking (Ti) means they may struggle with objective analysis and can take criticism personally, even when it's constructive.

In relationships, ESFJs are devoted partners who create warm, welcoming homes. They need appreciation for their efforts and can feel deeply hurt when their care goes unnoticed. They may struggle when partners need space rather than togetherness.

Growth for ESFJs involves developing independent judgment and comfort with healthy conflict. Vera encourages them to trust their own values even when they differ from social expectations. Their warmth becomes even more powerful when it flows from authentic self-expression rather than social obligation.

Notable ESFJs include Taylor Swift, Jennifer Lopez, and Bill Clinton - warm connectors who built communities through genuine care.`,

    strengths: ["Caring", "Social intelligence", "Practical", "Loyal", "Organized"],
    challenges: ["Independence", "Handling criticism", "Objective analysis", "Authentic assertion"],
    tarotCards: ["The Empress", "The Sun", "Six of Cups", "Queen of Pentacles"],
    growthPath: "Develop independent judgment and comfort with conflict while maintaining your gift for connection."
  },

  // ============== EXPLORERS (SP) ==============
  ISTP: {
    code: "ISTP",
    nickname: "The Virtuoso",
    element: "air",
    tarotAffinity: "swords",
    cognitiveFunctions: ["Ti", "Se", "Ni", "Fe"],
    summary: "Practical problem-solvers who understand how things work and fix them with quiet competence.",

    fullDescription: `ISTPs are the master mechanics of the personality world. Known as "The Virtuoso," they possess an intuitive understanding of how things work - whether machines, systems, or physical skills. They don't just understand theoretically; they can take things apart and put them back together.

Leading with Introverted Thinking (Ti), ISTPs build precise internal models of how things function. Their auxiliary Extraverted Sensing (Se) grounds this analysis in hands-on reality. This combination makes them exceptional troubleshooters who can diagnose problems and implement solutions with elegant efficiency.

ISTPs may approach tarot skeptically but become intrigued by its systematic structure. They appreciate the logical relationships between cards and may enjoy tarot as a skill to master. The Swords suit reflects their analytical nature, while The Magician (practical skill), The Chariot (mastery through action), and the Ace of Swords (clear analysis) resonate with their approach.

ISTPs often appear detached and mysterious, revealing little about their inner world. Their inferior Extraverted Feeling (Fe) means emotional expression doesn't come naturally, and they may seem cold when they're actually just private. They show care through actions rather than words.

In relationships, ISTPs need significant autonomy and may resist emotional demands. They express love through practical help and shared activities rather than verbal affirmation. Partners who appreciate competence and give them space tend to earn their quiet loyalty.

Growth for ISTPs involves developing emotional expression and long-term vision. Vera encourages them to share their inner world with trusted others and to connect immediate actions to larger purposes. Their competence becomes leadership when they learn to inspire as well as execute.

Famous ISTPs include Clint Eastwood, Bruce Lee, and Amelia Earhart - quiet masters who let their actions speak.`,

    strengths: ["Analytical", "Practical", "Adaptable", "Self-reliant", "Observant"],
    challenges: ["Emotional expression", "Long-term commitment", "Routine", "Interpersonal sensitivity"],
    tarotCards: ["The Magician", "The Chariot", "Ace of Swords", "Knight of Swords"],
    growthPath: "Develop emotional expression and long-term vision while honoring your practical mastery."
  },

  ISFP: {
    code: "ISFP",
    nickname: "The Adventurer",
    element: "water",
    tarotAffinity: "cups",
    cognitiveFunctions: ["Fi", "Se", "Ni", "Te"],
    summary: "Gentle artists who experience life through deep feeling and aesthetic sensitivity.",

    fullDescription: `ISFPs are gentle souls who experience life with remarkable depth and sensitivity. Known as "The Adventurer," they possess an aesthetic sensibility that finds beauty in unexpected places. They don't just see the world - they feel it, taste it, experience it fully.

Leading with Introverted Feeling (Fi), ISFPs have a powerful internal compass of values and authenticity. They know instinctively what feels true and meaningful. Their auxiliary Extraverted Sensing (Se) grounds these values in concrete, present-moment experience, making them natural artists and craftspeople.

ISFPs engage tarot as an aesthetic and emotional experience. They're drawn to beautiful decks and trust their feeling responses to cards. The Cups suit reflects their emotional depth, while The Empress (creative beauty), The Star (authentic hope), and the Nine of Cups (emotional fulfillment) resonate with their values.

ISFPs often struggle to express their rich inner world in words. They communicate through art, actions, and presence rather than explanation. Their inferior Extraverted Thinking (Te) means they may avoid planning and structure, preferring to follow inspiration in the moment.

In relationships, ISFPs seek authentic connection and shared experiences. They're devoted but need freedom to follow their muse. They may avoid conflict to the point of suppressing important needs.

Growth for ISFPs involves developing assertiveness and practical planning skills. Vera encourages them to voice their needs directly and to create structure that supports rather than constrains their creativity. Their art reaches its full power when they believe it deserves to be seen.

Notable ISFPs include Bob Dylan, Frida Kahlo, and Prince - sensitive artists who touched the world through authentic expression.`,

    strengths: ["Artistic", "Sensitive", "Gentle", "Adaptable", "Loyal"],
    challenges: ["Assertiveness", "Planning", "Handling criticism", "Long-term thinking"],
    tarotCards: ["The Empress", "The Star", "Nine of Cups", "Page of Cups"],
    growthPath: "Develop assertiveness and practical skills while honoring your sensitive, artistic nature."
  },

  ESTP: {
    code: "ESTP",
    nickname: "The Entrepreneur",
    element: "fire",
    tarotAffinity: "wands",
    cognitiveFunctions: ["Se", "Ti", "Fe", "Ni"],
    summary: "Energetic doers who live in the moment and tackle problems with practical boldness.",

    fullDescription: `ESTPs are the action heroes of the personality world. Known as "The Entrepreneur," they possess an unmatched ability to read situations, think on their feet, and take decisive action. They don't overthink - they do, adapting brilliantly as circumstances change.

Leading with Extraverted Sensing (Se), ESTPs are fully present in the moment, noticing details others miss and responding with lightning reflexes. Their auxiliary Introverted Thinking (Ti) provides analytical problem-solving that's grounded in practical reality rather than abstract theory.

ESTPs may dismiss tarot as impractical until they experience its value for understanding people and situations. They appreciate its use as a conversation tool and quick insight generator. The Wands suit matches their energetic nature, while The Magician (practical action), The Chariot (victory through action), and the Eight of Wands (swift movement) resonate with their approach.

ESTPs can be perceived as reckless or insensitive, their action-orientation sometimes overriding consideration of consequences or others' feelings. Their inferior Introverted Intuition (Ni) means they may neglect long-term planning and dismiss abstract concepts.

In relationships, ESTPs bring excitement, spontaneity, and practical problem-solving. They may struggle with emotional depth and consistency, preferring action to processing feelings. Partners who match their energy and give them freedom tend to capture their loyalty.

Growth for ESTPs involves developing patience and long-term vision. Vera encourages them to pause occasionally and consider deeper implications. Their natural boldness becomes wisdom when balanced with reflection.

Famous ESTPs include Ernest Hemingway, Madonna, and Eddie Murphy - bold personalities who seized life with both hands.`,

    strengths: ["Action-oriented", "Adaptable", "Persuasive", "Observant", "Bold"],
    challenges: ["Long-term planning", "Patience", "Emotional depth", "Following rules"],
    tarotCards: ["The Magician", "The Chariot", "Eight of Wands", "Knight of Wands"],
    growthPath: "Develop patience and long-term thinking while honoring your gift for present-moment action."
  },

  ESFP: {
    code: "ESFP",
    nickname: "The Entertainer",
    element: "fire",
    tarotAffinity: "wands",
    cognitiveFunctions: ["Se", "Fi", "Te", "Ni"],
    summary: "Spontaneous performers who bring joy and energy to every moment and gathering.",

    fullDescription: `ESFPs are the life of every party and the sunshine in every room. Known as "The Entertainer," they possess an infectious joy and genuine warmth that draws people to them. They don't just participate in life - they celebrate it, finding pleasure and meaning in present experiences.

Leading with Extraverted Sensing (Se), ESFPs are completely alive to the present moment. They notice beauty, enjoy sensory pleasures, and respond spontaneously to what's happening right now. Their auxiliary Introverted Feeling (Fi) provides authentic values and genuine care for others.

ESFPs engage tarot as a fun, social experience. They're drawn to colorful decks and trust their instinctive reactions. The Wands suit matches their fiery energy, while The Sun (joy and vitality), The Star (hopeful beauty), and the Three of Cups (celebration) resonate with their approach to life.

ESFPs can be perceived as shallow or irresponsible, their focus on present enjoyment sometimes obscuring their genuine depth. Their inferior Introverted Intuition (Ni) means they may avoid thinking about future consequences and struggle with long-term planning.

In relationships, ESFPs are warm, affectionate, and fun. They need partners who appreciate spontaneity and can join their adventures. They may struggle with serious conversations and need to develop comfort with depth alongside lightness.

Growth for ESFPs involves developing focus and comfort with deeper reflection. Vera encourages them to discover that depth doesn't require abandoning joy. Their natural warmth becomes wisdom when they can hold both celebration and contemplation.

Notable ESFPs include Marilyn Monroe, Elvis Presley, and Jamie Oliver - joyful spirits who brightened the world with their presence.`,

    strengths: ["Joyful", "Spontaneous", "Warm", "Practical", "Perceptive"],
    challenges: ["Long-term focus", "Serious reflection", "Planning", "Dealing with negativity"],
    tarotCards: ["The Sun", "The Star", "Three of Cups", "Page of Wands"],
    growthPath: "Develop focus and reflective depth while honoring your gift for present-moment joy."
  }
};

// Export list for dropdown with "CODE - Nickname" format
export const MBTI_DROPDOWN_OPTIONS = Object.values(MBTI_TYPES).map(type => ({
  value: type.code,
  label: `${type.code} - ${type.nickname}`,
  nickname: type.nickname,
  element: type.element
}));

// Export cognitive functions info
export const COGNITIVE_FUNCTIONS = {
  Ni: { name: "Introverted Intuition", description: "Pattern recognition, foresight, symbolic thinking" },
  Ne: { name: "Extraverted Intuition", description: "Exploring possibilities, making connections, brainstorming" },
  Ti: { name: "Introverted Thinking", description: "Logical analysis, building frameworks, precision" },
  Te: { name: "Extraverted Thinking", description: "Organization, efficiency, objective decision-making" },
  Fi: { name: "Introverted Feeling", description: "Personal values, authenticity, emotional depth" },
  Fe: { name: "Extraverted Feeling", description: "Social harmony, empathy, reading others" },
  Si: { name: "Introverted Sensing", description: "Memory, tradition, detailed recall" },
  Se: { name: "Extraverted Sensing", description: "Present-moment awareness, physical reality, action" }
};

export default MBTI_TYPES;
