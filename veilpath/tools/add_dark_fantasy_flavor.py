#!/usr/bin/env python3
"""
Add Dark Fantasy Flavor to Card Database
Enhances existing cardDatabase.js with dark fantasy themed descriptions
"""

import json
import re

# Dark fantasy flavor for Major Arcana
MAJOR_ARCANA_FLAVOR = {
    0: {  # The Fool
        "title": "The Wanderer at the Veil's Edge",
        "description": "A hooded figure stands at the precipice of a moonlit chasm, one foot suspended over an endless void. Behind them, a spectral wolf with eyes like silver moons watches—protector or omen unclear. The Veil shimmers in the distance, a gossamer curtain between worlds of shadow and light.",
        "questTie": "The First Step - Luna's initial quest to cross the Threshold into the Shadowlands",
        "npcReference": "Luna guides new Fools through their first journey beyond the Veil"
    },
    1: {  # The Magician
        "title": "The Alchemist of Infinite Potential",
        "description": "In a tower chamber lit by celestial fire, robed hands channel raw power through ancient symbols. The four elemental tools float suspended—wand of flame, chalice of starlight, blade of wind, and coin of earth. The infinity symbol burns overhead, marking this as a place where will becomes reality.",
        "questTie": "Mastery Path - Sol's challenge to harness the elements within",
        "npcReference": "Sol's archetype for those who choose to master rather than submit"
    },
    2: {  # The High Priestess
        "title": "The Keeper of Moonlit Mysteries",
        "description": "She sits between pillars of obsidian and pearl, a scroll of forgotten truths resting in her lap. The crescent moon crowns her brow, and behind her, the Veil parts to reveal glimpses of the unconscious depths—a sea of dreams and shadow-wisdom.",
        "questTie": "Secrets of the Moon - Access the Hidden Library beneath the Shadowlands",
        "npcReference": "Luna's highest form—silent knowing, intuition made flesh"
    },
    3: {  # The Empress
        "title": "The Mother of All Growing Things",
        "description": "Enthroned in a grove where twilight roses bloom eternal, she nurtures life in all its feral beauty. Her garden holds both poison and nectar, thorn and petal. Around her, nature pulses with dark fertility—creation without apology.",
        "questTie": "Abundance Quest - Restore the Withered Gardens of the Shadowlands",
        "npcReference": "The Gardener NPC who trades seeds for Moonlight currency"
    },
    4: {  # The Emperor
        "title": "The Architect of Order in Chaos",
        "description": "On a throne of volcanic stone, he gazes over a realm carved from raw wilderness into structured kingdoms. His armor is forged from fallen stars, his scepter a rod of unyielding will. Behind him, mountains bow to geometric precision.",
        "questTie": "Dominion Quest - Establish order in the Wild Territories",
        "npcReference": "Sol's stern aspect—structure as sacred practice"
    },
    5: {  # The Hierophant
        "title": "The Guardian of Ancient Rites",
        "description": "In a cathedral of bone and crystal, he teaches the old ways—rituals that bind heaven and earth, past and future. Disciples kneel before him, seeking the keys to spiritual authority. Behind the altar, the Veil glows with sanctified power.",
        "questTie": "The Old Ways - Recover lost rituals from the Temple Ruins",
        "npcReference": "The Hierophant NPC who unlocks premium spreads for Veil Shards"
    },
    6: {  # The Lovers
        "title": "The Choice Between Worlds",
        "description": "Two figures stand beneath a twilight sky, hands reaching but not yet touching. Between them, a serpent coils around the Tree of Knowledge, offering both ecstasy and exile. Above, an angel of dark wings blesses their union—or their undoing.",
        "questTie": "Heart's Dilemma - Navigate the Romance Questline (dual paths)",
        "npcReference": "The choice between Luna's emotional path and Sol's rational path"
    },
    7: {  # The Chariot
        "title": "The Conqueror of Inner Beasts",
        "description": "A warrior rides a chariot pulled by sphinxes of shadow and light—one black as void, one white as bone. They strain against each other, held in check only by the driver's iron will. The road ahead cuts through enemy territory.",
        "questTie": "Victory March - Complete the Tournament of Wills",
        "npcReference": "Sol's test of controlled aggression and directed force"
    },
    8: {  # Strength
        "title": "The Tamer of Feral Hearts",
        "description": "With bare hands, she closes the jaws of a great beast, not through force but through grace. The lion's mane glows like embers; her touch is gentle as moonlight. This is power that does not dominate but transforms through love.",
        "questTie": "Beast Taming - Befriend the Shadow Creatures of the Wildlands",
        "npcReference": "Luna's compassion as strength—soft power that endures"
    },
    9: {  # The Hermit
        "title": "The Seeker in the Dark",
        "description": "Alone on a mountain peak, he holds a lantern that casts a single beam through endless night. The staff in his hand is gnarled with age, the path behind him erased by snow. He searches for truth that cannot be taught, only found.",
        "questTie": "Solitude Quest - Meditation retreat in the Hermit's Cave",
        "npcReference": "The Hermit NPC who offers solo guided journeys (premium feature)"
    },
    10: {  # Wheel of Fortune
        "title": "The Cycle of Fate's Turning",
        "description": "A great wheel spins in the void, inscribed with runes of destiny. Creatures rise and fall with its rotation—angels ascending, demons descending, mortals clinging to its spokes. At the center, stillness. At the edge, chaos.",
        "questTie": "Fate's Game - Complete the RNG-based Wheel of Fortunes mini-game",
        "npcReference": "The Fates—three NPCs who control randomness and luck"
    },
    11: {  # Justice
        "title": "The Arbiter's Blade",
        "description": "She sits blindfolded in a hall of mirrors, holding scales that weigh souls against truth. Her sword is double-edged, reflecting both mercy and severity. Every judgment echoes through eternity—there is no escape from balance.",
        "questTie": "Trial Quest - Face judgment in the Court of Echoes",
        "npcReference": "The Judge NPC who resolves moral dilemma quests"
    },
    12: {  # The Hanged Man
        "title": "The Sacrifice That Transforms",
        "description": "Suspended upside-down from the World Tree, he hangs in perfect stillness. His face is serene, not suffering—this is willing sacrifice, chosen surrender. From his inverted perspective, the world reveals hidden patterns.",
        "questTie": "Inversion Quest - Surrender something to gain everything",
        "npcReference": "Luna's wisdom: sometimes the only way forward is to stop moving"
    },
    13: {  # Death
        "title": "The Reaper of All That Must End",
        "description": "Astride a pale horse, Death rides through fields of dying stars. The armor is black as oblivion, the banner a white rose on a field of night. Where the horse treads, old worlds crumble—and from the ashes, new ones rise.",
        "questTie": "Ending Quest - Close a chapter to begin anew (major story beat)",
        "npcReference": "Death is not an NPC but an event—unavoidable transformation"
    },
    14: {  # Temperance
        "title": "The Alchemist of Balance",
        "description": "An angel with wings of fire and water pours liquid between two chalices, mixing opposites into synthesis. One foot stands on earth, one in a flowing river—bridging realms, blending extremes. The elixir glows with impossible colors.",
        "questTie": "Alchemy Quest - Combine opposing elements in the Forge of Synthesis",
        "npcReference": "The Alchemist NPC who teaches moderation and integration"
    },
    15: {  # The Devil
        "title": "The Chains We Choose",
        "description": "On a throne of obsidian, the Devil presides over chained souls who do not realize the shackles are unlocked. The chains are addiction, materialism, fear—self-imposed prisons. The Devil grins, knowing freedom requires only the will to walk away.",
        "questTie": "Bondage Quest - Break free from self-imposed limitations",
        "npcReference": "The Tempter NPC who offers easy power at hidden cost"
    },
    16: {  # The Tower
        "title": "The Lightning Strike of Truth",
        "description": "A tower built on false foundations crumbles as lightning cracks the sky. Figures fall from the heights, their illusions shattered. This is not punishment but liberation—the destruction of what was never real.",
        "questTie": "Collapse Quest - Watch your certainties burn (dramatic story event)",
        "npcReference": "Sol's harsh mercy—the truth that destroys to rebuild"
    },
    17: {  # The Star
        "title": "The Hope That Survives the Dark",
        "description": "Beneath an eight-pointed star, she kneels by a pool of starlight, pouring water from two urns—one into the earth, one into the water. Her nakedness is vulnerability made sacred. After the Tower's destruction, this is the promise of renewal.",
        "questTie": "Healing Quest - Restore hope to the Broken Lands",
        "npcReference": "The Healer NPC who offers recovery after trials"
    },
    18: {  # The Moon
        "title": "The Realm of Dreams and Madness",
        "description": "Twin towers frame a path that leads between them toward a moon that is both luminous and hollow. A wolf and a dog howl at its face, representing wild and tame instinct. In the water, a crayfish emerges from the depths—the unconscious rising.",
        "questTie": "Dream Quest - Navigate the Labyrinth of Nightmares",
        "npcReference": "Luna's domain—the realm of illusion, intuition, and hidden fears"
    },
    19: {  # The Sun
        "title": "The Radiance of Awakening",
        "description": "A child rides a white horse beneath a blazing sun, naked and unashamed, arms spread wide in pure joy. Sunflowers turn their faces upward, basking in warmth. This is clarity after confusion, truth after deception—life itself celebrating.",
        "questTie": "Joy Quest - Experience unfiltered happiness (rare success state)",
        "npcReference": "Sol's purest form—consciousness as celebration"
    },
    20: {  # Judgement
        "title": "The Resurrection of the Dead",
        "description": "An angel's trumpet sounds across graves, calling the buried to rise. Figures emerge from coffins, arms raised in praise or terror. This is the final accounting—past lives judged, new forms given. Death is not the end.",
        "questTie": "Rebirth Quest - Complete character transformation (major milestone)",
        "npcReference": "The Harbinger NPC who offers character respecs"
    },
    21: {  # The World
        "title": "The Dance of Completion",
        "description": "At the center of all things, a figure dances within a wreath of victory, holding twin wands of power. The four evangelists watch from the corners—angel, eagle, lion, bull. The journey is complete. The circle closes. A new cycle begins.",
        "questTie": "Completion Quest - Achieve enlightenment (win condition)",
        "npcReference": "The Cosmic Dancer—the ultimate unity of Luna and Sol"
    }
}

def add_dark_fantasy_to_card(card_text, card_id):
    """Add dark fantasy flavor to a card entry"""
    if card_id not in MAJOR_ARCANA_FLAVOR:
        return card_text

    flavor = MAJOR_ARCANA_FLAVOR[card_id]

    # Insert dark fantasy section before the closing brace
    # Look for the description field (last field before closing brace)
    insert_point = card_text.rfind('description:')

    if insert_point == -1:
        return card_text

    # Find the end of the description field
    desc_end = card_text.find('\n  }', insert_point)
    if desc_end == -1:
        desc_end = card_text.find('\n}', insert_point)

    if desc_end == -1:
        return card_text

    # Create dark fantasy section
    dark_fantasy_text = f''',
    darkFantasy: {{
      title: "{flavor['title']}",
      description: "{flavor['description']}",
      questTie: "{flavor['questTie']}",
      npcReference: "{flavor['npcReference']}"
    }}'''

    # Insert the dark fantasy section
    return card_text[:desc_end] + dark_fantasy_text + card_text[desc_end:]

def main():
    print("🌙 Adding Dark Fantasy Flavor to Card Database...")

    # Read the card database
    with open('src/data/cardDatabase.js', 'r') as f:
        content = f.read()

    # Check if dark fantasy already exists
    if 'darkFantasy' in content:
        print("⚠️  Dark fantasy flavor already exists. Skipping...")
        return

    print("✨ Processing Major Arcana (0-21)...")

    # Split into individual cards
    cards = content.split('\n  {')

    modified_cards = [cards[0]]  # Keep the header

    for i, card in enumerate(cards[1:]):
        # Extract card ID
        id_match = re.search(r'id: (\d+)', card)
        if id_match:
            card_id = int(id_match.group(1))
            if card_id <= 21:  # Major Arcana only for now
                print(f"  Adding flavor to card {card_id}...")
                card = add_dark_fantasy_to_card('  {' + card, card_id)
                modified_cards.append(card[3:])  # Remove the added '  {' prefix
            else:
                modified_cards.append(card)
        else:
            modified_cards.append(card)

    # Rejoin
    new_content = '\n  {'.join(modified_cards)

    # Write back
    with open('src/data/cardDatabase.js', 'w') as f:
        f.write(new_content)

    print("✅ Dark fantasy flavor added successfully!")
    print("📊 Enhanced 22 Major Arcana cards")

if __name__ == '__main__':
    main()
