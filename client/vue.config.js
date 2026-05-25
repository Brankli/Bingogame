const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
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
  workboxOptions: {
    skipWaiting: true
  }
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