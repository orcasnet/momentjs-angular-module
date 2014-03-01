var gulp   = require('gulp'),
    gutil  = require('gulp-util'),
    clean  = require('gulp-clean'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    karma  = require('gulp-karma');

var jsFiles = [
  './src/angular-moment.js',
  './src/angular-moment.service.js',
  './src/angular-moment.filters.js',
  './src/angular-moment.directive.js',
  './src/angular-moment.datepicker.js'
];

// Task to run during development
gulp.task('develop', function() {
  gulp.watch(jsFiles, ['js']);
  karmaTest('watch');
});

// Task to build to dist folder
gulp.task('build', ['js', 'test']);


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
});

gulp.task('test', karmaTest);

function karmaTest(action) {
  action = action || 'run';

  gulp.src('coverage', { read: false })
    .pipe(clean());

  return gulp.src('./defined-in-karma.conf.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: action
    }));
}