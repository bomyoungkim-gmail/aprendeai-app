#!/usr/bin/env python3
"""
Script to convert all game evaluate_answer methods to async
"""

import os
import re

GAMES_DIR = "services/ai/games/modes"

def convert_file(filepath):
    """Convert evaluate_answer to async in a game file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern: def evaluate_answer(
    # Replace with: async def evaluate_answer(
    pattern = r'(\s+)def evaluate_answer\('
    replacement = r'\1async def evaluate_answer('
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    games_path = GAMES_DIR
    count = 0
    
    for filename in os.listdir(games_path):
        if filename.endswith('.py') and filename != '__init__.py' and filename != 'base.py':
            filepath = os.path.join(games_path, filename)
            if convert_file(filepath):
                print(f"✓ Converted {filename}")
                count += 1
            else:
                print(f"- Skipped {filename} (no changes needed)")
    
    print(f"\n✅ Converted {count} game files to async")

if __name__ == "__main__":
    main()
