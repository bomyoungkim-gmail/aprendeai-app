
from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_enrichment_endpoint():
    payload = {
        "text": "This is a sample educational text about Photosynthesis.",
        "contentId": "test-123",
        "level": "5_EF"
    }
    
    # Prefix /api added in main.py registration
    response = client.post("/api/pedagogical/enrich", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate structure
    assert "vocabularyTriage" in data
    assert "socraticQuestions" in data
    assert "gameConfigs" in data
    
    # Validate content (based on mock)
    vocab = data["vocabularyTriage"]
    assert "words" in vocab
    assert len(vocab["words"]) > 0
    
    games = data["gameConfigs"]
    assert "bossFight" in games
    assert games["bossFight"]["hp"] == 100
