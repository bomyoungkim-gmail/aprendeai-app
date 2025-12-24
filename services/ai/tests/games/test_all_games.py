"""
Simplified comprehensive test suite for all 15 games
Tests LLM integration, fallback, and async patterns
"""
import sys
import pytest
from unittest.mock import Mock, AsyncMock
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Import all game classes
from games.modes.analogy_maker import AnalogyMakerGame
from games.modes.socratic_defense import SocraticDefenseGame
from games.modes.what_if import WhatIfScenarioGame
from games.modes.situation_sim import SituationSimGame
from games.modes.problem_solver import ProblemSolverGame
from games.modes.misconception_hunt import MisconceptionHuntGame
from games.modes.recommendation import RecommendationGame
from games.modes.tool_word_hunt import ToolWordHuntGame
from games.modes.boss_fight import BossFightGame
from games.modes.srs_arena import SrsArenaGame
from games.modes.cloze_sprint import CloseSprintGame


def create_mock_llm(return_value):
    """Helper to create mock LLM"""
    mock = Mock()
    mock.predict_json = AsyncMock(return_value=return_value)
    return mock


class TestAnalogyMaker:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_creativity(self):
        """Test LLM evaluates analogy creativity"""
        mock_llm = create_mock_llm({
            'score': 90,
            'feedback': 'Muito criativo!',
            'creativity_level': 'alta',
            'improvements': []
        })
        
        game = AnalogyMakerGame(llm_service=mock_llm)
        round_data = game.create_round({'concept': 'Neurônio'}, 2)
        result = await game.evaluate_answer(round_data, "Neurônio é como uma estação de trem recebendo e enviando mensagens.")
        
        assert result['score'] == 135  # 90 * 1.5
        assert result['correct'] == True
        assert result['breakdown']['creativity'] == 'alta'
    
    @pytest.mark.asyncio
    async def test_fallback_heuristic(self):
        """Test fallback to heuristic"""
        game = AnalogyMakerGame()  # No LLM
        round_data = game.create_round({'concept': 'Test'}, 1)
        result = await game.evaluate_answer(round_data, "Test é como algo semelhante que faz sentido.")
        
        assert result['breakdown']['method'] == 'heuristic'


class TestSocraticDefense:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_depth(self):
        """Test LLM evaluates thinking depth"""
        mock_llm = create_mock_llm({
            'score': 85,
            'feedback': 'Pensamento profundo!',
            'depth_level': 'profundo',
            'improvements': []
        })
        
        game = SocraticDefenseGame(llm_service=mock_llm)
        round_data = game.create_round({'claim': 'AI will replace jobs'}, 3)
        result = await game.evaluate_answer(round_data, "Depende do contexto. Algumas profissões sim, mas novas surgirão...")
        
        assert result['score'] == 153  # 85 * 1.8
        assert result['breakdown']['depth_level'] == 'profundo'


class TestWhatIfScenario:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_plausibility(self):
        """Test LLM evaluates scientific plausibility"""
        mock_llm = create_mock_llm({
            'score': 80,
            'feedback': 'Cientificamente plausível!',
            'plausibility': 'alta',
            'count_consequences': 3
        })
        
        game = WhatIfScenarioGame(llm_service=mock_llm)
        round_data = game.create_round({'concept': 'gravity'}, 2)
        result = await game.evaluate_answer(round_data, "Atmosfera escaparia, órbitas mudariam, peso diminuiria...")
        
        assert result['score'] == 96  # 80 * 1.2
        assert result['breakdown']['plausibility'] == 'alta'


class TestSituationSim:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_decision(self):
        """Test LLM evaluates decision quality"""
        mock_llm = create_mock_llm({
            'score': 85,
            'feedback': 'Decisão sólida!',
            'decision_quality': 'excelente',
            'risks_considered': True
        })
        
        game = SituationSimGame(llm_service=mock_llm)
        round_data = game.create_round({}, 2)
        result = await game.evaluate_answer(round_data, "Primeiro investigo logs, depois notifico stakeholders...")
        
        assert result['score'] == 127  # 85 * 1.5
        assert result['breakdown']['risks_considered'] == True


class TestProblemSolver:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_reasoning(self):
        """Test LLM evaluates reasoning quality"""
        mock_llm = create_mock_llm({
            'score': 90,
            'feedback': 'Raciocínio claro!',
            'reasoning_quality': 'excelente'
        })
        
        game = ProblemSolverGame(llm_service=mock_llm)
        round_data = game.create_round({}, 2)
        result = await game.evaluate_answer(round_data, "B) Porque plantas produzem oxigênio, e sem fotossíntese isso para.")
        
        assert result['score'] == 90
        assert result['breakdown']['reasoning_quality'] == 'excelente'


class TestMisconceptionHunt:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_error_detection(self):
        """Test LLM evaluates error identification"""
        mock_llm = create_mock_llm({
            'score': 85,
            'feedback': 'Identificou corretamente!',
            'identified_correctly': True,
            'explanation_quality': 'boa'
        })
        
        game = MisconceptionHuntGame(llm_service=mock_llm)
        round_data = game.create_round({}, 2)
        result = await game.evaluate_answer(round_data, "A afirmação 1 está errada porque antibióticos não curam vírus...")
        
        assert result['score'] == 110  # 85 * 1.3
        assert result['breakdown']['identified'] == True


class TestRecommendation:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_relevance(self):
        """Test LLM evaluates recommendation relevance"""
        mock_llm = create_mock_llm({
            'score': 80,
            'feedback': 'Recomendação relevante!',
            'relevance': 'alta',
            'well_justified': True
        })
        
        game = RecommendationGame(llm_service=mock_llm)
        round_data = game.create_round({}, 2)
        result = await game.evaluate_answer(round_data, "Recomendo Simulador de Ecossistemas porque o perfil indica interesse em ecologia...")
        
        assert result['score'] == 80
        assert result['breakdown']['relevance'] == 'alta'


class TestToolWordHunt:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_analysis(self):
        """Test LLM evaluates text analysis"""
        mock_llm = create_mock_llm({
            'score': 85,
            'feedback': 'Análise completa!',
            'found_quote': True,
            'meaning_clear': True,
            'analyzed_purpose': True
        })
        
        game = ToolWordHuntGame(llm_service=mock_llm)
        round_data = game.create_round({}, 2)
        result = await game.evaluate_answer(round_data, "A frase é 'Ironicamente...' e significa...")
        
        assert result['score'] == 93  # 85 * 1.1
        assert result['breakdown']['found_quote'] == True


class TestBossFight:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_vocabulary(self):
        """Test LLM evaluates vocabulary usage"""
        mock_llm = create_mock_llm({
            'score': 85,
            'feedback': 'Uso correto!',
            'correct_usage': True,
            'demonstrates_meaning': True,
            'damage_to_boss': 40
        })
        
        game = BossFightGame(llm_service=mock_llm)
        round_data = game.create_round({}, 2)
        result = await game.evaluate_answer(round_data, "The speaker was eloquent in her presentation.")
        
        assert result['score'] == 127  # 85 * 1.5
        assert result['breakdown']['damage'] == 40


class TestSrsArena:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_recall(self):
        """Test LLM evaluates recall accuracy"""
        mock_llm = create_mock_llm({
            'score': 90,
            'feedback': 'Resposta precisa!',
            'factually_correct': True,
            'completeness': 'completa',
            'confidence': 'alta'
        })
        
        game = SrsArenaGame(llm_service=mock_llm)
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "Mitocôndria produz ATP, a energia da célula.")
        
        assert result['score'] == 90
        assert result['breakdown']['factually_correct'] == True


class TestClozeSprint:
    
    @pytest.mark.asyncio
    async def test_llm_evaluates_semantic_match(self):
        """Test LLM evaluates cloze answers semantically"""
        mock_llm = create_mock_llm({
            'score': 85,
            'feedback': 'Respostas corretas!',
            'blank_scores': [90, 80],
            'semantic_match': True
        })
        
        game = CloseSprintGame(llm_service=mock_llm)
        round_data = game.create_round({}, 1)
        result = await game.evaluate_answer(round_data, "1. fotossíntese 2. alimento")
        
        assert result['score'] == 102  # 85 * 1.2
        assert result['breakdown']['semantic_match'] == True
