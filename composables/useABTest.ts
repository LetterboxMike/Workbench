/**
 * A/B Testing composable for CTA variations
 *
 * Usage:
 * ```typescript
 * const { getVariant, trackConversion } = useABTest('cta-hero');
 * const ctaText = getVariant({
 *   A: 'Start working',
 *   B: 'Try free',
 *   C: 'Get started'
 * });
 * // When user clicks CTA:
 * trackConversion('cta-hero');
 * ```
 */

interface ABTestVariants {
  [key: string]: string;
}

export const useABTest = (testName: string) => {
  const { trackEvent } = useAnalytics();

  /**
   * Get the current variant for this test
   * Uses localStorage to persist variant across sessions
   */
  const getVariant = <T extends ABTestVariants>(variants: T): T[keyof T] => {
    if (!import.meta.client) {
      // SSR: return control (variant A)
      return (variants['A'] || Object.values(variants)[0]) as T[keyof T];
    }

    const storageKey = `ab_${testName}`;
    let savedVariant = localStorage.getItem(storageKey);

    if (!savedVariant || !(savedVariant in variants)) {
      // Assign random variant
      const variantKeys = Object.keys(variants);
      const randomIndex = Math.floor(Math.random() * variantKeys.length);
      savedVariant = variantKeys[randomIndex];

      localStorage.setItem(storageKey, savedVariant);

      // Track variant assignment
      trackEvent('AB Test Assigned', {
        test: testName,
        variant: savedVariant
      });
    }

    return variants[savedVariant] as T[keyof T];
  };

  /**
   * Track when user converts (clicks CTA, signs up, etc.)
   */
  const trackConversion = () => {
    if (!import.meta.client) return;

    const storageKey = `ab_${testName}`;
    const variant = localStorage.getItem(storageKey) || 'A';

    trackEvent('AB Test Conversion', {
      test: testName,
      variant
    });
  };

  /**
   * Get the current variant key (A, B, C, etc.)
   */
  const getVariantKey = (): string => {
    if (!import.meta.client) return 'A';

    const storageKey = `ab_${testName}`;
    return localStorage.getItem(storageKey) || 'A';
  };

  return {
    getVariant,
    trackConversion,
    getVariantKey
  };
};

/**
 * Predefined CTA variations for common use cases
 */
export const CTA_VARIATIONS = {
  // Action-focused
  ACTION: {
    A: 'Start working',
    B: 'Get started',
    C: 'Try now'
  },

  // Benefit-focused
  BENEFIT: {
    A: 'Ship faster',
    B: 'Work smarter',
    C: 'Stay focused'
  },

  // Urgency-focused
  URGENCY: {
    A: 'Start today',
    B: 'Try it now',
    C: 'Begin free trial'
  },

  // Value-focused
  VALUE: {
    A: 'Start free',
    B: 'Try free',
    C: 'Free trial'
  },

  // Simple
  SIMPLE: {
    A: 'Start',
    B: 'Try',
    C: 'Begin'
  }
};

/**
 * Example usage in a component:
 *
 * ```vue
 * <script setup lang="ts">
 * const { getVariant, trackConversion } = useABTest('hero-cta');
 * const ctaText = getVariant(CTA_VARIATIONS.ACTION);
 *
 * const handleClick = () => {
 *   trackConversion();
 *   navigateTo('/login');
 * };
 * </script>
 *
 * <template>
 *   <button @click="handleClick">
 *     {{ ctaText }}
 *   </button>
 * </template>
 * ```
 */

/**
 * Analytics Dashboard Queries (Plausible)
 *
 * To analyze A/B test results:
 *
 * 1. Go to Plausible dashboard
 * 2. Filter by custom event: "AB Test Assigned"
 * 3. Group by property: "variant"
 * 4. Compare conversion rates between variants
 *
 * Conversion rate formula:
 * (AB Test Conversion events / AB Test Assigned events) * 100
 *
 * Example:
 * Variant A: 100 assigned, 15 conversions = 15% conversion rate
 * Variant B: 98 assigned, 22 conversions = 22.4% conversion rate
 * Winner: Variant B (22.4% > 15%)
 */
