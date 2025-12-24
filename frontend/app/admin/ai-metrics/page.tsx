/**
 * AI Metrics Dashboard Page
 * Displays optimization metrics from AI service
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AIMetrics {
  cache: {
    hits: number;
    misses: number;
    total_requests: number;
    hit_rate_percent: number;
  };
  tokens: {
    total_before_optimization: number;
    total_after_optimization: number;
    reduction_percent: number;
    tokens_saved: number;
  };
  memory_jobs: {
    processed: number;
    failed: number;
    success_rate_percent: number;
  };
  performance: {
    avg_response_time_ms: number;
    min_response_time_ms: number;
    max_response_time_ms: number;
    samples: number;
  };
}

export default function AIMetricsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/admin/ai/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Use all_time metrics (persisted) or fallback to current_session
        setMetrics(data.data.all_time || data.data.current_session);
        setLastFetched(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Metrics unavailable');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch AI metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Failed to Load Metrics</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No metrics available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Optimization Metrics</h1>
          <p className="text-gray-600 mt-1">
            Monitor AI service performance and cost savings
          </p>
        </div>
        {lastFetched && (
          <div className="text-sm text-gray-500">
            Last updated: {lastFetched.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cache Hit Rate Card */}
        <MetricCard
          title="Cache Hit Rate"
          value={`${metrics.cache.hit_rate_percent.toFixed(1)}%`}
          subtitle={`${metrics.cache.hits} hits / ${metrics.cache.total_requests} requests`}
          trend={metrics.cache.hit_rate_percent >= 60 ? 'up' : 'down'}
          trendColor={metrics.cache.hit_rate_percent >= 60 ? 'green' : 'yellow'}
          icon="📊"
        />

        {/* Token Reduction Card */}
        <MetricCard
          title="Token Reduction"
          value={`${metrics.tokens.reduction_percent.toFixed(1)}%`}
          subtitle={`${metrics.tokens.tokens_saved.toLocaleString()} tokens saved`}
          trend={metrics.tokens.reduction_percent >= 70 ? 'up' : 'down'}
          trendColor={metrics.tokens.reduction_percent >= 70 ? 'green' : 'yellow'}
          icon="💰"
        />

        {/* Memory Jobs Card */}
        <MetricCard
          title="Memory Jobs"
          value={metrics.memory_jobs.processed.toString()}
          subtitle={`${metrics.memory_jobs.success_rate_percent.toFixed(1)}% success rate`}
          trend={metrics.memory_jobs.success_rate_percent >= 90 ? 'up' : 'down'}
          trendColor={metrics.memory_jobs.success_rate_percent >= 90 ? 'green' : 'yellow'}
          icon="🧠"
        />

        {/* Response Time Card */}
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.performance.avg_response_time_ms.toFixed(0)}ms`}
          subtitle={`Min: ${metrics.performance.min_response_time_ms.toFixed(0)}ms | Max: ${metrics.performance.max_response_time_ms.toFixed(0)}ms`}
          trend={metrics.performance.avg_response_time_ms < 1500 ? 'up' : 'down'}
          trendColor={metrics.performance.avg_response_time_ms < 1500 ? 'green' : 'yellow'}
          icon="⚡"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Details */}
        <DetailCard title="Cache Performance">
          <DetailRow label="Total Requests" value={metrics.cache.total_requests} />
          <DetailRow label="Cache Hits" value={metrics.cache.hits} />
          <DetailRow label="Cache Misses" value={metrics.cache.misses} />
          <DetailRow 
            label="Hit Rate" 
            value={`${metrics.cache.hit_rate_percent.toFixed(2)}%`}
            highlight={metrics.cache.hit_rate_percent >= 60}
          />
        </DetailCard>

        {/* Token Optimization */}
        <DetailCard title="Token Optimization">
          <DetailRow 
            label="Before Optimization" 
            value={metrics.tokens.total_before_optimization.toLocaleString()} 
          />
          <DetailRow 
            label="After Optimization" 
            value={metrics.tokens.total_after_optimization.toLocaleString()} 
          />
          <DetailRow 
            label="Tokens Saved" 
            value={metrics.tokens.tokens_saved.toLocaleString()}
            highlight 
          />
          <DetailRow 
            label="Reduction" 
            value={`${metrics.tokens.reduction_percent.toFixed(2)}%`}
            highlight={metrics.tokens.reduction_percent >= 70}
          />
        </DetailCard>
      </div>

      {/* Cost Savings Estimate */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💵 Cost Savings Estimate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Per Session</p>
            <p className="text-2xl font-bold text-green-600">
              ${((metrics.tokens.tokens_saved / 1_000_000) * 0.15).toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Daily (est. 100 sessions)</p>
            <p className="text-2xl font-bold text-green-600">
              ${(((metrics.tokens.tokens_saved / 1_000_000) * 0.15) * 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Projection</p>
            <p className="text-2xl font-bold text-green-600">
              ${(((metrics.tokens.tokens_saved / 1_000_000) * 0.15) * 3000).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down';
  trendColor: 'green' | 'yellow' | 'red';
  icon: string;
}

function MetricCard({ title, value, subtitle, trend, trendColor, icon }: MetricCardProps) {
  const trendColors = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  const bgColors = {
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        <span className={`ml-2 p-1 rounded ${bgColors[trendColor]}`}>
          <span className={trendColors[trendColor]}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        </span>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
