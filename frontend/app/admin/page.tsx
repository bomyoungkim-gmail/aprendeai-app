'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Flag, Key, FileText, ArrowRight, TrendingUp, Shield, Activity } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminDashboard() {
  // Fetch stats
  const { data: userStats } = useQuery({
    queryKey: ['admin-stats-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users?page=1&limit=1');
      return response.data.pagination;
    },
  });

  const { data: flagStats } = useQuery({
    queryKey: ['admin-stats-flags'],
    queryFn: async () => {
      const response = await api.get('/admin/feature-flags');
      return response.data;
    },
  });

  const { data: secretStats } = useQuery({
    queryKey: ['admin-stats-secrets'],
    queryFn: async () => {
      const response = await api.get('/admin/secrets');
      return response.data;
    },
  });

  const { data: recentAudit } = useQuery({
    queryKey: ['admin-recent-audit'],
    queryFn: async () => {
      const response = await api.get('/admin/audit-logs?take=5');
      return response.data;
    },
  });

  const totalUsers = userStats?.total || 0;
  const totalFlags = flagStats?.length || 0;
  const enabledFlags = flagStats?.filter((f: any) => f.enabled).length || 0;
  const totalSecrets = secretStats?.length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage users, feature flags, secrets, and monitor system activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{totalUsers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/admin/users"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              Manage users
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Flag className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Feature Flags</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{totalFlags}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {enabledFlags} ON
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/admin/feature-flags"
              className="text-sm font-medium text-green-600 hover:text-green-500 flex items-center"
            >
              Manage flags
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Key className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Encrypted Secrets</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{totalSecrets}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/admin/secrets"
              className="text-sm font-medium text-purple-600 hover:text-purple-500 flex items-center"
            >
              Manage secrets
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Audit Logs</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {recentAudit?.length || 0}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">recent</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/admin/audit"
              className="text-sm font-medium text-orange-600 hover:text-orange-500 flex items-center"
            >
              View logs
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              Quick Actions
            </h3>
          </div>
          <div className="p-5">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                <li className="py-4">
                  <Link
                    href="/admin/users"
                    className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">User Management</p>
                      <p className="text-sm text-gray-500">Search, edit status, impersonate users</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </li>

                <li className="py-4">
                  <Link
                    href="/admin/feature-flags"
                    className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex-shrink-0">
                      <Flag className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Feature Flags</p>
                      <p className="text-sm text-gray-500">Toggle features, manage rollouts</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </li>

                <li className="py-4">
                  <Link
                    href="/admin/secrets"
                    className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex-shrink-0">
                      <Key className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Encrypted Secrets</p>
                      <p className="text-sm text-gray-500">Manage API keys, rotate secrets</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </li>

                <li className="py-4">
                  <Link
                    href="/admin/audit"
                    className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Audit Logs</p>
                      <p className="text-sm text-gray-500">Review system activity, compliance</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </li>

                <li className="py-4">
                  <Link
                    href="/admin/ai-metrics"
                    className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex-shrink-0">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">AI Metrics</p>
                      <p className="text-sm text-gray-500">Monitor optimization, cache hits, cost savings</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-600" />
              Recent Activity
            </h3>
          </div>
          <div className="p-5">
            <div className="flow-root">
              {recentAudit && recentAudit.length > 0 ? (
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentAudit.slice(0, 5).map((log: any) => (
                    <li key={log.id} className="py-4">
                      <div className="flex space-x-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">{log.action}</h3>
                            <p className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {log.resourceType}
                            {log.actorRole && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {log.actorRole}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
            <div className="mt-6">
              <Link
                href="/admin/audit"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all activity
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-indigo-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-900">Admin Console Active</h3>
            <div className="mt-2 text-sm text-indigo-700">
              <p>
                You have full administrative access. All actions are logged for security and
                compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
