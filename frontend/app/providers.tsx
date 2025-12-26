"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { HydrationWrapper } from "@/components/HydrationWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionExpiredModal } from "@/components/auth/SessionExpiredModal";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use useRef for absolutely stable queryClient reference
  // Prevents re-creation on provider re-renders (best practice 2024)
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
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
    });
  }
  const queryClient = queryClientRef.current;

  return (
    <ErrorBoundary>
      <HydrationWrapper>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            <WebSocketProvider>
              <ToastProvider />
              <SessionExpiredModal />
              {children}
            </WebSocketProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HydrationWrapper>
    </ErrorBoundary>
  );
}
