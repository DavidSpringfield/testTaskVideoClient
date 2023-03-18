const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  filenameHashing: true,
  configureWebpack: {
    devtool: 'source-map',
    output: {
      filename: "[name].[hash].js",
      chunkFilename: "[name].[chunkhash].js"
    }
  }
})

