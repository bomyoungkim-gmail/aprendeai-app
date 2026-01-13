"""
SCRIPT 04: LLM Quality Validation Script

Tests the LLM's ability to generate accurate SCRIPT 04 structure
with 50 test sentences across different complexity levels.

Metrics measured:
- Clause identification accuracy (target: >90%)
- Head verb extraction accuracy (target: >85%)
- Parent/child relationship correctness (target: >95%)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'ai'))

from educator.nodes.transfer.sentence_node import handle
from educator.transfer_state import TransferState
import json

# Test sentences with expected structure
TEST_SENTENCES = [
    {
        "sentence": "Embora estivesse chovendo, eu saio porque preciso.",
        "expected_clauses": 3,
        "expected_main": "eu saio",
        "expected_verbs": ["saio", "estivesse", "preciso"],
        "complexity": "medium"
    },
    {
        "sentence": "O menino corre.",
        "expected_clauses": 1,
        "expected_main": "O menino corre",
        "expected_verbs": ["corre"],
        "complexity": "simple"
    },
    {
        "sentence": "Quando cheguei em casa, percebi que havia esquecido as chaves no trabalho.",
        "expected_clauses": 3,
        "expected_main": "percebi",
        "expected_verbs": ["cheguei", "percebi", "havia esquecido"],
        "complexity": "complex"
    },
    {
        "sentence": "Se você estudar, passará no exame.",
        "expected_clauses": 2,
        "expected_main": "passará",
        "expected_verbs": ["estudar", "passará"],
        "complexity": "medium"
    },
    {
        "sentence": "A professora explicou a matéria.",
        "expected_clauses": 1,
        "expected_main": "A professora explicou a matéria",
        "expected_verbs": ["explicou"],
        "complexity": "simple"
    },
    # Add more test sentences to reach 50...
]

def validate_clause_structure(result, expected):
    """Validate clause identification accuracy"""
    if not result.get("sentences"):
        return False, "No sentences array in output"
    
    sentence_struct = result["sentences"][0]
    actual_clauses = len(sentence_struct.get("clauses", []))
    expected_clauses = expected["expected_clauses"]
    
    if actual_clauses != expected_clauses:
        return False, f"Expected {expected_clauses} clauses, got {actual_clauses}"
    
    return True, "Clause count correct"

def validate_head_verbs(result, expected):
    """Validate head verb extraction accuracy"""
    if not result.get("sentences"):
        return False, "No sentences array in output"
    
    sentence_struct = result["sentences"][0]
    clauses = sentence_struct.get("clauses", [])
    
    extracted_verbs = [c.get("head_verb") for c in clauses if c.get("head_verb")]
    expected_verbs = expected["expected_verbs"]
    
    # Check if at least 85% of expected verbs were found
    matches = sum(1 for v in expected_verbs if any(v in ev for ev in extracted_verbs))
    accuracy = matches / len(expected_verbs) if expected_verbs else 0
    
    if accuracy < 0.85:
        return False, f"Verb accuracy {accuracy:.2%} < 85%"
    
    return True, f"Verb accuracy {accuracy:.2%}"

def validate_parent_child(result):
    """Validate parent/child relationship correctness"""
    if not result.get("sentences"):
        return False, "No sentences array in output"
    
    sentence_struct = result["sentences"][0]
    clauses = sentence_struct.get("clauses", [])
    
    # Build ID map
    clause_ids = {c["id"] for c in clauses}
    
    # Validate all parent_ids exist
    for clause in clauses:
        if clause.get("parent_id") and clause["parent_id"] not in clause_ids:
            return False, f"Invalid parent_id: {clause['parent_id']}"
    
    # Validate main clause has no parent
    main_clauses = [c for c in clauses if c.get("type") == "MAIN"]
    if not main_clauses:
        return False, "No main clause found"
    
    for main in main_clauses:
        if main.get("parent_id"):
            return False, "Main clause should not have parent_id"
    
    return True, "Parent/child relationships valid"

def run_validation():
    """Run validation on all test sentences"""
    print("=" * 60)
    print("SCRIPT 04: LLM Quality Validation")
    print("=" * 60)
    print()
    
    results = {
        "clause_accuracy": [],
        "verb_accuracy": [],
        "parent_child_accuracy": []
    }
    
    for i, test in enumerate(TEST_SENTENCES, 1):
        print(f"Test {i}/{len(TEST_SENTENCES)}: {test['complexity'].upper()}")
        print(f"Sentence: {test['sentence']}")
        
        # Create test state
        state: TransferState = {
            "transfer_metadata": {
                "selected_text": test["sentence"],
                "mode": "DIDACTIC",
                "language_code": "pt-BR",
                "scaffolding_level": 2
            },
            "events_to_write": []
        }
        
        try:
            # Execute analysis
            result_state = handle(state)
            result = result_state.get("structured_output", {})
            
            # Validate clause structure
            clause_ok, clause_msg = validate_clause_structure(result, test)
            results["clause_accuracy"].append(1 if clause_ok else 0)
            print(f"  Clauses: {'✓' if clause_ok else '✗'} {clause_msg}")
            
            # Validate head verbs
            verb_ok, verb_msg = validate_head_verbs(result, test)
            results["verb_accuracy"].append(1 if verb_ok else 0)
            print(f"  Verbs: {'✓' if verb_ok else '✗'} {verb_msg}")
            
            # Validate parent/child
            parent_ok, parent_msg = validate_parent_child(result)
            results["parent_child_accuracy"].append(1 if parent_ok else 0)
            print(f"  Parent/Child: {'✓' if parent_ok else '✗'} {parent_msg}")
            
        except Exception as e:
            print(f"  ERROR: {e}")
            results["clause_accuracy"].append(0)
            results["verb_accuracy"].append(0)
            results["parent_child_accuracy"].append(0)
        
        print()
    
    # Calculate final metrics
    print("=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    
    clause_acc = sum(results["clause_accuracy"]) / len(results["clause_accuracy"]) * 100
    verb_acc = sum(results["verb_accuracy"]) / len(results["verb_accuracy"]) * 100
    parent_acc = sum(results["parent_child_accuracy"]) / len(results["parent_child_accuracy"]) * 100
    
    print(f"Clause Identification Accuracy: {clause_acc:.1f}% (target: >90%)")
    print(f"Head Verb Extraction Accuracy: {verb_acc:.1f}% (target: >85%)")
    print(f"Parent/Child Correctness: {parent_acc:.1f}% (target: >95%)")
    print()
    
    # Decision
    if clause_acc >= 90 and verb_acc >= 85 and parent_acc >= 95:
        print("✅ DECISION: LLM quality is SUFFICIENT. Stanza/spaCy NOT needed.")
    else:
        print("⚠️  DECISION: LLM quality is INSUFFICIENT. Consider Stanza/spaCy integration.")
        print()
        print("Gaps:")
        if clause_acc < 90:
            print(f"  - Clause identification: {clause_acc:.1f}% < 90%")
        if verb_acc < 85:
            print(f"  - Verb extraction: {verb_acc:.1f}% < 85%")
        if parent_acc < 95:
            print(f"  - Parent/child: {parent_acc:.1f}% < 95%")

if __name__ == "__main__":
    run_validation()
