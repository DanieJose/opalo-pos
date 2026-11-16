// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  srcDir: '.',

  future: {
    compatibilityVersion: 3
  },

  modules: [
    '@nuxtjs/tailwindcss'
  ],

  nitro: {
    routeRules: {
      '/uploads/**': { proxy: 'http://localhost:4000/uploads/**' }
    }
  },

  routeRules: {
    '/uploads/**': { proxy: 'http://localhost:4000/uploads/**' }
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000/api/v1',
      storeName: 'Ópalo Accesorios',
      storeLocation: 'Tocoa, Colón, Honduras',
      currency: 'L',
      isvRate: 0.15
    }
  },

  app: {
    head: {
      title: 'Ópalo Accesorios - Sistema POS',
      htmlAttrs: {
        lang: 'es'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Punto de Venta para Ópalo Accesorios en Tocoa, Colón, Honduras' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' }
      ]
    }
  }
});
