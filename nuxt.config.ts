// https://nuxt.com/docs/api/configuration/nuxt-config
const authMode = (() => {
  const disabled = ['1', 'true', 'yes', 'on'].includes((process.env.WORKBENCH_AUTH_DISABLED || '').toLowerCase());

  if (disabled) {
    return 'disabled';
  }

  // Require all three Supabase env vars to enable Supabase mode
  // This ensures consistency with server-side auth mode detection
  const hasSupabase = process.env.SUPABASE_URL &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (hasSupabase) {
    return 'supabase';
  }

  return 'local';
})();

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  devServer: {
    host: process.env.NUXT_HOST || process.env.NITRO_HOST || '127.0.0.1',
    port: Number(process.env.NUXT_PORT || process.env.NITRO_PORT || process.env.PORT || 4000)
  },

  // Explicitly configure component auto-imports
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  // Disable SSR for marketing and auth pages
  routeRules: {
    '/': { ssr: false },               // Marketing homepage with GSAP animations
    '/login': { ssr: false },          // Login page
    '/test-marketing': { ssr: false }, // Test page
    // Authenticated app routes are client-rendered to avoid SSR hydration drift
    '/projects/**': { ssr: false },
    '/notifications': { ssr: false },
    '/users': { ssr: false },
    '/settings': { ssr: false },
    '/admin/**': { ssr: false }
  },

  // Global CSS imports
  css: [
    '~/assets/css/design-tokens.css',
    '~/assets/css/base.css'
  ],

  app: {
    head: {
      // Preconnect to Google Fonts for performance
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap'
        }
      ],
      // Default to dark theme to prevent flash
      htmlAttrs: {
        'data-theme': 'dark'
      }
    }
  },

  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    public: {
      appName: 'Workbench',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:4000',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      authMode
    }
  }
});
