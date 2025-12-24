
import pytest
from games.modes.tool_word_hunt import ToolWordHuntGame

class TestPersonalization:
    def test_prompt_language_pt(self):
        """Verify PT-BR prompt generation"""
        game = ToolWordHuntGame()
        state = {
            "learner_profile": {"language": "PT"}
        }
        
        round_data = game.create_round(state, difficulty=1)
        prompt = round_data['prompt']
        
        assert "Caça-Palavras Analítico" in prompt
        assert "Encontre a palavra" in prompt
        assert "Language: PT" in prompt

    def test_prompt_language_en(self):
        """Verify EN prompt generation"""
        game = ToolWordHuntGame()
        state = {
            "learner_profile": {"language": "EN"}
        }
        
        round_data = game.create_round(state, difficulty=1)
        prompt = round_data['prompt']
        
        assert "Analytical Word Hunt" in prompt
        assert "Find the word" in prompt
        assert "Language: EN" in prompt

    def test_prompt_default_fallback(self):
        """Verify default to PT if no profile"""
        game = ToolWordHuntGame()
        state = {} # No profile
        
        round_data = game.create_round(state, difficulty=1)
        prompt = round_data['prompt']
        
        assert "Caça-Palavras Analítico" in prompt # Default
