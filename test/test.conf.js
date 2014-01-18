module.exports = function (config) {
  config.set({
    basePath : '..',
    files : [
        'bower_components/angular/angular.js',
        'bower_components/angular-mocks/angular-mocks.js',
        'bower_components/momentjs/moment.js',
        'src/angular-moment.js',
        'test/*.spec.js'
    ],

    singleRun : true,

    browsers : ['Chrome', 'Safari', 'Firefox', 'PhantomJS'],

    frameworks : ["jasmine"],

    preprocessors : {
        '**/src/*.js': 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit'
    reporters : ['progress', 'coverage']

  });
};