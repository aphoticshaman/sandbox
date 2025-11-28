#!/usr/bin/env python3
"""
ORCHESTRATOR FIX - NSM APPLIED
One function. Permanent solution. No BS.
"""

def fix_it():
    """THE FIX. Run after loading notebook."""
    import builtins
    
    # Force orchestrator into builtins - nuclear option that always works
    if 'UnifiedOrchestrator' in globals():
        orch = globals()['UnifiedOrchestrator'](
            config=globals().get('config'),
            task_classifier=globals().get('task_classifier'),
            strategy_router=globals().get('strategy_router'),
            search_engine=globals().get('search_engine'),
            ensemble_combiner=globals().get('ensemble_combiner'),
            metrics_tracker=globals().get('metrics_tracker'),
            checkpoint_manager=globals().get('checkpoint_manager')
        )
        
        # Inject EVERYWHERE
        globals()['orchestrator'] = orch
        builtins.orchestrator = orch
        
        # Patch run function to always have orchestrator
        if 'run_lucidorca_beta' in globals():
            orig = globals()['run_lucidorca_beta']
            def wrapped(*a, **k):
                globals()['orchestrator'] = builtins.orchestrator
                return orig(*a, **k)
            globals()['run_lucidorca_beta'] = wrapped
        
        print("✅ Fixed. orchestrator now permanent.")
        return True
    
    print("❌ Run all cells first.")
    return False

# That's it. No 500 lines of explanation.
