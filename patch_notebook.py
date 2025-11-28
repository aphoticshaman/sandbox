#!/usr/bin/env python3
"""
NOTEBOOK PATCHER - Fixes orchestrator issue in existing notebook
=================================================================
Run this to patch your notebook in-place
"""

import json
from pathlib import Path

def patch_notebook(notebook_path, output_path=None):
    """
    Patches the LucidOrca notebook to fix orchestrator issue
    
    Args:
        notebook_path: Path to original notebook
        output_path: Where to save patched version (defaults to _patched suffix)
    """
    
    # Load notebook
    with open(notebook_path) as f:
        nb = json.load(f)
    
    # Find Cell 15/16 with the orchestrator issue
    for i, cell in enumerate(nb['cells']):
        if cell['cell_type'] == 'code':
            code = ''.join(cell['source'])
            
            # Look for the problematic pattern
            if 'orchestrator = None' in code and 'orchestrator = UnifiedOrchestrator' in code:
                print(f"Found problematic cell at index {i}")
                
                # Replace the orchestrator initialization
                new_code = code.replace(
                    'orchestrator = None  # ← FIX: Initialize to None before try block',
                    '''# PATCHED: Using singleton pattern to ensure persistence
    import builtins
    orchestrator = None'''
                )
                
                # Add persistence after orchestrator creation
                new_code = new_code.replace(
                    'orchestrator = UnifiedOrchestrator(',
                    '''orchestrator = UnifiedOrchestrator('''
                )
                
                # Add injection after creation
                creation_line = 'print(f"✅ STEP 4: UnifiedOrchestrator created")'
                if creation_line in new_code:
                    new_code = new_code.replace(
                        creation_line,
                        f'''{creation_line}
        
        # PATCH: Inject orchestrator into builtins to ensure persistence
        builtins.orchestrator = orchestrator
        globals()['orchestrator'] = orchestrator'''
                    )
                
                # Update cell
                cell['source'] = new_code.split('\n')
                cell['source'] = [line + '\n' for line in cell['source'][:-1]] + [cell['source'][-1]]
                
                print(f"✅ Patched cell {i}")
    
    # Add a new cell at the beginning with the fix function
    fix_cell = {
        'cell_type': 'code',
        'metadata': {'trusted': True},
        'outputs': [],
        'execution_count': None,
        'source': [
            "# ORCHESTRATOR FIX - Run this after any errors\n",
            "def ensure_orchestrator():\n",
            "    \"\"\"Emergency fix if orchestrator disappears\"\"\"\n",
            "    import builtins\n",
            "    \n",
            "    if 'orchestrator' not in globals() or globals()['orchestrator'] is None:\n",
            "        if hasattr(builtins, 'orchestrator'):\n",
            "            globals()['orchestrator'] = builtins.orchestrator\n",
            "            print('✅ Recovered orchestrator from builtins')\n",
            "        else:\n",
            "            print('❌ Orchestrator not found - rerun Cell 15')\n",
            "            return False\n",
            "    return True\n",
            "\n",
            "print('🔧 Fix function loaded. Call ensure_orchestrator() if needed.')\n"
        ]
    }
    
    # Insert after the first cell
    nb['cells'].insert(1, fix_cell)
    print("✅ Added fix function as Cell 1")
    
    # Save patched notebook
    if output_path is None:
        output_path = Path(notebook_path).stem + '_patched.ipynb'
    
    with open(output_path, 'w') as f:
        json.dump(nb, f, indent=1)
    
    print(f"\n✅ Patched notebook saved to: {output_path}")
    print("\n📝 Instructions:")
    print("1. Upload the patched notebook to Kaggle")
    print("2. Run all cells in order")
    print("3. If orchestrator error occurs, run: ensure_orchestrator()")
    print("4. Continue execution with kaggle_orch.execute()")
    
    return output_path

if __name__ == "__main__":
    # Patch the uploaded notebook
    input_path = '/mnt/user-data/uploads/lucidorca_v1_fixed.ipynb'
    output_path = '/mnt/user-data/outputs/lucidorca_v1_patched.ipynb'
    
    patch_notebook(input_path, output_path)
