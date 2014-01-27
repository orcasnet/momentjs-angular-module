var gulp   = require('gulp'),
    gutil  = require('gulp-util'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    karma  = require('gulp-karma'),
    notify = require('gulp-notify');

var jsFiles = [
  './src/angular-moment.js',
  './src/angular-moment.service.js',
  './src/angular-moment.directive.js'
];

// Task to run during development
gulp.task('develop', function() {
  karmaAction = 'watch';
  gulp.watch(jsFiles, ['js']);
  karmaTest('watch');
});

// Task to build to dist folder
gulp.task('build', ['js'], function() {
  karmaTest('run');
});


// Subtasks
////////////

gulp.task('js', function() {
  gulp.src(jsFiles)
    .pipe(concat("angular-moment.js"))
    .pipe(gulp.dest('./dist/'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify({
      outSourceMaps: true,
      preserveComments: 'some'
    }))
    .pipe(gulp.dest('./dist'));
    // .pipe(notify({ message: 'Scripts task complete' }));
});

function karmaTest(action) {
  return gulp.src('./defined-in-karma.conf.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: action
    }));
}