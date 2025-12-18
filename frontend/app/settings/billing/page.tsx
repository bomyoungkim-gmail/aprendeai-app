'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowUpCircle,
} from 'lucide-react';
import api from '@/lib/api';

export default function BillingSettingsPage() {
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const response = await api.get('/me/subscription');
      return response.data;
    },
  });

  const { data: entitlements, isLoading: entLoading } = useQuery({
    queryKey: ['my-entitlements'],
    queryFn: async () => {
      const response = await api.get('/me/entitlements');
      return response.data;
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['my-usage'],
    queryFn: async () => {
      const response = await api.get('/me/usage?range=today');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (subLoading || entLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const isPro = subscription?.plan?.code === 'PRO';
  const isInstitution = subscription?.plan?.code === 'INSTITUTION';
  const isFree = subscription?.plan?.code === 'FREE';

  const getUsagePercentage = (metricKey: string) => {
    const limit = entitlements?.limits?.[metricKey];
    const current = usage?.metrics?.[metricKey.replace('_per_day', '').replace('_per_month', '')]?.quantity || 0;

    if (limit === undefined || limit === -1) return 0; // Unlimited or not defined
    return Math.min(100, (current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-indigo-600" />
          Billing & Usage
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your subscription and monitor your usage
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm text-gray-600 uppercase tracking-wide">Current Plan</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              {subscription?.plan?.name}
            </h2>
            <p className="text-gray-600 mt-1">{subscription?.plan?.description}</p>
          </div>

          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            subscription?.status === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {subscription?.status}
          </div>
        </div>

        {isFree && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-start gap-4">
              <ArrowUpCircle className="h-8 w-8 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unlock More with Pro
                </h3>
                <p className="text-gray-700 mb-4">
                  Get 100x more API calls, advanced analytics, priority support, and more.
                </p>
                <a
                  href="/pricing"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  View Plans & Upgrade
                </a>
              </div>
            </div>
          </div>
        )}

        {!isFree && subscription?.plan?.monthlyPrice && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Price</span>
              <span className="text-2xl font-bold text-gray-900">
                ${subscription.plan.monthlyPrice}/mo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Usage Dashboard */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Usage Today</h2>
        </div>

        {usageLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(entitlements?.limits || {}).map(([key, limit]) => {
              const metricName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const currentUsage = usage?.metrics?.[key.replace('_per_day', '').replace('_per_month', '')]?.quantity || 0;
              const percentage = getUsagePercentage(key);
              const isUnlimited = limit === -1;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{metricName}</span>
                    <span className="text-sm text-gray-600">
                      {currentUsage.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
                    </span>
                  </div>

                  {isUnlimited ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Unlimited</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getUsageColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {percentage >= 90 && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>Approaching limit - consider upgrading</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {Object.keys(usage?.metrics || {}).length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No usage recorded yet. Start using the app to see your metrics!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cost Summary (if applicable) */}
      {usage?.totalCost > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cost Summary</h2>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estimated API Costs (Today)</span>
            <span className="text-2xl font-bold text-gray-900">
              ${usage.totalCost.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600 mb-4">
          Have questions about billing or want to discuss a custom plan?
        </p>
        <a
          href="mailto:support@aprendeai.com"
          className="text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Contact Support →
        </a>
      </div>
    </div>
  );
}
