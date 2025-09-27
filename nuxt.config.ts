export default defineNuxtConfig({
  compatibilityDate: '2025-09-13',
  app: {
    head: {
      link: [
        { id: 'favicon-link-original', rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  ssr: true,
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
    '~/assets/css/main.css',
  ],
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    '@nuxtjs/supabase', 'vuetify-nuxt-module', '@nuxtjs/google-fonts',
  ],
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // This is the key fix: Add '/reset-password' to this array.
      exclude: ['/', '/problems', '/problems/**', '/solutions/**', '/forgot-password', '/reset-password'],
    },
  },
  googleFonts: {
    families: {
      Poppins: {
        wght: [700],
      },
      Inter: {
        wght: [400],
      },
    }
  },
  vuetify: {
    vuetifyOptions: {
      theme: {
        themes: {
          light: {
            dark: false,
            colors: {
              primary: '#475569',
              secondary: '#D97706',
              background: '#F8FAFC',
              surface: '#FFFFFF',
            }
          },
          dark: {
            dark: true,
            colors: {
              primary: '#94A3B8',
              secondary: '#F59E0B',
              background: '#000000ff',
              surface: '#232931ff',
            }
          }
        }
      }
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    }
  }
});

