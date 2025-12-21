"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { HydrationWrapper } from "@/components/HydrationWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        onError: (error: any) => {
          console.error('[QueryClient] Mutation error:', error);
        },
      },
    },
  }));

  return (
    <ErrorBoundary>
      <HydrationWrapper>
        <QueryClientProvider client={queryClient}>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </QueryClientProvider>
      </HydrationWrapper>
    </ErrorBoundary>
  );
}
