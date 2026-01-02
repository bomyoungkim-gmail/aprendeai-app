import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config/api';

export interface CornellTypeConfig {
  id: string;
  label: string;
  color: string;
  tag: string;
}

export interface CornellTabConfig {
  id: string;
  label: string;
  icon: string;
}

export interface CornellConfig {
  types: CornellTypeConfig[];
  tabs: CornellTabConfig[];
  defaults: {
    viewMode: string;
    sidebarVisible: boolean;
  };
}

export function useCornellConfig() {
  return useQuery<CornellConfig>({
    queryKey: ['cornell-config'],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.CORNELL_CONFIG);
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
