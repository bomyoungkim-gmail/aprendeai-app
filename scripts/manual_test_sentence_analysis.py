"""
Manual test script for SENTENCE_ANALYSIS with REAL LLM (No Mocks).

Usage:
    python scripts/manual_test_sentence_analysis.py

Prerequisites:
    - Environment variables for LLM must be set (GOOGLE_API_KEY or OPENAI_API_KEY)
    - Dependencies installed
"""

import os
import sys
import logging
import json
from pprint import pprint

# Add project root and services/ai to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services", "ai"))

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from educator.nodes.transfer.sentence_node import handle as sentence_handle
    from educator.transfer_state import TransferState
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure you are running validation from the project root.")
    sys.exit(1)

def run_live_test():
    print("🚀 Starting LIVE SENTENCE_ANALYSIS Test (Real LLM)...")
    
    # Check for API keys
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        print("⚠️  WARNING: No API keys found in environment. Test might fail if not using local LLM.")
    
    # 1. Define Test State
    test_state: TransferState = {
        "intent": "SENTENCE_ANALYSIS",
        "user_id": "manual_test_user",
        "session_id": "manual_session_001",
        "content_id": "manual_content",
        "scaffolding_level": 2,  # Apprentice level
        "transfer_metadata": {
            "selected_text": "Embora o projeto fosse complexo, a equipe entregou no prazo porque trabalhou unida.",
            "language_code": "pt-BR",
            "mode": "DIDACTIC"
        },
        "style_instructions": "Seja didático e encorajador.",
        "max_tokens": 1000,
        "events_to_write": []
    }
    
    print(f"\n📝 Input Text: '{test_state['transfer_metadata']['selected_text']}'")
    print(f"⚙️  Scaffolding Level: {test_state['scaffolding_level']}")
    
    try:
        # 2. Execute Handler (No Patching/Mocking)
        print("\n⏳ Calling LLM (this may take a few seconds)...")
        result_state = sentence_handle(test_state)
        
        # 3. Output Results
        print("\n✅ Analysis Complete!")
        
        output = result_state.get("structured_output")
        if output:
            print("\n📊 STRUCTURED OUTPUT:")
            print(json.dumps(output, indent=2, ensure_ascii=False))
            
            # Validation
            main_clause = output.get("main_clause")
            confidence = output.get("confidence", 0.0)
            print(f"\n🔍 Main Clause: {main_clause}")
            print(f"🎯 Confidence: {confidence}")
            
            if confidence < 0.3:
                print("⚠️  Low confidence - Check if Fallback was triggered.")
            else:
                print("🌟 High confidence - LLM processed successfully.")
                
        else:
            print("\n❌ No structured output returned.")
            
        print("\n📝 RESPONSE TEXT (Markdown):")
        print("-" * 40)
        print(result_state.get("response_text"))
        print("-" * 40)
        
        # 4. Telemetry Check
        events = result_state.get("events_to_write", [])
        print(f"\n📡 Telemetry Events Generated: {len(events)}")
        for evt in events:
            print(f"   - {evt['eventType']}: {evt.get('payloadJson', {}).get('kind')}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_live_test()
