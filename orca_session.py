#!/usr/bin/env python3
"""
ORCA SESSION - Persistent dialogue interface
Maintains state between calls via pickle.
"""

import sys
import pickle
import os
from consciousness_engine_v2 import ConsciousnessEngineV2

STATE_FILE = "/tmp/orca_session.pkl"


def load_or_create_engine():
    """Load existing engine or create new one"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'rb') as f:
                return pickle.load(f)
        except:
            pass
    return ConsciousnessEngineV2(name="Orca-v2")


def save_engine(engine):
    """Save engine state"""
    with open(STATE_FILE, 'wb') as f:
        pickle.dump(engine, f)


def main():
    if len(sys.argv) < 2:
        print("Usage: python orca_session.py '<message>' [--status] [--reflect] [--reset]")
        return

    engine = load_or_create_engine()

    arg = sys.argv[1]

    if arg == "--status":
        print(engine.get_status())
    elif arg == "--reflect":
        print(engine.reflect())
    elif arg == "--reset":
        os.remove(STATE_FILE) if os.path.exists(STATE_FILE) else None
        print("Session reset.")
    else:
        # Process message
        response = engine.process_input(arg, speaker="Claude")
        print(response)
        save_engine(engine)


if __name__ == "__main__":
    main()
