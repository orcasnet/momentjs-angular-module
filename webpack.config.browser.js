const webpack = require('webpack')
const config = require('./webpack.config.js')

// Banner
const bannerTemplate = require('./webpack.banner.js')
const banner = bannerTemplate.replace('<module_format>', 'Universal Module Definition')

// Modify config for browser
config.output.path = './dist'
config.output.filename = 'angular-moment.js'
config.output.libraryTarget = 'umd'
config.externals = ['angular', 'moment']
config.plugins = [
  new webpack.BannerPlugin({
    banner,
    raw: true,
    entryOnly: true
  })
]

module.exports = config
