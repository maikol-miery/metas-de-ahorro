// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Metas de Ahorro Gamificadas',
      short_name: 'Metas Ahorro',
      description: 'Ahorra en dólares con tableros interactivos y gamificación estilo Duolingo',
      theme_color: '#90AD2E',
      background_color: '#123F1B',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/icono-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icono-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: false
    }
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'super_secreto_duolingo_ahorros_jwt_2025_seguro_y_robusto',
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      nombreApp: 'Metas de Ahorro'
    }
  }
})
