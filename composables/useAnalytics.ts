/**
 * Analytics composable for Plausible (privacy-friendly analytics)
 *
 * Usage:
 * 1. Add PLAUSIBLE_DOMAIN to .env: PLAUSIBLE_DOMAIN=workbench.app
 * 2. Add script tag to nuxt.config.ts (see below)
 * 3. Track events: const { trackEvent } = useAnalytics(); trackEvent('CTA Click');
 *
 * Nuxt config setup:
 * ```
 * script: [
 *   {
 *     src: 'https://plausible.io/js/script.js',
 *     'data-domain': process.env.PLAUSIBLE_DOMAIN,
 *     defer: true
 *   }
 * ]
 * ```
 */

interface PlausibleWindow extends Window {
  plausible?: (eventName: string, options?: { props?: Record<string, string | number | boolean> }) => void;
}

export const useAnalytics = () => {
  const config = useRuntimeConfig();

  /**
   * Track a custom event
   * @param eventName - Name of the event (e.g., 'CTA Click', 'Signup Started')
   * @param props - Optional event properties
   */
  const trackEvent = (eventName: string, props?: Record<string, string | number | boolean>) => {
    if (import.meta.client) {
      const win = window as PlausibleWindow;

      if (typeof win.plausible === 'function') {
        win.plausible(eventName, { props });
      } else {
        // Fallback for development or if Plausible isn't loaded
        console.log(`[Analytics] ${eventName}`, props);
      }
    }
  };

  /**
   * Track CTA button clicks
   * @param location - Where the CTA was clicked (e.g., 'hero', 'footer')
   * @param label - Button label (e.g., 'Start working', 'Start free')
   */
  const trackCTAClick = (location: string, label: string) => {
    trackEvent('CTA Click', { location, label });
  };

  /**
   * Track scroll depth milestones
   * @param percentage - Scroll percentage (25, 50, 75, 100)
   */
  const trackScrollDepth = (percentage: number) => {
    trackEvent('Scroll Depth', { percentage });
  };

  /**
   * Track external link clicks
   * @param url - The URL being clicked
   * @param context - Where the link was clicked from
   */
  const trackExternalLink = (url: string, context: string) => {
    trackEvent('External Link', { url, context });
  };

  /**
   * Track theme toggle
   * @param newTheme - The theme being switched to ('light' or 'dark')
   */
  const trackThemeToggle = (newTheme: string) => {
    trackEvent('Theme Toggle', { theme: newTheme });
  };

  /**
   * Track video play (if adding demo video)
   * @param videoId - ID or name of the video
   */
  const trackVideoPlay = (videoId: string) => {
    trackEvent('Video Play', { video: videoId });
  };

  return {
    trackEvent,
    trackCTAClick,
    trackScrollDepth,
    trackExternalLink,
    trackThemeToggle,
    trackVideoPlay
  };
};

/**
 * Setup scroll depth tracking (call in onMounted)
 */
export const setupScrollTracking = () => {
  const { trackScrollDepth } = useAnalytics();
  const milestones = [25, 50, 75, 100];
  const reached = new Set<number>();

  const checkScrollDepth = () => {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

    milestones.forEach((milestone) => {
      if (scrollPercentage >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        trackScrollDepth(milestone);
      }
    });
  };

  if (import.meta.client) {
    window.addEventListener('scroll', checkScrollDepth, { passive: true });

    onUnmounted(() => {
      window.removeEventListener('scroll', checkScrollDepth);
    });
  }
};
