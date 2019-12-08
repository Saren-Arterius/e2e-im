const nodeExternals = require('webpack-node-externals');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin');
import Fiber from "fibers";
import Sass from "sass";

const customSass = {
  implementation: Sass,
  fiber: Fiber
};

module.exports = {
  /*
  ** Headers of the page
  */
  mode:'spa',
  head: {
    title: 'E2E IM Frontend',
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {hid: 'description', name: 'description', content: 'E2E IM Frontend'},
      {hid: 'subject', name: 'subject', content: 'E2E IM Frontend'}
    ],
    link: [
      {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
      {rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons'}
    ]
  },
  plugins: [
    '~/plugins/vuetify.js',
    {ssr: false, src: '~plugins/vue-cryptojs.js'}
  ],
  css: ['~/assets/style/main.scss'],
  /*
  ** Customize the progress bar color
  */
  loading: {color: '#3B8070'},
  /*
  ** Build configuration
  */
  build: {
    transpile: [/^vuetify/],
    loaders: {
      scss: customSass,
      sass: customSass
    },
    plugins: [
      new VuetifyLoaderPlugin()
    ],
    extractCSS: true,
    extend (config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        });
        config.module.rules.push({
          test: /\.pug$/,
          loader: 'pug-plain-loader'
        });
      }
      if (process.server) {
        config.externals = [
          nodeExternals({
            whitelist: [/^vuetify/]
          })
        ];
      }
    }
  }
};
