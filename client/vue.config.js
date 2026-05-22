const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  // IMPORTANT: fixes Thread Loader crash
  parallel: false,

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