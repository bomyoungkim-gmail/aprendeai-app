'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAdmin } from '@/stores/admin';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  entitlements: {
    features: Record<string, boolean>;
    limits: Record<string, number>;
  };
}

export default function PricingPage() {
  const { user } = useAdmin();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await api.get('/admin/billing/plans');
      return response.data as Plan[];
    },
  });

  const { data: mySubscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const response = await api.get('/me/subscription');
      return response.data;
    },
    enabled: !!user,
  });

  const handleRequestUpgrade = (planCode: string) => {
    // For now, just alert (will integrate with support system later)
    alert(`Upgrade to ${planCode} requested! Our team will contact you.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const planOrder = ['FREE', 'PRO', 'INSTITUTION'];
  const sortedPlans = plans?.sort(
    (a, b) => planOrder.indexOf(a.code) - planOrder.indexOf(b.code)
  );

  const getPlanIcon = (code: string) => {
    switch (code) {
      case 'FREE':
        return <Zap className="h-8 w-8" />;
      case 'PRO':
        return <Sparkles className="h-8 w-8" />;
      case 'INSTITUTION':
        return <Building2 className="h-8 w-8" />;
      default:
        return null;
    }
  };

  const isCurrentPlan = (planCode: string) => {
    return mySubscription?.plan?.code === planCode;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your learning journey. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sortedPlans?.map((plan) => {
            const isCurrent = isCurrentPlan(plan.code);
            const isPro = plan.code === 'PRO';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  isPro
                    ? 'ring-4 ring-indigo-600 bg-gradient-to-b from-indigo-50 to-white'
                    : 'bg-white'
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Popular
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className={`mb-4 ${isPro ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {getPlanIcon(plan.code)}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6 h-12">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.monthlyPrice === null ? (
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold text-gray-900">Free</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline">
                          <span className="text-5xl font-bold text-gray-900">
                            ${plan.monthlyPrice}
                          </span>
                          <span className="text-gray-600 ml-2">/month</span>
                        </div>
                        {plan.yearlyPrice && (
                          <p className="text-sm text-gray-500 mt-1">
                            or ${plan.yearlyPrice}/year (save $
                            {(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 px-6 rounded-lg bg-gray-100 text-gray-600 font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : plan.code === 'FREE' ? (
                    <a
                      href="/signup"
                      className="block w-full py-3 px-6 rounded-lg bg-gray-900 text-white text-center font-semibold hover:bg-gray-800 transition"
                    >
                      Get Started
                    </a>
                  ) : (
                    <button
                      onClick={() => handleRequestUpgrade(plan.code)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                        isPro
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Request Upgrade
                    </button>
                  )}

                  {/* Features */}
                  <div className="mt-8 space-y-4">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Features
                    </p>
                    {Object.entries(plan.entitlements.features).map(([key, enabled]) =>
                      enabled ? (
                        <div key={key} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>

                  {/* Limits */}
                  <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Limits
                    </p>
                    {Object.entries(plan.entitlements.limits).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {value === -1 ? 'Unlimited' : value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ/Note */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <p className="text-gray-600">
            All plans include our core AI-powered learning features. Need a custom plan?{' '}
            <a href="mailto:sales@aprendeai.com" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Contact our sales team
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
