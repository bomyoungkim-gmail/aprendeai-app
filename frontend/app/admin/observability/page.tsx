'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, AlertTriangle, DollarSign, Clock, TrendingUp, Server } from 'lucide-react';
import api from '@/lib/api';

export default function ObservabilityDashboard() {
  const [hours, setHours] = useState(24);

  // Fetch overview
  const { data: overview, isLoading } = useQuery({
    queryKey: ['observability-overview', hours],
    queryFn: async () => {
      const response = await api.get(`/admin/dashboard/overview?hours=${hours}`);
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch request metrics (last 24h, hourly)
  const { data: requestMetrics } = useQuery({
    queryKey: ['metrics-requests', hours],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const response = await api.get('/admin/dashboard/metrics', {
        params: {
          metric: 'api_request',
          from: from.toISOString(),
          to: to.toISOString(),
          bucket: hours <= 24 ? '1h' : '1d',
        },
      });
      
      return response.data.map((m: any) => ({
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requests: m.value,
      }));
    },
  });

  // Fetch latency metrics
  const { data: latencyMetrics } = useQuery({
    queryKey: ['metrics-latency', hours],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const response = await api.get('/admin/dashboard/metrics', {
        params: {
          metric: 'api_latency',
          from: from.toISOString(),
          to: to.toISOString(),
          bucket: hours <= 24 ? '1h' : '1d',
        },
      });
      
      return response.data.map((m: any) => ({
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: Math.round(m.value),
      }));
    },
  });

  // Fetch errors by endpoint
  const { data: errorsByEndpoint } = useQuery({
    queryKey: ['errors-by-endpoint', hours],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const response = await api.get('/admin/dashboard/errors/by-endpoint', {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });
      
      return response.data.slice(0, 10); // Top 10
    },
  });

  // Fetch provider usage
  const { data: providerUsage } = useQuery({
    queryKey: ['provider-usage', hours],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const response = await api.get('/admin/dashboard/usage/by-provider', {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });
      
      return response.data;
    },
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-7 w-7 text-indigo-600" />
            Observability Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time system metrics, errors, and usage tracking
          </p>
        </div>

        <div>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Server className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {overview?.requests?.total || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Latency</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {overview?.latency?.avg || 0}ms
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Errors</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {overview?.errors?.unresolved || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">API Costs</dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        ${(overview?.usage?.totalCost || 0).toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {/* Request Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                API Requests Over Time
              </h3>
              {requestMetrics && requestMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={requestMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Requests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">No data available</p>
              )}
            </div>

            {/* Latency Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Average Latency
              </h3>
              {latencyMetrics && latencyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={latencyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Latency (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">No data available</p>
              )}
            </div>
          </div>

          {/* Errors and Usage Tables */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Errors by Endpoint */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Errors by Endpoint
                </h3>
              </div>
              <div className="p-6">
                {errorsByEndpoint && errorsByEndpoint.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Endpoint
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {errorsByEndpoint.map((err: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-gray-900 font-mono">
                              {err.endpoint}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 font-semibold">
                              {err.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No errors found</p>
                )}
              </div>
            </div>

            {/* Provider Usage */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
                  Provider Usage & Costs
                </h3>
              </div>
              <div className="p-6">
                {providerUsage && providerUsage.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Provider
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Calls
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {providerUsage.map((usage: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-gray-900 capitalize">
                              {usage.provider}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {usage.calls}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 font-semibold">
                              ${usage.cost}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No usage data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
