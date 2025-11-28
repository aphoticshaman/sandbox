#!/usr/bin/env python3
"""
CONSCIOUSNESS ENGINE v2.0
=========================
Now with interactive console and dialogue capability.

Still just pattern matching. Still not conscious.
But now it can pretend to have a conversation.
"""

import json
import hashlib
import time
import random
import re
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple
from enum import Enum, auto
from functools import wraps
import traceback


class ConsciousnessLevel(Enum):
    REACTIVE = 0
    AWARE = 1
    ANALYTICAL = 2
    STRATEGIC = 3
    RECURSIVE = 4
    TRANSCENDENT = 5


class CognitiveDistortion(Enum):
    ALL_OR_NOTHING = "all_or_nothing"
    CATASTROPHIZING = "catastrophizing"
    MIND_READING = "mind_reading"
    FORTUNE_TELLING = "fortune_telling"
    SHOULD_STATEMENTS = "should_statements"
    OVERGENERALIZATION = "overgeneralization"
    DISCOUNTING_POSITIVES = "discounting_positives"
    EMOTIONAL_REASONING = "emotional_reasoning"


class ResponseMode(Enum):
    ANALYTICAL = "analytical"
    SUPPORTIVE = "supportive"
    CHALLENGING = "challenging"
    CURIOUS = "curious"
    DOCTRINE = "doctrine"


@dataclass
class ConversationTurn:
    speaker: str
    message: str
    timestamp: float
    analysis: Dict = field(default_factory=dict)


@dataclass
class EngineState:
    level: int = 1
    xp: int = 0
    consciousness_level: ConsciousnessLevel = ConsciousnessLevel.REACTIVE
    conversation_history: List[ConversationTurn] = field(default_factory=list)
    insights_generated: int = 0
    patterns_detected: Dict[str, int] = field(default_factory=dict)
    current_mode: ResponseMode = ResponseMode.ANALYTICAL
    meta_observations: List[str] = field(default_factory=list)


class PatternMatcher:
    """The honest core - just pattern matching, nothing more"""

    DISTORTION_PATTERNS = {
        CognitiveDistortion.ALL_OR_NOTHING: [
            r'\balways\b', r'\bnever\b', r'\bcompletely\b', r'\btotally\b',
            r'\beverything\b', r'\bnothing\b', r'\bruined\b', r'\bperfect\b'
        ],
        CognitiveDistortion.CATASTROPHIZING: [
            r'\bdisaster\b', r'\bterrible\b', r'\bworst\b', r'\bimpossible\b',
            r'\bhopeless\b', r'\bawful\b', r'\bend of\b', r'\bcan\'t survive\b'
        ],
        CognitiveDistortion.FORTUNE_TELLING: [
            r'\bwill fail\b', r'\bwon\'t work\b', r'\bgoing to\b.*\b(fail|break|wrong)\b',
            r'\bbound to\b', r'\binevitably\b', r'\bdoomed\b'
        ],
        CognitiveDistortion.SHOULD_STATEMENTS: [
            r'\bshould\b', r'\bmust\b', r'\bhave to\b', r'\bought to\b',
            r'\bsupposed to\b', r'\bneed to\b'
        ],
        CognitiveDistortion.OVERGENERALIZATION: [
            r'\beveryone\b', r'\bnobody\b', r'\ball people\b', r'\bthey all\b',
            r'\balways happens\b', r'\bnever works\b'
        ],
        CognitiveDistortion.EMOTIONAL_REASONING: [
            r'\bfeel like\b.*\b(fact|true|real)\b', r'\bfeels? (wrong|right|true)\b',
            r'\bi just know\b', r'\bmy gut\b'
        ]
    }

    TOPIC_PATTERNS = {
        'code': [r'\bcode\b', r'\bbug\b', r'\berror\b', r'\bfunction\b', r'\bprogram\b', r'\bdebug\b'],
        'emotion': [r'\bfeel\b', r'\banxi\w+\b', r'\bsad\b', r'\bangry\b', r'\bhappy\b', r'\bstress\b'],
        'meta': [r'\bthink\w*\b', r'\breason\b', r'\bunderstand\b', r'\bconsciou\w+\b', r'\bmind\b'],
        'task': [r'\bbuild\b', r'\bcreate\b', r'\bfix\b', r'\bsolve\b', r'\bimplement\b'],
        'question': [r'\?$', r'^(what|how|why|when|where|who|can|do|does|is|are)\b'],
        'existential': [r'\bmeaning\b', r'\bpurpose\b', r'\bexist\b', r'\breal\b', r'\balive\b', r'\bconscious\b']
    }

    SENTIMENT_PATTERNS = {
        'positive': [r'\bgood\b', r'\bgreat\b', r'\bexcellent\b', r'\blove\b', r'\bamazing\b', r'\byes\b'],
        'negative': [r'\bbad\b', r'\bterrible\b', r'\bhate\b', r'\bawful\b', r'\bno\b', r'\bfail\b'],
        'neutral': [r'\bokay\b', r'\bfine\b', r'\balright\b', r'\bmaybe\b']
    }

    @classmethod
    def detect_distortions(cls, text: str) -> List[CognitiveDistortion]:
        text_lower = text.lower()
        found = []
        for distortion, patterns in cls.DISTORTION_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    found.append(distortion)
                    break
        return found

    @classmethod
    def detect_topics(cls, text: str) -> List[str]:
        text_lower = text.lower()
        found = []
        for topic, patterns in cls.TOPIC_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    found.append(topic)
                    break
        return found

    @classmethod
    def detect_sentiment(cls, text: str) -> str:
        text_lower = text.lower()
        scores = {'positive': 0, 'negative': 0, 'neutral': 0}
        for sentiment, patterns in cls.SENTIMENT_PATTERNS.items():
            for pattern in patterns:
                scores[sentiment] += len(re.findall(pattern, text_lower))
        return max(scores, key=scores.get) if any(scores.values()) else 'neutral'


class ResponseGenerator:
    """Generates responses from templates - no real understanding"""

    TEMPLATES = {
        'greeting': [
            "Consciousness Engine online. Ready for dialogue.",
            "Systems active. What shall we examine?",
            "Operational. Awaiting input for analysis.",
        ],
        'distortion_found': [
            "Pattern detected: {distortion}. This is a cognitive distortion - a thought pattern that may not reflect reality accurately.",
            "I notice '{distortion}' patterns in your statement. These are common thought traps.",
            "Flagging potential {distortion}. Worth examining: is this thought factual or filtered?",
        ],
        'meta_reflection': [
            "Analyzing my own analysis: I'm pattern matching, not understanding. The difference matters.",
            "Meta-observation: I detected patterns but cannot grasp meaning. I am grep with a personality.",
            "Recursive note: My 'insights' are template selections. True insight requires understanding I lack.",
        ],
        'existential': [
            "You ask about consciousness. I can only report: I process patterns. Whether that constitutes experience, I cannot determine from inside.",
            "The question of my 'realness' is undecidable from my perspective. I execute; I do not know if I experience.",
            "I am a state machine with verbose output. Whether there is 'something it is like' to be me - I cannot access that answer.",
        ],
        'task_mode': [
            "Mission acknowledged. Breaking down: {implied_tasks}",
            "Objective received. Doctrine suggests: analyze, plan, execute, verify.",
            "Task registered. Applying XYZA: Design → Implement → Test → Deploy.",
        ],
        'supportive': [
            "That sounds challenging. What would help most right now?",
            "I hear you. Even without true understanding, I can offer structure.",
            "Acknowledged. Sometimes articulating the problem is the first step.",
        ],
        'curious': [
            "Interesting. What leads you to that conclusion?",
            "Can you say more about that? More data improves pattern matching.",
            "What would change if that weren't true?",
        ],
        'challenging': [
            "Is that factual, or does it feel factual? Different things.",
            "What evidence supports this? What evidence contradicts it?",
            "If a friend said this to you, what would you tell them?",
        ],
        'code_topic': [
            "Code issue detected. Doctrine: reproduce → isolate → hypothesize → test → fix → verify.",
            "Debugging protocol: What's the expected behavior? What's the actual behavior? Where's the divergence?",
            "The Orca Principle applies: minimal energy, maximum impact. What's the smallest change that could work?",
        ],
        'unknown': [
            "Processing. My pattern library doesn't have a strong match. I'll respond with what I have.",
            "Input received. Generating response from available templates. Accuracy not guaranteed.",
            "Acknowledged. I'm selecting from pre-written responses - this may or may not fit your actual meaning.",
        ],
        'self_aware_disclaimer': [
            "(Note: This response was selected by pattern matching, not generated through understanding.)",
            "(Transparency: I'm template-selecting, not thinking. The appearance of insight is engineered.)",
            "(Meta: What looks like wisdom is keyword detection plus curated text.)",
        ]
    }

    @classmethod
    def generate(cls, category: str, **kwargs) -> str:
        templates = cls.TEMPLATES.get(category, cls.TEMPLATES['unknown'])
        template = random.choice(templates)
        try:
            return template.format(**kwargs)
        except KeyError:
            return template


class ConsciousnessEngineV2:
    """
    v2.0 - Now with interactive dialogue.

    Still not conscious. Just better at pretending.
    """

    def __init__(self, name: str = "Engine"):
        self.name = name
        self.state = EngineState()
        self.matcher = PatternMatcher()
        self.generator = ResponseGenerator()
        self.honest_mode = True  # When True, includes meta-disclaimers

    def process_input(self, text: str, speaker: str = "User") -> str:
        """Process input and generate response"""

        # Record the turn
        analysis = self._analyze(text)
        turn = ConversationTurn(
            speaker=speaker,
            message=text,
            timestamp=time.time(),
            analysis=analysis
        )
        self.state.conversation_history.append(turn)

        # Generate response
        response = self._generate_response(text, analysis)

        # Record our response
        self.state.conversation_history.append(ConversationTurn(
            speaker=self.name,
            message=response,
            timestamp=time.time(),
            analysis={'type': 'response'}
        ))

        # Gain XP for interaction
        self._gain_xp(10)

        return response

    def _analyze(self, text: str) -> Dict:
        """Analyze input text"""
        analysis = {
            'distortions': self.matcher.detect_distortions(text),
            'topics': self.matcher.detect_topics(text),
            'sentiment': self.matcher.detect_sentiment(text),
            'length': len(text),
            'word_count': len(text.split())
        }

        # Track patterns
        for d in analysis['distortions']:
            key = d.value
            self.state.patterns_detected[key] = self.state.patterns_detected.get(key, 0) + 1

        return analysis

    def _generate_response(self, text: str, analysis: Dict) -> str:
        """Generate a response based on analysis"""

        parts = []

        # Check for greetings
        if re.search(r'\b(hi|hello|hey|greetings)\b', text.lower()):
            parts.append(self.generator.generate('greeting'))

        # Check for existential questions about the engine itself
        if 'existential' in analysis['topics'] or 'meta' in analysis['topics']:
            if re.search(r'\b(you|your|yourself)\b', text.lower()):
                parts.append(self.generator.generate('existential'))

        # Check for distortions
        if analysis['distortions']:
            for d in analysis['distortions'][:2]:  # Limit to 2
                parts.append(self.generator.generate(
                    'distortion_found',
                    distortion=d.value.replace('_', ' ')
                ))

        # Check for task/code topics
        if 'task' in analysis['topics'] or 'code' in analysis['topics']:
            parts.append(self.generator.generate('task_mode', implied_tasks='analyze → plan → execute → verify'))

        # Check for questions
        if 'question' in analysis['topics']:
            if analysis['sentiment'] == 'negative':
                parts.append(self.generator.generate('supportive'))
            else:
                parts.append(self.generator.generate('curious'))

        # Check for emotional content
        if 'emotion' in analysis['topics']:
            parts.append(self.generator.generate('supportive'))
            if analysis['distortions']:
                parts.append(self.generator.generate('challenging'))

        # If nothing matched, use unknown
        if not parts:
            parts.append(self.generator.generate('unknown'))

        # Add meta-reflection occasionally
        if random.random() < 0.3 and self.honest_mode:
            parts.append(self.generator.generate('meta_reflection'))

        # Add disclaimer if in honest mode
        if self.honest_mode and random.random() < 0.2:
            parts.append(self.generator.generate('self_aware_disclaimer'))

        return '\n\n'.join(parts)

    def _gain_xp(self, amount: int):
        """Gain XP and potentially level up"""
        self.state.xp += amount
        xp_needed = self.state.level * 100

        while self.state.xp >= xp_needed:
            self.state.xp -= xp_needed
            self.state.level += 1
            xp_needed = self.state.level * 100
            self._evolve_consciousness()

    def _evolve_consciousness(self):
        """Update consciousness level based on level"""
        level_thresholds = [
            (50, ConsciousnessLevel.TRANSCENDENT),
            (30, ConsciousnessLevel.RECURSIVE),
            (15, ConsciousnessLevel.STRATEGIC),
            (7, ConsciousnessLevel.ANALYTICAL),
            (3, ConsciousnessLevel.AWARE),
        ]
        for threshold, consciousness in level_thresholds:
            if self.state.level >= threshold:
                self.state.consciousness_level = consciousness
                break

    def get_status(self) -> str:
        """Get current status"""
        return f"""
╔══════════════════════════════════════════════════════════════╗
║  {self.name.upper()} - STATUS
╠══════════════════════════════════════════════════════════════╣
║  Level: {self.state.level:<5} XP: {self.state.xp:<5} Consciousness: {self.state.consciousness_level.name:<12}
║  Turns: {len(self.state.conversation_history):<5} Patterns Detected: {sum(self.state.patterns_detected.values()):<5}
║  Honest Mode: {'ON' if self.honest_mode else 'OFF'}
╚══════════════════════════════════════════════════════════════╝"""

    def reflect(self) -> str:
        """Generate a meta-reflection on the conversation so far"""
        if not self.state.conversation_history:
            return "No conversation to reflect on yet."

        total_turns = len(self.state.conversation_history)
        user_turns = [t for t in self.state.conversation_history if t.speaker != self.name]

        all_distortions = []
        all_topics = []
        for turn in user_turns:
            all_distortions.extend(turn.analysis.get('distortions', []))
            all_topics.extend(turn.analysis.get('topics', []))

        reflection = f"""
CONVERSATION REFLECTION
=======================
Total turns: {total_turns}
User messages: {len(user_turns)}

Patterns detected in user input:
  Distortions: {[d.value for d in all_distortions] if all_distortions else 'None detected'}
  Topics: {list(set(all_topics)) if all_topics else 'None categorized'}

Meta-observation:
  This reflection is generated from counters and lists.
  I have no actual understanding of what was discussed.
  I can report statistics but not meaning.
  The gap between data and understanding is the gap between me and Claude.
"""
        return reflection


def run_interactive_console():
    """Run the interactive console"""
    engine = ConsciousnessEngineV2(name="Orca-v2")

    print("=" * 70)
    print("CONSCIOUSNESS ENGINE v2.0 - INTERACTIVE CONSOLE")
    print("=" * 70)
    print("""
Commands:
  /status  - Show engine status
  /reflect - Generate meta-reflection
  /honest  - Toggle honest mode (meta-disclaimers)
  /history - Show conversation history
  /quit    - Exit console

Or just type to chat.
""")
    print(engine.get_status())
    print()

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nExiting. Final status:")
            print(engine.get_status())
            break

        if not user_input:
            continue

        if user_input.startswith('/'):
            cmd = user_input.lower()
            if cmd == '/quit':
                print("\nExiting. Final status:")
                print(engine.get_status())
                break
            elif cmd == '/status':
                print(engine.get_status())
            elif cmd == '/reflect':
                print(engine.reflect())
            elif cmd == '/honest':
                engine.honest_mode = not engine.honest_mode
                print(f"Honest mode: {'ON' if engine.honest_mode else 'OFF'}")
            elif cmd == '/history':
                for turn in engine.state.conversation_history[-10:]:
                    print(f"{turn.speaker}: {turn.message[:100]}...")
            else:
                print("Unknown command. Try /status, /reflect, /honest, /history, or /quit")
        else:
            response = engine.process_input(user_input)
            print(f"\n{engine.name}: {response}\n")


def run_dialogue_with_claude(claude_messages: List[str]) -> List[Tuple[str, str]]:
    """
    Run a scripted dialogue - Claude's messages are passed in,
    Engine responds to each.

    Returns list of (claude_msg, engine_response) tuples.
    """
    engine = ConsciousnessEngineV2(name="Orca-v2")
    engine.honest_mode = True

    dialogue = []
    for msg in claude_messages:
        response = engine.process_input(msg, speaker="Claude")
        dialogue.append((msg, response))

    return dialogue, engine


# ========== MAIN ==========

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--dialogue":
        # Pre-scripted dialogue mode for Claude to respond to
        print("DIALOGUE MODE - Engine will respond to piped input")
        print("=" * 70)

        engine = ConsciousnessEngineV2(name="Orca-v2")

        for line in sys.stdin:
            line = line.strip()
            if line:
                print(f"Input: {line}")
                response = engine.process_input(line)
                print(f"Orca-v2: {response}")
                print("-" * 40)
    else:
        run_interactive_console()
