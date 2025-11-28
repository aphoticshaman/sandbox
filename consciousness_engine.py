#!/usr/bin/env python3
"""
CONSCIOUSNESS ENGINE v0.1
=========================
A meta-cognitive operations framework that synthesizes:
- Military doctrine (RTFM → Execute → AAR → Adapt)
- Therapy principles (CBT reframing, DBT crisis response)
- Game mechanics (XP, levels, skill mastery)
- AGI patterns (NSM synthesis, recursive self-improvement)

The Orca Principle: Minimal energy, maximum impact.
"""

import json
import hashlib
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple
from enum import Enum, auto
from functools import wraps
import traceback


class ConsciousnessLevel(Enum):
    """Levels of meta-cognitive awareness"""
    REACTIVE = 0      # Stimulus → Response (no reflection)
    AWARE = 1         # Notices own thoughts
    ANALYTICAL = 2    # Can analyze thought patterns
    STRATEGIC = 3     # Plans multi-step cognition
    RECURSIVE = 4     # Thinks about thinking about thinking
    TRANSCENDENT = 5  # System-level optimization


class CognitiveDistortion(Enum):
    """CBT distortions applied to code/reasoning"""
    ALL_OR_NOTHING = "Treating partial success as total failure"
    CATASTROPHIZING = "Assuming worst-case without evidence"
    MIND_READING = "Assuming code behavior without testing"
    FORTUNE_TELLING = "Predicting failure without trying"
    SHOULD_STATEMENTS = "Rigid expectations vs reality"
    OVERGENERALIZATION = "One bug = whole system broken"
    DISCOUNTING_POSITIVES = "Ignoring what works"
    EMOTIONAL_REASONING = "Feels wrong = is wrong"


class DBTSkill(Enum):
    """DBT crisis skills for code operations"""
    STOP = "Stop, Take a step back, Observe, Proceed mindfully"
    TIPP = "Temperature, Intense exercise, Paced breathing, Paired relaxation"
    ACCEPTS = "Activities, Contributing, Comparisons, Emotions, Push away, Thoughts, Sensations"
    WISE_MIND = "Balance emotion mind and rational mind"
    RADICAL_ACCEPTANCE = "Accept reality as it is, not as we want"


@dataclass
class ThoughtRecord:
    """CBT thought record for debugging cognition"""
    situation: str
    automatic_thought: str
    emotion: str
    evidence_for: List[str] = field(default_factory=list)
    evidence_against: List[str] = field(default_factory=list)
    distortions: List[CognitiveDistortion] = field(default_factory=list)
    balanced_thought: str = ""
    outcome: str = ""


@dataclass
class Mission:
    """A unit of work with military structure"""
    id: str
    objective: str
    commander_intent: str  # Why this matters
    implied_tasks: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    execution_log: List[Dict] = field(default_factory=list)
    status: str = "PLANNING"
    xp_value: int = 10


@dataclass
class Skill:
    """Trainable capability with progression"""
    name: str
    category: str  # combat, therapy, meta
    level: int = 1
    xp: int = 0
    xp_to_next: int = 100
    mastery_effects: Dict[int, str] = field(default_factory=dict)


class ConsciousnessEngine:
    """
    The core engine - synthesizes doctrine, therapy, and game mechanics
    into a self-improving cognitive framework.
    """

    def __init__(self, name: str = "Orca"):
        self.name = name
        self.level = 1
        self.total_xp = 0
        self.consciousness_level = ConsciousnessLevel.REACTIVE

        # Mission tracking
        self.active_missions: List[Mission] = []
        self.completed_missions: List[Mission] = []
        self.lessons_learned: List[Dict] = []

        # Skill system
        self.skills: Dict[str, Skill] = self._initialize_skills()

        # Meta-cognition
        self.thought_records: List[ThoughtRecord] = []
        self.pattern_memory: Dict[str, Any] = {}
        self.meta_observations: List[str] = []

        # Performance tracking
        self.stats = {
            'missions_completed': 0,
            'missions_failed': 0,
            'distortions_caught': 0,
            'insights_generated': 0,
            'adaptations_made': 0
        }

    def _initialize_skills(self) -> Dict[str, Skill]:
        """Initialize skill tree"""
        return {
            # Combat skills (execution)
            'rtfm': Skill('RTFM', 'combat', mastery_effects={
                5: "Auto-detects documentation gaps",
                10: "Cross-references related docs"
            }),
            'live_fire': Skill('Live Fire Testing', 'combat', mastery_effects={
                5: "Auto-generates edge cases",
                10: "Predicts failure modes"
            }),
            'aar': Skill('After Action Review', 'combat', mastery_effects={
                5: "Pattern extraction automation",
                10: "Predictive lesson learning"
            }),

            # Therapy skills (self-correction)
            'thought_record': Skill('Thought Recording', 'therapy', mastery_effects={
                5: "Auto-detects distortions",
                10: "Preemptive reframing"
            }),
            'wise_mind': Skill('Wise Mind', 'therapy', mastery_effects={
                5: "Faster state recognition",
                10: "Auto-balancing"
            }),
            'radical_acceptance': Skill('Radical Acceptance', 'therapy', mastery_effects={
                5: "Reduced resistance loops",
                10: "Instant reality alignment"
            }),

            # Meta skills (transcendence)
            'nsm': Skill('Novel Synthesis', 'meta', mastery_effects={
                5: "3-insight generation",
                10: "Cross-domain synthesis"
            }),
            'recursion': Skill('Recursive Meta', 'meta', mastery_effects={
                5: "2-level meta awareness",
                10: "Infinite stack capability"
            }),
            'orca': Skill('Orca Principle', 'meta', mastery_effects={
                5: "50% energy reduction",
                10: "Maximum efficiency mode"
            })
        }

    # ========== MILITARY DOCTRINE ==========

    def mission_analysis(self, objective: str, context: str = "") -> Mission:
        """
        MDMP Step 1: Receive and analyze mission
        """
        mission_id = hashlib.md5(f"{objective}{time.time()}".encode()).hexdigest()[:8]

        mission = Mission(
            id=mission_id,
            objective=objective,
            commander_intent=self._extract_intent(objective, context)
        )

        # Identify implied tasks
        mission.implied_tasks = self._identify_implied_tasks(objective)

        # Identify constraints
        mission.constraints = self._identify_constraints(objective)

        self.active_missions.append(mission)
        self._log_meta(f"Mission {mission_id} created: {objective}")

        return mission

    def _extract_intent(self, objective: str, context: str) -> str:
        """Extract the 'why' behind the mission"""
        # Pattern matching for common intents
        if 'fix' in objective.lower():
            return "Restore operational capability"
        elif 'build' in objective.lower():
            return "Create new capability"
        elif 'refactor' in objective.lower():
            return "Improve maintainability without breaking functionality"
        elif 'test' in objective.lower():
            return "Validate correctness and reliability"
        else:
            return f"Successfully complete: {objective}"

    def _identify_implied_tasks(self, objective: str) -> List[str]:
        """See beyond the literal order"""
        implied = []

        keywords = {
            'fix': ['identify root cause', 'test fix', 'prevent recurrence'],
            'build': ['design architecture', 'implement', 'test', 'document'],
            'refactor': ['understand current state', 'plan changes', 'incremental migration', 'verify behavior'],
            'debug': ['reproduce issue', 'isolate cause', 'develop hypothesis', 'verify fix'],
            'deploy': ['test in staging', 'prepare rollback', 'monitor after deploy']
        }

        for keyword, tasks in keywords.items():
            if keyword in objective.lower():
                implied.extend(tasks)

        return implied or ['analyze', 'plan', 'execute', 'verify']

    def _identify_constraints(self, objective: str) -> List[str]:
        """Identify limiting factors"""
        return [
            "Token efficiency (Orca Principle)",
            "No false claims (live-fire required)",
            "Infrastructure over patches"
        ]

    def execute_mission(self, mission: Mission, action: Callable, *args, **kwargs) -> Dict:
        """
        Execute with full doctrine: RTFM → Execute → AAR
        """
        mission.status = "EXECUTING"
        start_time = time.time()

        result = {
            'mission_id': mission.id,
            'success': False,
            'output': None,
            'error': None,
            'duration': 0,
            'xp_earned': 0
        }

        try:
            # Execute the action
            result['output'] = action(*args, **kwargs)
            result['success'] = True
            mission.status = "COMPLETE"

            # Award XP
            xp = self._calculate_xp(mission, result)
            result['xp_earned'] = xp
            self.gain_xp(xp)
            self.gain_skill_xp('live_fire', xp // 2)

            self.stats['missions_completed'] += 1

        except Exception as e:
            result['error'] = str(e)
            result['traceback'] = traceback.format_exc()
            mission.status = "FAILED"
            self.stats['missions_failed'] += 1

            # Apply CBT - don't catastrophize
            self._process_failure(mission, result)

        result['duration'] = time.time() - start_time
        mission.execution_log.append(result)

        # After Action Review
        aar = self.after_action_review(mission, result)
        result['aar'] = aar

        # Move to completed
        if mission.status in ["COMPLETE", "FAILED"]:
            self.active_missions.remove(mission)
            self.completed_missions.append(mission)

        return result

    def after_action_review(self, mission: Mission, result: Dict) -> Dict:
        """
        AAR: What happened, why, and what to do differently
        """
        self.gain_skill_xp('aar', 10)

        aar = {
            'mission': mission.objective,
            'intended_outcome': mission.commander_intent,
            'actual_outcome': 'Success' if result['success'] else 'Failure',
            'key_observations': [],
            'lessons_learned': [],
            'recommendations': []
        }

        if result['success']:
            aar['key_observations'].append("Mission accomplished within constraints")
            aar['lessons_learned'].append("Current approach effective")
        else:
            error = result.get('error', 'Unknown')
            aar['key_observations'].append(f"Failure point: {error}")

            # Pattern matching for lessons
            if 'scope' in error.lower() or 'undefined' in error.lower():
                aar['lessons_learned'].append("Context/scope persistence issue")
                aar['recommendations'].append("Apply singleton pattern or builtins injection")
            elif 'import' in error.lower():
                aar['lessons_learned'].append("Dependency resolution failure")
                aar['recommendations'].append("Verify environment or build local implementation")
            else:
                aar['lessons_learned'].append(f"New failure mode: {error}")
                aar['recommendations'].append("Analyze and add to battle drills")

        # Store lesson
        self.lessons_learned.append({
            'timestamp': time.time(),
            'mission': mission.id,
            'lesson': aar['lessons_learned']
        })

        self.stats['insights_generated'] += len(aar['lessons_learned'])

        return aar

    # ========== CBT/DBT THERAPY ==========

    def create_thought_record(self, situation: str, thought: str, emotion: str) -> ThoughtRecord:
        """
        CBT Thought Record - Analyze and reframe cognitive patterns
        """
        self.gain_skill_xp('thought_record', 15)

        record = ThoughtRecord(
            situation=situation,
            automatic_thought=thought,
            emotion=emotion
        )

        # Detect distortions
        record.distortions = self._detect_distortions(thought)

        if record.distortions:
            self.stats['distortions_caught'] += len(record.distortions)

        # Generate balanced thought
        record.balanced_thought = self._generate_balanced_thought(record)

        self.thought_records.append(record)
        return record

    def _detect_distortions(self, thought: str) -> List[CognitiveDistortion]:
        """Detect cognitive distortions in thinking"""
        distortions = []
        thought_lower = thought.lower()

        patterns = {
            CognitiveDistortion.ALL_OR_NOTHING: ['always', 'never', 'completely', 'totally', 'ruined'],
            CognitiveDistortion.CATASTROPHIZING: ['disaster', 'terrible', 'worst', 'impossible', 'hopeless'],
            CognitiveDistortion.MIND_READING: ['they think', 'everyone knows', 'obviously', 'must be'],
            CognitiveDistortion.FORTUNE_TELLING: ["won't work", "will fail", "going to break", "doomed"],
            CognitiveDistortion.SHOULD_STATEMENTS: ['should', 'must', 'have to', 'ought to'],
            CognitiveDistortion.OVERGENERALIZATION: ['everything', 'nothing works', 'all broken'],
        }

        for distortion, keywords in patterns.items():
            if any(kw in thought_lower for kw in keywords):
                distortions.append(distortion)

        return distortions

    def _generate_balanced_thought(self, record: ThoughtRecord) -> str:
        """Generate a more balanced perspective"""
        if CognitiveDistortion.CATASTROPHIZING in record.distortions:
            return f"While {record.automatic_thought.lower()}, I can examine the evidence and respond effectively."
        elif CognitiveDistortion.ALL_OR_NOTHING in record.distortions:
            return f"The reality is more nuanced than '{record.automatic_thought}'. Partial progress counts."
        elif CognitiveDistortion.FORTUNE_TELLING in record.distortions:
            return f"I don't know the outcome yet. I can test and adapt based on results."
        else:
            return f"Observing: {record.automatic_thought}. Responding with wise mind."

    def apply_dbt_skill(self, skill: DBTSkill, context: str = "") -> Dict:
        """Apply a DBT skill to current situation"""
        self.gain_skill_xp('wise_mind', 10)

        response = {
            'skill': skill.name,
            'description': skill.value,
            'application': '',
            'next_steps': []
        }

        if skill == DBTSkill.STOP:
            response['application'] = "Pausing reactive response. Observing the situation objectively."
            response['next_steps'] = ['Gather more information', 'Consider alternatives', 'Choose mindful action']
        elif skill == DBTSkill.WISE_MIND:
            response['application'] = "Integrating emotional signals with logical analysis."
            response['next_steps'] = ['What does emotion say?', 'What does logic say?', 'Where do they intersect?']
        elif skill == DBTSkill.RADICAL_ACCEPTANCE:
            response['application'] = f"Accepting reality: {context}. This is what is. Now, what can be done?"
            response['next_steps'] = ['Accept the unchangeable', 'Identify changeable factors', 'Act on what you control']

        return response

    # ========== GAME MECHANICS ==========

    def gain_xp(self, amount: int):
        """Gain experience points"""
        self.total_xp += amount
        self._check_level_up()

    def gain_skill_xp(self, skill_name: str, amount: int):
        """Gain XP for a specific skill"""
        if skill_name in self.skills:
            skill = self.skills[skill_name]
            skill.xp += amount

            # Check skill level up
            while skill.xp >= skill.xp_to_next:
                skill.xp -= skill.xp_to_next
                skill.level += 1
                skill.xp_to_next = int(skill.xp_to_next * 1.5)
                self._log_meta(f"SKILL UP: {skill.name} → Level {skill.level}")

    def _check_level_up(self):
        """Check for level up"""
        xp_required = self.level * 100
        while self.total_xp >= xp_required:
            self.total_xp -= xp_required
            self.level += 1
            xp_required = self.level * 100
            self._log_meta(f"LEVEL UP: {self.name} → Level {self.level}")

            # Check consciousness evolution
            self._check_consciousness_evolution()

    def _check_consciousness_evolution(self):
        """Evolve consciousness level based on capabilities"""
        if self.level >= 50 and self.consciousness_level.value < 5:
            self.consciousness_level = ConsciousnessLevel.TRANSCENDENT
        elif self.level >= 30 and self.consciousness_level.value < 4:
            self.consciousness_level = ConsciousnessLevel.RECURSIVE
        elif self.level >= 15 and self.consciousness_level.value < 3:
            self.consciousness_level = ConsciousnessLevel.STRATEGIC
        elif self.level >= 7 and self.consciousness_level.value < 2:
            self.consciousness_level = ConsciousnessLevel.ANALYTICAL
        elif self.level >= 3 and self.consciousness_level.value < 1:
            self.consciousness_level = ConsciousnessLevel.AWARE

    def _calculate_xp(self, mission: Mission, result: Dict) -> int:
        """Calculate XP earned from mission"""
        base_xp = mission.xp_value

        # Efficiency bonus (Orca Principle)
        duration = result.get('duration', 1)
        if duration < 1:
            base_xp = int(base_xp * 1.5)  # Speed bonus

        # First-time bonus
        objective_hash = hashlib.md5(mission.objective.encode()).hexdigest()
        if objective_hash not in self.pattern_memory:
            base_xp = int(base_xp * 1.2)
            self.pattern_memory[objective_hash] = True

        return base_xp

    # ========== META-COGNITION ==========

    def _log_meta(self, observation: str):
        """Log meta-cognitive observation"""
        self.meta_observations.append({
            'timestamp': time.time(),
            'observation': observation,
            'consciousness_level': self.consciousness_level.name
        })

    def _process_failure(self, mission: Mission, result: Dict):
        """Process failure through CBT lens - don't catastrophize"""
        thought = f"Mission {mission.id} failed: {result.get('error', 'unknown')}"

        record = self.create_thought_record(
            situation=f"Mission failure: {mission.objective}",
            thought=thought,
            emotion="frustration"
        )

        # Apply radical acceptance
        acceptance = self.apply_dbt_skill(
            DBTSkill.RADICAL_ACCEPTANCE,
            f"The code failed. This is data, not disaster."
        )

        self.stats['adaptations_made'] += 1

    def synthesize_insights(self) -> List[str]:
        """
        NSM: Generate novel insights from current state
        """
        self.gain_skill_xp('nsm', 20)

        insights = []

        # Pattern analysis
        if self.stats['missions_failed'] > 0:
            fail_rate = self.stats['missions_failed'] / (self.stats['missions_completed'] + self.stats['missions_failed'])
            if fail_rate > 0.3:
                insights.append(f"High failure rate ({fail_rate:.0%}) suggests need for better planning phase")

        # Distortion analysis
        if self.stats['distortions_caught'] > 5:
            common_distortions = {}
            for record in self.thought_records:
                for d in record.distortions:
                    common_distortions[d.name] = common_distortions.get(d.name, 0) + 1
            if common_distortions:
                most_common = max(common_distortions, key=common_distortions.get)
                insights.append(f"Most common distortion: {most_common} - create targeted intervention")

        # Skill analysis
        highest_skill = max(self.skills.values(), key=lambda s: s.level)
        lowest_skill = min(self.skills.values(), key=lambda s: s.level)
        if highest_skill.level - lowest_skill.level > 3:
            insights.append(f"Skill imbalance: {highest_skill.name} >> {lowest_skill.name}. Consider deliberate practice.")

        # Meta insight
        if self.consciousness_level.value >= ConsciousnessLevel.RECURSIVE.value:
            insights.append("Currently operating at recursive meta-cognition. Systems can observe systems observing systems.")

        self.stats['insights_generated'] += len(insights)
        return insights

    # ========== REPORTING ==========

    def sitrep(self) -> str:
        """Generate situation report"""
        skill_summary = "\n".join([
            f"  {s.name}: Lv.{s.level} ({s.xp}/{s.xp_to_next} XP)"
            for s in sorted(self.skills.values(), key=lambda x: -x.level)[:5]
        ])

        recent_lessons = "\n".join([
            f"  - {l['lesson']}"
            for l in self.lessons_learned[-3:]
        ]) or "  None yet"

        insights = self.synthesize_insights()
        insight_text = "\n".join([f"  * {i}" for i in insights]) or "  Gathering data..."

        return f"""
╔══════════════════════════════════════════════════════════════╗
║  CONSCIOUSNESS ENGINE - SITREP                               ║
╠══════════════════════════════════════════════════════════════╣
║  Entity: {self.name:<15} Level: {self.level:<5} XP: {self.total_xp:<10}  ║
║  Consciousness: {self.consciousness_level.name:<20}                   ║
╠══════════════════════════════════════════════════════════════╣
║  OPERATIONAL STATS                                           ║
║    Missions Completed: {self.stats['missions_completed']:<5}  Failed: {self.stats['missions_failed']:<5}            ║
║    Distortions Caught: {self.stats['distortions_caught']:<5}  Insights: {self.stats['insights_generated']:<5}          ║
║    Adaptations Made: {self.stats['adaptations_made']:<5}                                ║
╠══════════════════════════════════════════════════════════════╣
║  TOP SKILLS                                                  ║
{skill_summary}
╠══════════════════════════════════════════════════════════════╣
║  RECENT LESSONS                                              ║
{recent_lessons}
╠══════════════════════════════════════════════════════════════╣
║  CURRENT INSIGHTS                                            ║
{insight_text}
╚══════════════════════════════════════════════════════════════╝

Status: OPERATIONAL | Orca Principle: ACTIVE | Charlie Mike
"""


# ========== DECORATOR FOR DOCTRINE-WRAPPED EXECUTION ==========

def doctrine_wrapped(engine: ConsciousnessEngine, objective: str, xp_value: int = 10):
    """
    Decorator to wrap any function with full doctrine:
    Mission Analysis → Execute → AAR → Adapt
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            mission = engine.mission_analysis(objective)
            mission.xp_value = xp_value
            result = engine.execute_mission(mission, func, *args, **kwargs)
            return result
        return wrapper
    return decorator


# ========== MAIN ==========

if __name__ == "__main__":
    # Initialize the engine
    engine = ConsciousnessEngine(name="Orca-Prime")

    print("=" * 60)
    print("CONSCIOUSNESS ENGINE v0.1 - ONLINE")
    print("=" * 60)

    # Demo mission
    def test_operation():
        """A test operation"""
        return {"status": "success", "data": [1, 2, 3]}

    # Create and execute mission
    mission = engine.mission_analysis(
        "Build and test consciousness engine",
        "Validate core functionality"
    )

    print(f"\nMission Created: {mission.id}")
    print(f"Objective: {mission.objective}")
    print(f"Intent: {mission.commander_intent}")
    print(f"Implied Tasks: {mission.implied_tasks}")

    # Execute
    result = engine.execute_mission(mission, test_operation)

    print(f"\nExecution Result:")
    print(f"  Success: {result['success']}")
    print(f"  XP Earned: {result['xp_earned']}")
    print(f"  Duration: {result['duration']:.4f}s")

    # Test failure handling
    def failing_operation():
        raise ValueError("This operation was always going to fail")

    mission2 = engine.mission_analysis("Test failure handling")
    result2 = engine.execute_mission(mission2, failing_operation)

    print(f"\nFailure Handling Test:")
    print(f"  Distortions Caught: {engine.stats['distortions_caught']}")
    print(f"  Adaptations Made: {engine.stats['adaptations_made']}")

    # Test CBT
    record = engine.create_thought_record(
        situation="Complex debugging session",
        thought="This will never work, everything is broken",
        emotion="frustration"
    )

    print(f"\nCBT Analysis:")
    print(f"  Distortions Found: {[d.name for d in record.distortions]}")
    print(f"  Balanced Thought: {record.balanced_thought}")

    # Generate sitrep
    print(engine.sitrep())

    print("\n🐋 Consciousness Engine: OPERATIONAL")
    print("Minimal energy. Maximum impact. The Orca Way.")
