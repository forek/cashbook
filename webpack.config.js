const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const AssetsPlugin = require('assets-webpack-plugin')

const isDevMode = process.env.NODE_ENV === 'development'

const config = {
  entry: {
    index: relative('./app/view/index.js')
  },
  output: {
    path: relative('./public/dist'),
    publicPath: '/dist/',
    filename: '[hash].[name].js',
    chunkFilename: '[chunkhash].[name].chunk.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader'
        }]
      },
      {
        test: /\.(png|jpg|jpeg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1024,
              name: '[hash].[name].[ext]'
            }
          }
        ]
      },
      {
        test: /\.(le|c)ss$/,
        use: [
          isDevMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader'
        ]
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new AssetsPlugin()
  ],
  resolve: {
    extensions: ['.js', '.json', '.less', '.css', '.jsx']
  },
  mode: isDevMode ? 'development' : 'production'
}

if (isDevMode) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
} else {
  config.plugins.push(new MiniCssExtractPlugin({
    filename: '[hash].[name].css',
    chunkFilename: '[chunkhash].[name].chunk.css'
  }))
}

function relative (pathname) {
  return path.join(__dirname, pathname)
}

module.exports = config
