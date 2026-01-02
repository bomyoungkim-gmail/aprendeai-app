"use client";

import React from 'react';
import { useAccessibility } from '@/hooks/accessibility/use-accessibility';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  // Just calling the hook is enough to initialize and apply settings to <html>
  useAccessibility();
  
  return <>{children}</>;
}
