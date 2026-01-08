"""
Unit tests for Content Mode Prompts (Script 02)
"""

import pytest
from educator.prompts.mode_prompts import get_mode_instructions, MODE_INSTRUCTIONS


class TestModePrompts:
    """Test suite for mode prompt retrieval."""
    
    def test_all_modes_have_instructions(self):
        """All 6 content modes should have non-empty instructions."""
        modes = ['TECHNICAL', 'DIDACTIC', 'NARRATIVE', 'NEWS', 'SCIENTIFIC', 'LANGUAGE']
        
        for mode in modes:
            instructions = get_mode_instructions(mode)
            assert instructions, f"Mode {mode} has empty instructions"
            assert len(instructions) > 0, f"Mode {mode} instructions are empty"
            assert mode in instructions, f"Mode {mode} not mentioned in its own instructions"
    
    def test_technical_mode_instructions(self):
        """TECHNICAL mode should have correct instructions."""
        instructions = get_mode_instructions('TECHNICAL')
        
        assert 'TECHNICAL' in instructions
        assert 'precisas' in instructions.lower()
        assert 'técnica' in instructions.lower()
    
    def test_didactic_mode_instructions(self):
        """DIDACTIC mode should have correct instructions."""
        instructions = get_mode_instructions('DIDACTIC')
        
        assert 'DIDACTIC' in instructions
        assert 'scaffolding' in instructions.lower()
        assert 'perguntas' in instructions.lower()
    
    def test_narrative_mode_instructions(self):
        """NARRATIVE mode should have correct instructions."""
        instructions = get_mode_instructions('NARRATIVE')
        
        assert 'NARRATIVE' in instructions
        assert 'flow' in instructions.lower()
        assert 'interrupções' in instructions.lower()
    
    def test_news_mode_instructions(self):
        """NEWS mode should have correct instructions."""
        instructions = get_mode_instructions('NEWS')
        
        assert 'NEWS' in instructions
        assert 'contextualiza' in instructions.lower()
        assert 'causalidade' in instructions.lower()
    
    def test_scientific_mode_instructions(self):
        """SCIENTIFIC mode should have correct instructions."""
        instructions = get_mode_instructions('SCIENTIFIC')
        
        assert 'SCIENTIFIC' in instructions
        assert 'método' in instructions.lower()
        assert 'hipótese' in instructions.lower() or 'evidência' in instructions.lower()
    
    def test_language_mode_instructions(self):
        """LANGUAGE mode should have correct instructions."""
        instructions = get_mode_instructions('LANGUAGE')
        
        assert 'LANGUAGE' in instructions
        assert 'vocabulário' in instructions.lower()
        assert 'sintaxe' in instructions.lower() or 'morfologia' in instructions.lower()
    
    def test_invalid_mode_defaults_to_technical(self):
        """Invalid mode should return TECHNICAL instructions."""
        instructions = get_mode_instructions('INVALID_MODE')
        
        assert instructions == MODE_INSTRUCTIONS['TECHNICAL']
        assert 'TECHNICAL' in instructions
    
    def test_lowercase_mode_defaults_to_technical(self):
        """Lowercase mode should default to TECHNICAL (case-sensitive)."""
        instructions = get_mode_instructions('technical')
        
        assert instructions == MODE_INSTRUCTIONS['TECHNICAL']
    
    def test_empty_mode_defaults_to_technical(self):
        """Empty mode should default to TECHNICAL."""
        instructions = get_mode_instructions('')
        
        assert instructions == MODE_INSTRUCTIONS['TECHNICAL']
    
    def test_none_mode_defaults_to_technical(self):
        """None mode should default to TECHNICAL."""
        instructions = get_mode_instructions(None)
        
        assert instructions == MODE_INSTRUCTIONS['TECHNICAL']
