const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = 'Asmat Bingo'
      return args
    })
  },

  transpileDependencies: true,

  // IMPORTANT: fixes Thread Loader crash
  parallel: false,

  configureWebpack: {
    plugins: [
      // Prevent accidental backend TypeORM imports from breaking the client bundle
      new webpack.IgnorePlugin({ resourceRegExp: /^typeorm$/ }),
    ],
  },

  // Required for Electron file loading
  publicPath: './',
  pwa: {
    name: 'Asmat Bingo',
    short_name: 'Asmat Bingo',
    themeColor: '#0B2A52',
    msTileColor: '#0B2A52',
    iconPaths: {
      faviconSVG: 'img/icons/favicon.svg',
      favicon32: 'img/asmat-bingo-logo.png',
      favicon16: 'img/asmat-bingo-logo.png',
      appleTouchIcon: 'img/asmat-bingo-logo.png',
      maskIcon: 'img/icons/safari-pinned-tab.svg',
      msTileImage: 'img/asmat-bingo-logo.png',
    },
    workboxOptions: {
      skipWaiting: true,
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: 8080,

    client: {
      webSocketURL: {
        protocol: 'ws',
        hostname: 'localhost',
        port: 8080,
        pathname: '/ws',
      },
    },
  },
})