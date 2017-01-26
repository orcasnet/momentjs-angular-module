const webpack = require('webpack')

// Banner
const bannerTemplate = require('./webpack.banner.js')
const banner = bannerTemplate.replace('<module_format>', 'CommonJS')

// Get externals from package.json dependencies
const dependencies = Object.keys(require('./package.json').dependencies).concat(['angular', 'moment'])
const externals = {}
dependencies.forEach((dep) => { externals[dep] = dep })

// Export config
module.exports = {
  entry: './src/index.js',
  output: {
    path: './lib',
    filename: 'index.js',
    library: '$moment',
    libraryTarget: 'commonjs'
  },
  plugins: [
    new webpack.BannerPlugin({ banner, raw: true, entryOnly: true })
  ],
  target: 'web',
  externals,
  node: {
    process: false,
    Buffer: false,
    setImmediate: false
  }
}
