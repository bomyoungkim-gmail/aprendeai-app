import React from 'react';
import { useEntitlements, PlanType } from '@/hooks/use-entitlements';
import { SparklesIcon } from '@heroicons/react/24/solid';

const PlanColors: Record<PlanType, string> = {
  FREE: 'bg-gray-100 text-gray-700 border-gray-200',
  INDIVIDUAL_PREMIUM: 'bg-purple-100 text-purple-700 border-purple-200',
  FAMILY: 'bg-blue-100 text-blue-700 border-blue-200',
  INSTITUTION: 'bg-orange-100 text-orange-700 border-orange-200',
};

const PlanLabels: Record<PlanType, string> = {
  FREE: 'Free Plan',
  INDIVIDUAL_PREMIUM: 'Premium',
  FAMILY: 'Family Plan',
  INSTITUTION: 'Institution',
};

export const PlanBadge = () => {
  const { activePlan, isLoading } = useEntitlements();

  if (isLoading) {
    return <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-full" />;
  }

  const colorClass = PlanColors[activePlan] || PlanColors.FREE;
  const label = PlanLabels[activePlan] || 'Unknown';

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {activePlan !== 'FREE' && <SparklesIcon className="w-3 h-3" />}
      {label}
    </div>
  );
};
