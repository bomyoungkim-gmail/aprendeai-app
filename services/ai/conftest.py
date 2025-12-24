"""
Pytest configuration and fixtures

This file is automatically discovered by pytest and runs before tests.
Configures Python path and provides shared fixtures.
"""
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

print(f"[conftest] Added to path: {project_root}")


# Shared fixtures can be added here
import pytest


@pytest.fixture
def sample_pedagogical_state():
    """Sample pedagogical state for game tests"""
    return {
        'content_slice': 'Este é um texto de exemplo sobre inteligência artificial e machine learning.',
        'target_words': ['inteligência', 'artificial', 'machine', 'learning'],
        'phase': 'POST',
        'difficulty': 2,
    }


@pytest.fixture
def sample_game_metadata():
    """Sample game metadata for testing"""
    return {
        'game_mode': 'TEST_GAME',
        'difficulty': 2,
        'step': 'initial',
    }
