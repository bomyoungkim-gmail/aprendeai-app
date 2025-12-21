"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { HydrationWrapper } from "@/components/HydrationWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <HydrationWrapper>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </QueryClientProvider>
    </HydrationWrapper>
  );
}
