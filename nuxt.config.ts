export default defineNuxtConfig({
  compatibilityDate: '2025-09-13',
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
      exclude: ['/', '/problems', '/problems/**', '/solutions/**'],
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
              primary: '#94A3B8',    // Lighter Slate
              secondary: '#F59E0B',  // Brighter Amber
              background: '#000000ff', // Dark Blue/Slate
              surface: '#232931ff',    // Lighter Dark Blue/Slate
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

