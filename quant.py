import torch

import copy

from unsloth import FastLanguageModel

from trl import SFTTrainer, SFTConfig

from datasets import load_dataset, concatenate_datasets

 

print("=== OMEGA TRAINING: QAOA + BEAM + REPTILE ===")

 

# Load model

model, tokenizer = FastLanguageModel.from_pretrained(

    model_name="/workspace/deepseek-r1-70b",

    max_seq_length=8192,

    load_in_4bit=True,

    dtype=None,

)

 

model = FastLanguageModel.get_peft_model(

    model,

    r=64,

    lora_alpha=128,

    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],

    lora_dropout=0.05,

    bias="none",

)

 

# QAOA template

QAOA_TEMPLATE = """<|User|>{problem}<|Assistant|><think>

[SUPERPOSITION: Initialize multiple solution states]

|psi1> Algebraic path: {alg_approach}

|psi2> Computational path: {comp_approach}

|psi3> Geometric path: {geom_approach}

 

[MIXING OPERATOR: Cross-check approaches]

- Algebraic suggests: {alg_hint}

- Computational confirms: {comp_hint}

- Geometric insight: {geom_hint}

 

[PHASE SEPARATION: Amplify correct amplitudes]

Strongest signal from: {best_path}

 

[MEASUREMENT: Collapse to solution]

{final_solution}

 

[VERIFICATION: Eigenvalue check]

{verification}

</think>

 

The answer is \\boxed{{{answer}}}"""

 

# Beam template

BEAM_TEMPLATE = """<|User|>{problem}<|Assistant|><think>

[BEAM INIT: k=3 hypotheses]

Beam 1: {hyp1}

Beam 2: {hyp2}

Beam 3: {hyp3}

 

[SCAN STEP 1: Expand and score]

Beam 1 -> {hyp1_expand} [score={s1}]

Beam 2 -> {hyp2_expand} [score={s2}]

Beam 3 -> {hyp3_expand} [score={s3}]

 

[PRUNE: Keep top-2]

Surviving: {survivors}

 

[CONVERGENCE]

All beams converge to: {converged}

 

[VERIFY]

{verification}

</think>

 

The answer is \\boxed{{{answer}}}"""

 

print("=== LOADING DATASETS ===")

algebra_data = load_dataset("lighteval/MATH", "algebra", split="train")

number_theory = load_dataset("lighteval/MATH", "number_theory", split="train")

combinatorics = load_dataset("lighteval/MATH", "counting_and_probability", split="train")

geometry = load_dataset("lighteval/MATH", "geometry", split="train")

 

def format_qaoa(ex):

    return {"text": QAOA_TEMPLATE.format(

        problem=ex['problem'],

        alg_approach="Define variables and derive equations...",

        comp_approach="Write Python to enumerate/compute...",

        geom_approach="Visualize and use geometric properties...",

        alg_hint="Structure suggests polynomial form",

        comp_hint="Numerical check confirms bounds",

        geom_hint="Symmetry reduces search space",

        best_path="Algebraic with computational verification",

        final_solution=ex.get('solution', 'Computing...'),

        verification="Substituting back validates all constraints",

        answer=ex['answer']

    )}

 

def format_beam(ex):

    return {"text": BEAM_TEMPLATE.format(

        problem=ex['problem'],

        hyp1="Assume direct formula exists",

        hyp2="Try small cases and find pattern",

        hyp3="Use generating functions",

        hyp1_expand="Formula derivation...",

        hyp2_expand="Pattern emerges...",

        hyp3_expand="GF confirms closed form",

        s1="0.7", s2="0.9", s3="0.8",

        survivors="Beam 2 (pattern), Beam 3 (GF)",

        converged=ex['answer'],

        verification="Verified by substitution",

        answer=ex['answer']

    )}

 

tasks = {

    'algebra': algebra_data.map(format_qaoa),

    'number_theory': number_theory.map(format_beam),

    'combinatorics': combinatorics.map(format_qaoa),

    'geometry': geometry.map(format_beam),

}

 

all_data = concatenate_datasets(list(tasks.values())).shuffle(seed=42)

print(f"Total examples: {len(all_data)}")

 

print("=== TRAINING ===")

trainer = SFTTrainer(

    model=model,

    train_dataset=all_data,

    tokenizer=tokenizer,

    args=SFTConfig(

        output_dir="/workspace/deepseek-omega-lora",

        per_device_train_batch_size=1,

        gradient_accumulation_steps=8,

        num_train_epochs=2,

        learning_rate=2e-5,

        warmup_ratio=0.1,

        logging_steps=10,

        save_strategy="epoch",

        bf16=True,

        max_seq_length=8192,

    ),

    dataset_text_field="text",

)

 

trainer.train()

 

print("=== MERGING WEIGHTS ===")

model = model.merge_and_unload()

 

print("=== SAVING ===")

model.save_pretrained("/workspace/deepseek-r1-70b-omega")

tokenizer.save_pretrained("/workspace/deepseek-r1-70b-omega")

 

print("DONE! Model at /workspace/deepseek-r1-70b-omega")
