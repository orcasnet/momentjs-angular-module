const path = require('path')

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/moment/moment.js',
      'src/index.js',
      'test/*.spec.js',
      'templates/*.html'
    ],
    exclude: [],

    preprocessors: {
      'src/index.js': ['webpack', 'sourcemap'],
      'test/*.spec.js': ['webpack', 'sourcemap'],
      'templates/*.html': ['ng-html2js']
    },

    webpack: {
      externals: {
        angular: 'angular',
        moment: 'moment'
      },
      module: {
        rules: [{
          test: /\.js$/,
          include: path.resolve(__dirname, 'src'),
          exclude: /node_modules/,
          enforce: 'post',
          loader: 'istanbul-instrumenter-loader',
          options: {
            esModules: true
          }
        }]
      },
      devtool: 'inline-source-map'
    },
    webpackMiddleware: {
      stats: 'minimal'
    },

    ngHtml2JsPreprocessor: {
      moduleName: 'templates'
    },

    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage',
      reporters: [{
        type: 'lcov',
        subdir: '.'
      }]
    },

    port: 9876,
    colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: true,
    concurrency: Infinity
  })
}
