import consola from 'consola'
import get from 'lodash/get'
import settings from './config/settings.json'
import { getGoogleFontConfig } from './modules/swell-editor/utils'
import { getLangSettings } from './modules/swell-editor/lang/utils'
import { mergeSettings } from './modules/swell/utils/mergeSettings'

const logger = consola.withScope('swell-editor')

const isProduction = process.env.NODE_ENV === 'production'
const editorMode = process.env.SWELL_EDITOR === 'true'

if (editorMode) {
  logger.info('Swell Editor enabled')
}

export default async () => {
  const allSettings = await mergeSettings(settings)

  return {
    vue: {
      config: {
        devtools: !isProduction,
        productionTip: false,
      },
    },

    /*
     ** Make all components in the /components folder available in templates without
     *  needing to import them explicitly or define them on the Vue instance object.
     */
    components: true,

    /*
     ** Set the progress-bar color
     */
    loading: { color: get(allSettings, 'colors.accent'), continuous: true },

    /*
     ** Vue plugins to load before mounting the App
     */
    plugins: [
      { src: '~/plugins/vue-country-region-select', mode: 'client' },
      { src: '~/plugins/vue-credit-card-validation', mode: 'client' },
      { src: '~/plugins/directives', mode: 'client' },
      { src: '~/plugins/swell-lang.js' },
    ],

    /*
     ** Nuxt.js modules
     */
    modules: [
      ['@nuxtjs/gtm'],

      [
        '@nuxtjs/sentry',
        /*
         ** Logs app errors with Sentry's browser and node SDKs.
         *
         *  You can use environment variables or the object below to set config options.
         *  See https://github.com/nuxt-community/sentry-module for all available
         *  options, defaults, and environment variables.
         */
        {
          // dsn: '', // or SENTRY_DSN in .env
          // config: {}
        },
      ],
    ],

    buildModules: [
      ['nuxt-i18n'],

      [
        '@nuxtjs/tailwindcss',
        /*
         ** Adds TailwindCSS (including PurgeCSS)
         *
         *  See https://tailwindcss.nuxtjs.org/ for config options.
         */
        {
          // Put your config overrides here
        },
      ],

      [
        '@nuxtjs/google-fonts',
        /*
         ** Parses Google Font families and loads them via stylesheet.
         *
         *  The config object is generated by the swell-editor module.
         *  See https://github.com/nuxt-community/google-fonts-module if you want
         *  to eject or provide your own config options.
         */
        getGoogleFontConfig(settings),
      ],

      [
        '~/modules/swell-editor',
        /*
         ** Provides communication and utilitiy functions for interfacing
         *  with Swell's storefront editor and fetching settings/content.
         *
         * IMPORTANT: the swell module must come after this one, otherwise everything breaks.
         * If you aren't using the storefront editor, this module can be safely removed.
         */
        {
          useEditorSettings: editorMode,
        },
      ],

      [
        '~/modules/swell',
        /*
         ** Initializes Swell.js SDK and injects it into Nuxt's context.
         *
         *  If you've cloned this repository from your store dashboard,
         *  these settings will already be configured in config/settings.json.
         *
         *  You can optionally override them here or using environment variables.
         *  https://github.com/swellstores/swell-theme-origin#configuration
         */
        {
          storeId: process.env.SWELL_STORE_ID,
          publicKey: process.env.SWELL_PUBLIC_KEY,
          previewContent: editorMode,
          storeUrl: process.env.SWELL_STORE_URL,
        },
      ],

      [
        '@nuxtjs/pwa',
        /*
         ** Provides PWA (Progressive Web App) functionality including app icons,
         *  SEO metadata, manifest.json file, and offline caching.
         *
         *  Use the object below to set config options.
         *  See https://pwa.nuxtjs.org/ for all available options and defaults.
         */
      ],
    ],

    gtm: {
      id: allSettings.analytics.gtmId,
      enabled: allSettings.analytics.gtmId && isProduction,
    },

    pwa: {
      manifest: false,
      meta: {
        name: get(allSettings, 'store.name'),
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: 'https://cdn.schema.io/*',
          },
        ],
      },
    },

    i18n: await getLangSettings(allSettings, editorMode),

    generate: {
      fallback: true, // Fallback to the generated 404.html
    },

    /*
     ** Extend default Nuxt routes to add page aliases
     */
    router: {
      trailingSlash: true,
      extendRoutes(routes, resolve) {
        // Rewrite to use the pages/_slug.vue component for home page, since the
        // content type is the same. If you want to have a unique template,
        // create a pages/index.vue and remove this route definition.
        routes.push({
          name: 'index',
          path: '/',
          component: resolve(__dirname, 'pages/_slug.vue'),
        })
      },
    },

    /*
     ** Extend default Nuxt server options
     */
    server: {
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 3333,
    },
  }
}
