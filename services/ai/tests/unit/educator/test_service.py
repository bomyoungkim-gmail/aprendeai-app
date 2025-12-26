import pytest
from services.ai.educator.service import EducatorService
from services.ai.educator.schemas import InteractionContext, EducatorResponse

@pytest.mark.asyncio
async def test_process_interaction_question():
    service = EducatorService()
    context = InteractionContext(
        user_id="user-123",
        content_id="content-456",
        interaction_type="question",
        data={"text": "O que é mitocôndria?"}
    )
    
    response = await service.process_interaction(context)
    
    assert isinstance(response, EducatorResponse)
    assert response.response_type == "text"
    assert "Analisando sua dúvida" in response.content

@pytest.mark.asyncio
async def test_process_interaction_chat_with_context():
    service = EducatorService()
    context = InteractionContext(
        user_id="user-123",
        content_id="content-456",
        interaction_type="chat",
        data={
            "message": "Explique isso",
            "selection": "Texto selecionado muito importante"
        }
    )
    
    response = await service.process_interaction(context)
    
    assert response.response_type == "text"
    assert "Contexto selecionado" in response.content
    assert "Texto selecionado" in response.content

@pytest.mark.asyncio
async def test_process_interaction_game_result():
    service = EducatorService()
    context = InteractionContext(
        user_id="user-123",
        content_id="content-456",
        interaction_type="game_result",
        data={
            "result": {
                "score": 85,
                "max_score": 100,
                "correct": True,
                "feedback": "Great job!"
            }
        }
    )
    
    response = await service.process_interaction(context)
    
    assert response.response_type == "confirmation"
    assert "Resultado processado" in response.content
    assert "Score: 85/100" in response.content
