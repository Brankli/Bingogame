const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
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
