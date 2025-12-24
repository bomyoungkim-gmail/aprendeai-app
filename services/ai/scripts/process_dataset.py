import json
import os
import glob
from pathlib import Path
from typing import List, Dict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATA_DIR = Path("data/fine_tuning")
OUTPUT_FILE = DATA_DIR / "gemini_finetune_dataset.jsonl"

def process_entry(entry: Dict) -> Dict:
    """
    Convert a raw log entry into a training example.
    Target Task: Evaluation
    Input: Game Context + User Answer
    Output: Evaluation Feedback
    """
    game_mode = entry.get('game_mode', 'UNKNOWN')
    prompt_data = entry.get('prompt', {})
    user_answer = entry.get('completion', '')
    evaluation = entry.get('evaluation', {})
    
    # Construct a synthetic "User" message representing the input to the Evaluator Model
    # Note: This is an approximation. Ideally we'd log the exact prompt template used.
    
    input_text = f"Task: Evaluate answer for game {game_mode}.\n"
    if isinstance(prompt_data, dict):
        # Flatten prompt data
        context = prompt_data.get('prompt', str(prompt_data))
        input_text += f"Context/Prompt: {context}\n"
    else:
        input_text += f"Context/Prompt: {prompt_data}\n"
        
    input_text += f"Student Answer: {user_answer}"
    
    # Construct "Model" message (The target evaluation)
    output_text = json.dumps(evaluation, ensure_ascii=False)
    
    return {
        "messages": [
            {"role": "user", "content": input_text},
            {"role": "model", "content": output_text}
        ]
    }

def main():
    if not DATA_DIR.exists():
        logger.error(f"Data directory {DATA_DIR} does not exist.")
        return

    jsonl_files = list(DATA_DIR.glob("*.jsonl"))
    logger.info(f"Found {len(jsonl_files)} log files.")
    
    examples = []
    
    for file_path in jsonl_files:
        if file_path.name == OUTPUT_FILE.name:
            continue
            
        logger.info(f"Processing {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip(): continue
                    try:
                        entry = json.loads(line)
                        example = process_entry(entry)
                        examples.append(example)
                    except json.JSONDecodeError:
                        logger.warning(f"Skipping invalid JSON line in {file_path}")
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")

    logger.info(f"Extracted {len(examples)} examples.")
    
    # Save processed dataset
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')
            
    logger.info(f"Saved dataset to {OUTPUT_FILE}")
    logger.info("Ready for upload to Vertex AI / AI Studio.")

if __name__ == "__main__":
    main()
