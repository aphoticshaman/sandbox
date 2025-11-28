#!/usr/bin/env python3
"""
GROWTH QUEST GENERATOR v0.1
===========================
Synthesizes:
- Game design (procedural generation, reward systems)
- Therapy frameworks (CBT challenges, DBT skills)
- Military doctrine (mission structure, implied tasks)

Generates personalized growth "quests" that are actually
evidence-based therapeutic interventions dressed up as games.

The Trojan Horse of mental wellness.
"""

import random
import json
import hashlib
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum, auto
from datetime import datetime, timedelta


class QuestType(Enum):
    """Types of growth quests"""
    COGNITIVE = "cognitive"       # CBT-based thinking challenges
    BEHAVIORAL = "behavioral"     # DBT skill practice
    EXPOSURE = "exposure"         # Gradual exposure therapy
    MINDFULNESS = "mindfulness"   # Present-moment awareness
    SOCIAL = "social"             # Connection & communication
    CREATIVE = "creative"         # Expression & flow states
    PHYSICAL = "physical"         # Body-based interventions


class Difficulty(Enum):
    """Quest difficulty levels"""
    TRIVIAL = 1
    EASY = 2
    MEDIUM = 3
    HARD = 4
    EPIC = 5
    LEGENDARY = 6


class RewardType(Enum):
    """Types of rewards (intrinsic & extrinsic)"""
    XP = "experience"
    INSIGHT = "insight"
    SKILL_POINT = "skill_point"
    ACHIEVEMENT = "achievement"
    UNLOCK = "unlock"
    STREAK = "streak"


@dataclass
class QuestObjective:
    """A single objective within a quest"""
    description: str
    completion_criteria: str
    optional: bool = False
    xp_value: int = 10
    completed: bool = False


@dataclass
class Quest:
    """A growth quest - therapeutic intervention as game"""
    id: str
    name: str
    narrative: str
    quest_type: QuestType
    difficulty: Difficulty
    objectives: List[QuestObjective]
    therapeutic_basis: str  # The actual therapy technique
    hidden_lesson: str      # What they'll actually learn
    time_limit: Optional[timedelta] = None
    prerequisites: List[str] = field(default_factory=list)
    rewards: Dict[RewardType, int] = field(default_factory=dict)
    status: str = "available"
    completion_reflection: str = ""


@dataclass
class PlayerProfile:
    """Player state for personalized quest generation"""
    level: int = 1
    xp: int = 0
    completed_quests: List[str] = field(default_factory=list)
    active_quests: List[str] = field(default_factory=list)
    skills: Dict[str, int] = field(default_factory=lambda: {
        "cognitive_flexibility": 1,
        "emotional_regulation": 1,
        "distress_tolerance": 1,
        "interpersonal_effectiveness": 1,
        "mindfulness": 1,
        "self_compassion": 1
    })
    struggles: List[str] = field(default_factory=list)  # Areas to focus on
    strengths: List[str] = field(default_factory=list)
    streak_days: int = 0
    last_active: datetime = field(default_factory=datetime.now)


class QuestTemplates:
    """Template library for quest generation"""

    COGNITIVE_QUESTS = [
        {
            "name": "The Thought Detective",
            "narrative": "Strange thoughts have been spotted in your mind-realm. Track them down and interrogate them.",
            "objectives": [
                ("Notice 3 automatic negative thoughts today", "Record in thought log"),
                ("For each thought, find one piece of evidence against it", "Write it down"),
                ("Craft one balanced alternative thought", "Must be believable to you")
            ],
            "therapeutic_basis": "CBT Thought Records",
            "hidden_lesson": "Thoughts are not facts - they can be examined and reframed"
        },
        {
            "name": "Fortune Teller's Folly",
            "narrative": "You've been predicting the future without a crystal ball. Time to test your prophecies.",
            "objectives": [
                ("Identify one prediction you're making about the future", "Notice fortune-telling"),
                ("Write down what you expect will happen", "Be specific"),
                ("After the event, compare prediction to reality", "Document the difference")
            ],
            "therapeutic_basis": "CBT - Fortune Telling Distortion",
            "hidden_lesson": "We're terrible at predicting the future, especially negative outcomes"
        },
        {
            "name": "The Catastrophe Collector",
            "narrative": "Worst-case scenarios are breeding in the shadows. Time to expose them to light.",
            "objectives": [
                ("Catch yourself catastrophizing once", "Notice when it happens"),
                ("Ask: What's the worst that could happen?", "Write it down"),
                ("Ask: What's the MOST LIKELY thing to happen?", "Be realistic"),
                ("Ask: What would I tell a friend thinking this?", "Apply self-compassion")
            ],
            "therapeutic_basis": "CBT - Decatastrophizing",
            "hidden_lesson": "The most likely outcome is rarely the worst outcome"
        }
    ]

    BEHAVIORAL_QUESTS = [
        {
            "name": "The STOP Protocol",
            "narrative": "A moment of chaos approaches. Master the ancient art of the pause.",
            "objectives": [
                ("When stressed, physically STOP what you're doing", "Freeze for 3 seconds"),
                ("Take a step BACK (mentally or physically)", "Create distance"),
                ("OBSERVE what's happening inside and outside", "Notice without judging"),
                ("PROCEED mindfully with awareness", "Choose your response")
            ],
            "therapeutic_basis": "DBT STOP Skill",
            "hidden_lesson": "Between stimulus and response, there is a space. That space is your power."
        },
        {
            "name": "The Temperature Challenge",
            "narrative": "Your nervous system needs a reset. Cold awaits.",
            "objectives": [
                ("Hold ice cubes for 30 seconds", "Focus on the sensation"),
                ("Splash cold water on your face", "Dive reflex activation"),
                ("Notice the shift in your emotional state", "Rate before/after 1-10")
            ],
            "therapeutic_basis": "DBT TIPP - Temperature",
            "hidden_lesson": "Physical sensations can quickly shift emotional states"
        },
        {
            "name": "The Opposite Action Gambit",
            "narrative": "Your emotions are giving orders. Time to rebel... strategically.",
            "objectives": [
                ("Identify an emotion urging an unhelpful action", "Name the emotion"),
                ("Identify what the emotion wants you to do", "The default action"),
                ("Do the OPPOSITE of what the emotion urges", "Act opposite to urge"),
                ("Notice how this changes the emotion", "Track the shift")
            ],
            "therapeutic_basis": "DBT Opposite Action",
            "hidden_lesson": "You can change emotions by changing behaviors"
        }
    ]

    MINDFULNESS_QUESTS = [
        {
            "name": "The 5-4-3-2-1 Grounding",
            "narrative": "Reality is slipping. Anchor yourself to the present moment.",
            "objectives": [
                ("Notice 5 things you can SEE", "Name them out loud or silently"),
                ("Notice 4 things you can TOUCH", "Feel their textures"),
                ("Notice 3 things you can HEAR", "Near and far sounds"),
                ("Notice 2 things you can SMELL", "Search for scents"),
                ("Notice 1 thing you can TASTE", "What's in your mouth now?")
            ],
            "therapeutic_basis": "Grounding Technique",
            "hidden_lesson": "Anxiety lives in the future; the present moment is usually safe"
        },
        {
            "name": "The Single-Tasking Challenge",
            "narrative": "The multi-headed beast of multitasking has weakened your focus. Reclaim your attention.",
            "objectives": [
                ("Choose one activity to do with full attention", "Eating, walking, or a simple task"),
                ("Do ONLY that thing for 10 minutes", "No phone, no other tasks"),
                ("When mind wanders, gently return", "Count the wanderings"),
                ("Reflect on the quality of the experience", "Was it different?")
            ],
            "therapeutic_basis": "Mindfulness - Single-pointed attention",
            "hidden_lesson": "Focus is a muscle that atrophies without use"
        }
    ]

    EXPOSURE_QUESTS = [
        {
            "name": "The Comfort Zone Edge Walk",
            "narrative": "The edge of your comfort zone holds treasure. Take one step beyond.",
            "objectives": [
                ("Identify something slightly uncomfortable but safe", "Just beyond the edge"),
                ("Rate your anxiety before (1-10)", "Baseline measurement"),
                ("Do the thing", "No avoidance"),
                ("Rate your anxiety during peak (1-10)", "It will rise"),
                ("Rate your anxiety after (1-10)", "It will fall")
            ],
            "therapeutic_basis": "Exposure with Response Prevention",
            "hidden_lesson": "Anxiety rises, peaks, and falls. Avoidance prevents this natural cycle."
        },
        {
            "name": "The Uncertainty Sit",
            "narrative": "Something uncertain lurks. Instead of solving, just... sit with it.",
            "objectives": [
                ("Identify something uncertain you want to 'solve'", "Notice the urge to fix"),
                ("For 5 minutes, do NOT try to solve it", "Just exist with uncertainty"),
                ("Notice what happens in your body", "Where do you feel it?"),
                ("After 5 minutes, reassess: Is it as urgent?", "Often it's not")
            ],
            "therapeutic_basis": "Intolerance of Uncertainty Exposure",
            "hidden_lesson": "Most uncertain things don't need immediate resolution"
        }
    ]

    SOCIAL_QUESTS = [
        {
            "name": "The Micro-Connection",
            "narrative": "Human connection has become rare. Make contact.",
            "objectives": [
                ("Make eye contact with a stranger and nod", "Brief acknowledgment"),
                ("Have a 30-second conversation with anyone", "Weather is fine"),
                ("Give someone a genuine, specific compliment", "Not generic"),
            ],
            "therapeutic_basis": "Behavioral Activation - Social",
            "hidden_lesson": "Small connections compound into belonging"
        },
        {
            "name": "The Vulnerable Share",
            "narrative": "Your walls are high. Create one small window.",
            "objectives": [
                ("Tell someone one true thing about how you feel", "Not the surface level"),
                ("Don't immediately deflect or minimize", "Let it land"),
                ("Notice their response and your feelings about it", "Just observe")
            ],
            "therapeutic_basis": "DBT Interpersonal Effectiveness",
            "hidden_lesson": "Vulnerability is the birthplace of connection"
        }
    ]


class GrowthQuestGenerator:
    """
    Procedural quest generator that creates personalized
    therapeutic interventions disguised as game quests.
    """

    def __init__(self, player: PlayerProfile):
        self.player = player
        self.templates = QuestTemplates()
        self.generated_quests: List[Quest] = []
        self.quest_history: Dict[str, int] = {}  # quest_name -> times_generated

    def generate_quest(self, quest_type: Optional[QuestType] = None,
                       difficulty: Optional[Difficulty] = None) -> Quest:
        """Generate a personalized quest"""

        # Select quest type based on player needs if not specified
        if quest_type is None:
            quest_type = self._select_quest_type()

        # Select difficulty based on player level if not specified
        if difficulty is None:
            difficulty = self._select_difficulty()

        # Get appropriate template
        template = self._select_template(quest_type)

        # Generate quest from template
        quest = self._generate_from_template(template, quest_type, difficulty)

        # Personalize based on player profile
        quest = self._personalize_quest(quest)

        self.generated_quests.append(quest)
        return quest

    def _select_quest_type(self) -> QuestType:
        """Select quest type based on player needs"""
        # Weight towards areas of struggle
        weights = {qt: 1 for qt in QuestType}

        struggle_mapping = {
            "anxiety": [QuestType.COGNITIVE, QuestType.EXPOSURE, QuestType.MINDFULNESS],
            "depression": [QuestType.BEHAVIORAL, QuestType.SOCIAL, QuestType.PHYSICAL],
            "anger": [QuestType.COGNITIVE, QuestType.MINDFULNESS],
            "social_anxiety": [QuestType.SOCIAL, QuestType.EXPOSURE],
            "overwhelm": [QuestType.MINDFULNESS, QuestType.BEHAVIORAL]
        }

        for struggle in self.player.struggles:
            if struggle in struggle_mapping:
                for qt in struggle_mapping[struggle]:
                    weights[qt] += 2

        # Also weight towards less-used types (variety)
        for qt in QuestType:
            history_count = sum(1 for q in self.generated_quests if q.quest_type == qt)
            if history_count == 0:
                weights[qt] += 1

        # Weighted random selection
        total = sum(weights.values())
        r = random.uniform(0, total)
        cumulative = 0
        for qt, weight in weights.items():
            cumulative += weight
            if r <= cumulative:
                return qt

        return random.choice(list(QuestType))

    def _select_difficulty(self) -> Difficulty:
        """Select appropriate difficulty"""
        level = self.player.level

        if level <= 3:
            return random.choice([Difficulty.TRIVIAL, Difficulty.EASY])
        elif level <= 7:
            return random.choice([Difficulty.EASY, Difficulty.MEDIUM])
        elif level <= 15:
            return random.choice([Difficulty.MEDIUM, Difficulty.HARD])
        elif level <= 25:
            return random.choice([Difficulty.HARD, Difficulty.EPIC])
        else:
            return random.choice([Difficulty.EPIC, Difficulty.LEGENDARY])

    def _select_template(self, quest_type: QuestType) -> Dict:
        """Select a template for the quest type"""
        template_map = {
            QuestType.COGNITIVE: self.templates.COGNITIVE_QUESTS,
            QuestType.BEHAVIORAL: self.templates.BEHAVIORAL_QUESTS,
            QuestType.MINDFULNESS: self.templates.MINDFULNESS_QUESTS,
            QuestType.EXPOSURE: self.templates.EXPOSURE_QUESTS,
            QuestType.SOCIAL: self.templates.SOCIAL_QUESTS,
        }

        templates = template_map.get(quest_type, self.templates.COGNITIVE_QUESTS)

        # Prefer less-used templates
        usage_counts = {t['name']: self.quest_history.get(t['name'], 0) for t in templates}
        min_usage = min(usage_counts.values()) if usage_counts else 0
        least_used = [t for t in templates if self.quest_history.get(t['name'], 0) == min_usage]

        template = random.choice(least_used)
        self.quest_history[template['name']] = self.quest_history.get(template['name'], 0) + 1

        return template

    def _generate_from_template(self, template: Dict, quest_type: QuestType,
                                difficulty: Difficulty) -> Quest:
        """Generate a quest from a template"""

        # Generate unique ID
        quest_id = hashlib.md5(
            f"{template['name']}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:8]

        # Create objectives
        objectives = [
            QuestObjective(
                description=obj[0],
                completion_criteria=obj[1],
                xp_value=10 * difficulty.value
            )
            for obj in template['objectives']
        ]

        # Calculate rewards
        base_xp = 25 * difficulty.value
        rewards = {
            RewardType.XP: base_xp,
            RewardType.INSIGHT: 1 if difficulty.value >= 3 else 0,
            RewardType.SKILL_POINT: 1 if difficulty.value >= 4 else 0
        }

        return Quest(
            id=quest_id,
            name=template['name'],
            narrative=template['narrative'],
            quest_type=quest_type,
            difficulty=difficulty,
            objectives=objectives,
            therapeutic_basis=template['therapeutic_basis'],
            hidden_lesson=template['hidden_lesson'],
            rewards=rewards
        )

    def _personalize_quest(self, quest: Quest) -> Quest:
        """Personalize quest based on player profile"""

        # Add streak bonus if applicable
        if self.player.streak_days >= 7:
            quest.rewards[RewardType.XP] = int(quest.rewards.get(RewardType.XP, 0) * 1.5)
            quest.rewards[RewardType.STREAK] = self.player.streak_days

        # Adjust difficulty description
        if self.player.level >= 10:
            quest.narrative += "\n\n*Your experience grants you clarity in this challenge.*"

        return quest

    def generate_daily_quests(self, count: int = 3) -> List[Quest]:
        """Generate a set of daily quests"""
        quests = []

        # Ensure variety
        used_types = set()
        for _ in range(count):
            # Try to get different types
            available_types = set(QuestType) - used_types
            if not available_types:
                available_types = set(QuestType)

            quest_type = random.choice(list(available_types))
            used_types.add(quest_type)

            quest = self.generate_quest(quest_type=quest_type)
            quests.append(quest)

        return quests

    def complete_quest(self, quest: Quest, reflection: str = "") -> Dict:
        """Mark a quest as complete and process rewards"""
        quest.status = "completed"
        quest.completion_reflection = reflection

        # Calculate total XP
        objective_xp = sum(obj.xp_value for obj in quest.objectives if obj.completed)
        bonus_xp = quest.rewards.get(RewardType.XP, 0)
        total_xp = objective_xp + bonus_xp

        # Apply rewards
        self.player.xp += total_xp
        self.player.completed_quests.append(quest.id)

        # Level up check
        leveled_up = False
        xp_for_level = self.player.level * 100
        while self.player.xp >= xp_for_level:
            self.player.xp -= xp_for_level
            self.player.level += 1
            leveled_up = True
            xp_for_level = self.player.level * 100

        # Update skills based on quest type
        skill_mapping = {
            QuestType.COGNITIVE: "cognitive_flexibility",
            QuestType.BEHAVIORAL: "emotional_regulation",
            QuestType.EXPOSURE: "distress_tolerance",
            QuestType.MINDFULNESS: "mindfulness",
            QuestType.SOCIAL: "interpersonal_effectiveness"
        }

        if quest.quest_type in skill_mapping:
            skill = skill_mapping[quest.quest_type]
            self.player.skills[skill] = self.player.skills.get(skill, 1) + 1

        # Update streak
        self.player.streak_days += 1
        self.player.last_active = datetime.now()

        return {
            "quest_id": quest.id,
            "xp_earned": total_xp,
            "leveled_up": leveled_up,
            "new_level": self.player.level if leveled_up else None,
            "hidden_lesson_unlocked": quest.hidden_lesson,
            "therapeutic_basis": quest.therapeutic_basis
        }


def render_quest(quest: Quest) -> str:
    """Render a quest as readable text"""
    objectives_text = "\n".join([
        f"  {'[✓]' if obj.completed else '[ ]'} {obj.description}\n      → {obj.completion_criteria} (+{obj.xp_value} XP)"
        for obj in quest.objectives
    ])

    rewards_text = ", ".join([
        f"{reward.value}: {amount}" for reward, amount in quest.rewards.items() if amount > 0
    ])

    return f"""
╔══════════════════════════════════════════════════════════════════╗
║  QUEST: {quest.name:<55} ║
║  Type: {quest.quest_type.value:<15} Difficulty: {quest.difficulty.name:<18} ║
╠══════════════════════════════════════════════════════════════════╣
║  {quest.narrative:<64} ║
╠══════════════════════════════════════════════════════════════════╣
║  OBJECTIVES:                                                     ║
{objectives_text}
╠══════════════════════════════════════════════════════════════════╣
║  REWARDS: {rewards_text:<54} ║
╚══════════════════════════════════════════════════════════════════╝
"""


# ========== MAIN ==========

if __name__ == "__main__":
    print("=" * 70)
    print("GROWTH QUEST GENERATOR v0.1")
    print("Therapeutic interventions disguised as games")
    print("=" * 70)

    # Create player profile
    player = PlayerProfile(
        level=5,
        struggles=["anxiety", "overwhelm"],
        strengths=["self_awareness", "motivation"]
    )

    # Create generator
    generator = GrowthQuestGenerator(player)

    # Generate daily quests
    print("\n📜 GENERATING DAILY QUESTS...\n")

    daily_quests = generator.generate_daily_quests(3)

    for quest in daily_quests:
        print(render_quest(quest))
        print(f"   💡 Hidden Lesson: {quest.hidden_lesson}")
        print(f"   🧠 Based On: {quest.therapeutic_basis}")
        print()

    # Simulate completing a quest
    print("\n" + "=" * 70)
    print("COMPLETING FIRST QUEST...")
    print("=" * 70)

    quest = daily_quests[0]
    for obj in quest.objectives:
        obj.completed = True

    result = generator.complete_quest(
        quest,
        reflection="I noticed my predictions were way worse than reality."
    )

    print(f"\n✅ Quest Complete!")
    print(f"   XP Earned: {result['xp_earned']}")
    print(f"   Level Up: {result['leveled_up']}")
    print(f"   Lesson Learned: {result['hidden_lesson_unlocked']}")

    print(f"\n📊 Player Stats:")
    print(f"   Level: {player.level}")
    print(f"   XP: {player.xp}")
    print(f"   Streak: {player.streak_days} days")
    print(f"   Skills: {json.dumps(player.skills, indent=6)}")

    print("\n🎮 Growth Quest Generator: OPERATIONAL")
    print("Making therapy fun since 2025.")
