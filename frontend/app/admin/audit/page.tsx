'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Filter, Calendar, User, Activity } from 'lucide-react';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  actorUserId?: string;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  beforeJson?: any;
  afterJson?: any;
  reason?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, resourceFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resourceType', resourceFilter);
      params.append('skip', ((page - 1) * 50).toString());
      params.append('take', '50');

      const response = await api.get(`/admin/audit-logs?${params.toString()}`);
      return response.data;
    },
  });

  const logs = data || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-600" />
            Audit Logs
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Complete history of all administrative actions and system changes.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Actions</option>
            <option value="USER_STATUS_CHANGED">User Status Changed</option>
            <option value="USER_ROLES_UPDATED">User Roles Updated</option>
            <option value="USER_IMPERSONATION_STARTED">Impersonation Started</option>
            <option value="FEATURE_FLAG_CREATED">Flag Created</option>
            <option value="FEATURE_FLAG_TOGGLED">Flag Toggled</option>
            <option value="SECRET_CREATED">Secret Created</option>
            <option value="SECRET_VIEWED">Secret Viewed</option>
            <option value="SECRET_ROTATED">Secret Rotated</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Resource Type</label>
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Resources</option>
            <option value="USER">User</option>
            <option value="FEATURE_FLAG">Feature Flag</option>
            <option value="SECRET">Secret</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setActionFilter('');
              setResourceFilter('');
              setPage(1);
            }}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {isLoading ? (
                <div className="text-center py-12 bg-white">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Timestamp
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Actor
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Resource
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Reason
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log: AuditLog) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{log.actorUserId?.slice(0, 8) || 'System'}</span>
                            </div>
                            {log.actorRole && (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800 mt-1">
                                {log.actorRole}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                log.action.includes('DELETE') || log.action.includes('SUSPENDED')
                                  ? 'bg-red-100 text-red-800'
                                  : log.action.includes('CREATE')
                                  ? 'bg-green-100 text-green-800'
                                  : log.action.includes('UPDATE')
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex flex-col">
                              <span className="font-medium">{log.resourceType}</span>
                              {log.resourceId && (
                                <span className="text-xs text-gray-400 font-mono">
                                  {log.resourceId.slice(0, 12)}...
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {log.reason || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={logs.length < 50}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{page}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                {page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={logs.length < 50}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

// Audit Log Detail Modal
function AuditLogDetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Audit Log Details</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Action</label>
                <p className="mt-1 text-sm text-gray-900 font-semibold">{log.action}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Actor ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {log.actorUserId || 'System'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Actor Role</label>
                <p className="mt-1 text-sm text-gray-900">{log.actorRole || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Resource Type</label>
                <p className="mt-1 text-sm text-gray-900">{log.resourceType}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Resource ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">
                  {log.resourceId || '-'}
                </p>
              </div>
              {log.requestId && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase">Request ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{log.requestId}</p>
                </div>
              )}
              {log.ip && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900">{log.ip}</p>
                </div>
              )}
              {log.reason && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase">Reason</label>
                  <p className="mt-1 text-sm text-gray-900">{log.reason}</p>
                </div>
              )}
            </div>

            {/* Before/After JSON */}
            {(log.beforeJson || log.afterJson) && (
              <div className="grid grid-cols-2 gap-4">
                {log.beforeJson && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Before</label>
                    <pre className="bg-red-50 border border-red-200 rounded-md p-3 text-xs overflow-auto max-h-64">
                      {JSON.stringify(log.beforeJson, null, 2)}
                    </pre>
                  </div>
                )}
                {log.afterJson && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">After</label>
                    <pre className="bg-green-50 border border-green-200 rounded-md p-3 text-xs overflow-auto max-h-64">
                      {JSON.stringify(log.afterJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
