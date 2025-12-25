import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PlanType = 'FREE' | 'INDIVIDUAL_PREMIUM' | 'FAMILY' | 'INSTITUTION';

export interface EntitlementSnapshot {
  source: string;
  planType: PlanType;
  limits: Record<string, number>;
  features: Record<string, any>;
}

export const useEntitlements = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const response = await api.get<EntitlementSnapshot>('/me/entitlements');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const hasFeature = (key: string): boolean => {
    return !!data?.features?.[key];
  };

  const getLimit = (key: string): number => {
    return data?.limits?.[key] ?? 0;
  };

  return {
    entitlements: data,
    isLoading,
    isError,
    hasFeature,
    getLimit,
    activePlan: data?.planType || 'FREE',
  };
};
