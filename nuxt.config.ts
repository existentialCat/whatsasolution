export default defineNuxtConfig({
  ssr: true,
  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    '@nuxtjs/supabase', 'vuetify-nuxt-module',
  ],
  supabase: {
    // redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/'],
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    }
  }
});