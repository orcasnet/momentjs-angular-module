var gulp   = require('gulp'),
    gutil  = require('gulp-util'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    karma  = require('gulp-karma'),
    notify = require('gulp-notify');

gulp.task('default', function() {
  gulp.run('scripts', 'test');
});

gulp.task('watch', function() {
  gulp.watch('./src/*.js', function(event) {
    gulp.run('scripts');
  });
  gulp.run('test-watch');
});

gulp.task('scripts', function() {
  gulp.src([
      './src/angular-moment.js',
      './src/angular-moment.service.js',
      './src/angular-moment.directive.js'
    ])
    .pipe(concat("angular-moment.js"))
    .pipe(gulp.dest('./dist/'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify({
      outSourceMaps: true,
      preserveComments: 'some'
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Karma testing
gulp.task('test', function() {
  // Be sure to return the stream
  return gulp.src('./defined-in-karma.conf.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }));
});

gulp.task('test-watch', function() {
  // Be sure to return the stream
  return gulp.src('./defined-in-karma.conf.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});