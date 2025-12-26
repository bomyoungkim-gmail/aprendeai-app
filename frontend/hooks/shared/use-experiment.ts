import { useState, useEffect } from 'react';

type Variant = 'control' | 'variant-a' | 'variant-b';

interface ExperimentOptions {
  experimentId: string;
  variants?: Variant[];
  weights?: number[]; // Percentage weights, must sum to 100
  userId?: string; // Optional user ID for consistent assignment
}

/**
 * Hook for A/B testing framework
 * Assigns a user to a variant based on ID or random assignment
 */
export function useExperiment({
  experimentId,
  variants = ['control', 'variant-a'],
  weights = [50, 50],
  userId
}: ExperimentOptions) {
  const [variant, setVariant] = useState<Variant>('control');

  useEffect(() => {
    // Check if variant is already stored in localStorage
    const storageKey = `experiment_${experimentId}`;
    const storedVariant = localStorage.getItem(storageKey) as Variant;

    if (storedVariant && variants.includes(storedVariant)) {
      setVariant(storedVariant);
      return;
    }

    // Deterministic assignment if userId provided
    if (userId) {
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = hash % variants.length;
      const assignedVariant = variants[index];
      
      localStorage.setItem(storageKey, assignedVariant);
      setVariant(assignedVariant);
      return;
    }

    // Random assignment based on weights
    const random = Math.random() * 100;
    let sum = 0;
    let assignedVariant = variants[0];

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) {
        assignedVariant = variants[i];
        break;
      }
    }

    localStorage.setItem(storageKey, assignedVariant);
    setVariant(assignedVariant);

    // In a real app, we would track assignment event here
    // analytics.track('Experiment Assignment', { experimentId, variant: assignedVariant });

  }, [experimentId, variants, weights, userId]);

  return {
    variant,
    isControl: variant === 'control',
    isVariant: variant !== 'control'
  };
}
