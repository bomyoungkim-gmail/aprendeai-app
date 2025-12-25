'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TokenUsageOverview {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatency: number;
}

interface EvolutionDataPoint {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface DistributionItem {
  key: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface TopConsumer {
  id: string;
  requests: number;
  tokens: number;
  cost: number;
}

export default function AIUsageAnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'evolution' | 'distribution' | 'consumers'>('overview');
  
  // Date range state
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Data state
  const [overview, setOverview] = useState<TokenUsageOverview | null>(null);
  const [evolution, setEvolution] = useState<EvolutionDataPoint[]>([]);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [topConsumers, setTopConsumers] = useState<TopConsumer[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [interval, setInterval] = useState<'day' | 'hour'>('day');
  const [dimension, setDimension] = useState<'provider' | 'model' | 'feature' | 'operation'>('feature');
  const [entity, setEntity] = useState<'user' | 'family' | 'institution'>('user');


  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      const params = `from=${fromDate}&to=${toDate}`;

      // Fetch all data concurrently
      const [overviewRes, evolutionRes, distributionRes, consumersRes] = await Promise.all([
        fetch(`/api/v1/admin/ai/overview?${params}`, { headers }),
        fetch(`/api/v1/admin/ai/evolution?${params}&interval=${interval}`, { headers }),
        fetch(`/api/v1/admin/ai/distribution?${params}&dimension=${dimension}`, { headers }),
        fetch(`/api/v1/admin/ai/top-consumers?${params}&entity=${entity}&limit=10`, { headers }),
      ]);

      if (!overviewRes.ok) throw new Error('Failed to fetch overview');
      
      const overviewData = await overviewRes.json();
      const evolutionData = await evolutionRes.json();
      const distributionData = await distributionRes.json();
      const consumersData = await consumersRes.json();

      setOverview(overviewData);
      setEvolution(evolutionData);
      setDistribution(distributionData);
      setTopConsumers(consumersData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch AI usage analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate, interval, dimension, entity]);

  const setPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setToDate(to.toISOString().split('T')[0]);
    setFromDate(from.toISOString().split('T')[0]);
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-indicator">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Failed to Load Analytics</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Usage Analytics</h1>
        <p className="text-gray-600 mt-1">Track token consumption, costs, and usage patterns</p>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              data-testid="from-date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              data-testid="to-date"
            />
          </div>
          <div className="flex gap-2 items-end" data-testid="date-range-selector">
            <button onClick={() => setPreset(7)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200" data-testid="preset-7-days">
              Last 7 days
            </button>
            <button onClick={() => setPreset(30)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200" data-testid="preset-30-days">
              Last 30 days
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Requests"
            value={overview.totalRequests.toLocaleString()}
            icon="📊"
            testId="total-requests"
          />
          <MetricCard
            title="Total Tokens"
            value={overview.totalTokens.toLocaleString()}
            icon="🔢"
            testId="total-tokens"
          />
          <MetricCard
            title="Total Cost"
            value={`$${overview.totalCostUsd.toFixed(4)}`}
            icon="💵"
            testId="total-cost"
          />
          <MetricCard
            title="Avg Latency"
            value={`${Math.round(overview.avgLatency)}ms`}
            icon="⚡"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'evolution'} onClick={() => setActiveTab('evolution')} testId="evolution-tab">
            Evolution
          </TabButton>
          <TabButton active={activeTab === 'distribution'} onClick={() => setActiveTab('distribution')} testId="distribution-tab">
            Distribution
          </TabButton>
          <TabButton active={activeTab === 'consumers'} onClick={() => setActiveTab('consumers')} testId="top-consumers-tab">
            Top Consumers
          </TabButton>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        {activeTab === 'overview' && overview && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Summary</h2>
            {overview.totalRequests === 0 ? (
              <div className="text-center py-12" data-testid="empty-state">
                <p className="text-gray-500 text-lg">No AI usage found for this period</p>
                <p className="text-gray-400 text-sm mt-2">Try selecting a different date range</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Average tokens per request" value={Math.round(overview.totalTokens / overview.totalRequests)} />
                <DetailRow label="Average cost per request" value={`$${(overview.totalCostUsd / overview.totalRequests).toFixed(6)}`} />
                <DetailRow label="Requests per day (avg)" value={Math.round(overview.totalRequests / ((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)))} />
                <DetailRow label="Daily cost (avg)" value={`$${(overview.totalCostUsd / ((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(4)}`} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Time Series Evolution</h2>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as 'day' | 'hour')}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="interval-selector"
              >
                <option value="day">Daily</option>
                <option value="hour">Hourly</option>
              </select>
            </div>
            <div className="overflow-x-auto" data-testid="evolution-chart">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evolution.map((point, idx) => (
                    <tr key={idx} data-testid={`chart-point-${new Date(point.date).toISOString().split('T')[0]}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(point.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.requests}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.tokens.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${point.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Usage Distribution</h2>
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="dimension-selector"
              >
                <option value="feature">By Feature</option>
                <option value="provider">By Provider</option>
                <option value="model">By Model</option>
                <option value="operation">By Operation</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{dimension}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distribution.map((item, idx) => (
                    <tr key={idx} data-testid={`feature-${item.key}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.key || '(unknown)'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.requests}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid="tokens">{item.tokens.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'consumers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Top Consumers</h2>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                data-testid="entity-selector"
              >
                <option value="user">Users</option>
                <option value="family">Families</option>
                <option value="institution">Institutions</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" data-testid="consumers-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topConsumers.map((consumer, idx) => (
                    <tr key={idx} data-testid="consumer-row">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{consumer.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{consumer.requests}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid="tokens">{consumer.tokens.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${consumer.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({ title, value, icon, testId }: { title: string; value: string; icon: string; testId?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
