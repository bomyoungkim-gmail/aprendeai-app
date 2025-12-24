"""
Tests for middleware pipeline
"""
import pytest
from games.middleware import (
    GamePipeline,
    GameMiddleware,
    CorrelationIdMiddleware,
    MetricsMiddleware,
    EventEmitterMiddleware,
)


class TestMiddleware(GameMiddleware):
    """Test middleware that adds marker to context"""
    def __init__(self, marker: str):
        self.marker = marker
        self.called = False
    
    def process(self, context, next_handler):
        self.called = True
        context[f'marker_{self.marker}'] = True
        result = next_handler(context)
        return result


class TestGamePipeline:
    """Test suite for game pipeline"""
    
    def test_pipeline_creation(self):
        """Test pipeline can be created"""
        pipeline = GamePipeline([])
        assert pipeline.count() == 0
    
    def test_pipeline_executes_handler(self):
        """Test pipeline executes the handler"""
        pipeline = GamePipeline([])
        
        def handler(ctx):
            return {'result': 'success', **ctx}
        
        result = pipeline.execute({'test': True}, handler)
        assert result['result'] == 'success'
        assert result['test'] == True
    
    def test_middleware_executes_in_order(self):
        """Test middleware execute in order added"""
        mw1 = TestMiddleware('first')
        mw2 = TestMiddleware('second')
        mw3 = TestMiddleware('third')
        
        pipeline = GamePipeline([mw1, mw2, mw3])
        
        result = pipeline.execute({}, lambda ctx: ctx)
        
        # All middleware should have been called
        assert mw1.called
        assert mw2.called
        assert mw3.called
        
        # Context should have all markers
        assert result['marker_first'] == True
        assert result['marker_second'] == True
        assert result['marker_third'] == True
    
    def test_add_middleware(self):
        """Test adding middleware after creation"""
        pipeline = GamePipeline([])
        assert pipeline.count() == 0
        
        pipeline.add_middleware(TestMiddleware('added'))
        assert pipeline.count() == 1


class TestCorrelationIdMiddleware:
    """Test suite for correlation ID middleware"""
    
    def test_generates_correlation_id(self):
        """Test generates correlation ID if not present"""
        mw = CorrelationIdMiddleware()
        context = {}
        
        result = mw.process(context, lambda ctx: ctx)
        
        assert 'correlation_id' in result
        assert len(result['correlation_id']) > 0
    
    def test_uses_existing_correlation_id(self):
        """Test uses existing correlation ID"""
        mw = CorrelationIdMiddleware()
        existing_id = 'test-correlation-id-123'
        context = {'correlation_id': existing_id}
        
        result = mw.process(context, lambda ctx: ctx)
        
        assert result['correlation_id'] == existing_id
    
    def test_correlation_id_persists_through_chain(self):
        """Test correlation ID persists through middleware chain"""
        pipeline = GamePipeline([
            CorrelationIdMiddleware(),
            TestMiddleware('test'),
        ])
        
        result = pipeline.execute({}, lambda ctx: ctx)
        
        assert 'correlation_id' in result
        assert result['marker_test'] == True


class TestMetricsMiddleware:
    """Test suite for metrics middleware"""
    
    def test_metrics_middleware_tracks_success(self):
        """Test metrics middleware completes on success"""
        mw = MetricsMiddleware()
        context = {'metadata': {'gameMode': 'TEST_GAME'}}
        
        result = mw.process(context, lambda ctx: {'success': True, **ctx})
        
        assert result['success'] == True
    
    def test_metrics_middleware_handles_errors(self):
        """Test metrics middleware handles errors"""
        mw = MetricsMiddleware()
        context = {}
        
        def failing_handler(ctx):
            raise ValueError("Test error")
        
        with pytest.raises(ValueError, match="Test error"):
            mw.process(context, failing_handler)


class TestEventEmitterMiddleware:
    """Test suite for event emitter middleware"""
    
    def test_emits_events_on_success(self):
        """Test emits events on successful execution"""
        mw = EventEmitterMiddleware()
        context = {'metadata': {'gameMode': 'TEST_GAME'}}
        
        result = mw.process(context, lambda ctx: {'score': 10, **ctx})
        
        assert result['score'] == 10
    
    def test_emits_events_on_failure(self):
        """Test emits events on failed execution"""
        mw = EventEmitterMiddleware()
        context = {}
        
        def failing_handler(ctx):
            raise RuntimeError("Game failed")
        
        with pytest.raises(RuntimeError, match="Game failed"):
            mw.process(context, failing_handler)


class TestFullPipeline:
    """Test complete pipeline with all middleware"""
    
    def test_complete_pipeline(self):
        """Test full pipeline with all middleware"""
        pipeline = GamePipeline([
            CorrelationIdMiddleware(),
            MetricsMiddleware(),
            EventEmitterMiddleware(),
        ])
        
        context = {
            'metadata': {'gameMode': 'TEST_GAME'}
        }
        
        def handler(ctx):
            return {'score': 15, 'success': True, **ctx}
        
        result = pipeline.execute(context, handler)
        
        # Should have correlation ID
        assert 'correlation_id' in result
        
        # Should have result data
        assert result['score'] == 15
        assert result['success'] == True
