import pytest
import os
import json
import shutil
from utils.dataset_collector import DatasetCollector

class TestDatasetCollector:
    @pytest.fixture
    def test_dir(self):
        # Create temp dir
        path = "services/ai/tests/temp_data"
        if os.path.exists(path):
            shutil.rmtree(path)
        os.makedirs(path)
        yield path
        # Cleanup
        if os.path.exists(path):
            shutil.rmtree(path)

    @pytest.mark.asyncio
    async def test_log_interaction(self, test_dir):
        collector = DatasetCollector(storage_dir=test_dir)
        
        await collector.log_interaction(
            game_mode="TEST_GAME",
            user_id="user123",
            prompt_data={"question": "What is 1+1?"},
            user_answer="2",
            evaluation_result={"score": 10, "feedback": "Correct"}
        )
        
        # Verify file exists
        files = os.listdir(test_dir)
        assert len(files) == 1
        assert files[0].startswith("game_interactions_")
        assert files[0].endswith(".jsonl")
        
        # Verify content
        with open(os.path.join(test_dir, files[0]), 'r', encoding='utf-8') as f:
            lines = f.readlines()
            assert len(lines) == 1
            data = json.loads(lines[0])
            assert data['game_mode'] == "TEST_GAME"
            assert data['user_id'] == "user123"
            assert data['completion'] == "2"
