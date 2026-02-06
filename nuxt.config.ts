// https://nuxt.com/docs/api/configuration/nuxt-config
const authMode = (() => {
  const disabled = ['1', 'true', 'yes', 'on'].includes((process.env.WORKBENCH_AUTH_DISABLED || '').toLowerCase());

  if (disabled) {
    return 'disabled';
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return 'supabase';
  }

  return 'local';
})();

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      authMode
    }
  }
});
