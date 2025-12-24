"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { HydrationWrapper } from "@/components/HydrationWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            <WebSocketProvider>
              <ToastProvider />
              {children}
            </WebSocketProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HydrationWrapper>
    </ErrorBoundary>
  );
}
