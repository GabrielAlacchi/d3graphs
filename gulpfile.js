
var gulp = require('gulp'),
    webpack = require('webpack-stream'),
    browserSync = require('browser-sync').create();

function onError(err) {
  console.error(err);
  
  //End the stream
  this.emit('end');
}

gulp.task('bundle-min', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(webpack( require('./webpack.config').config(true) ))
    .on('error', onError)
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(webpack( require('./webpack.config').config(false) ))
    .on('error', onError)
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
});

gulp.task('styles', function() {
  return gulp.src('./css/**/*.css')
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: '.'
    }
  });
});

gulp.task('watch', function() {
  gulp.watch('./lib/**/*.js', ['bundle', 'bundle-min']);
  gulp.watch('./css/**/*.js', ['styles']);
  gulp.watch('./index.html').on('change', browserSync.reload);
});

gulp.task('build', ['bundle', 'bundle-min', 'styles']);

gulp.task('default', ['build', 'browser-sync', 'watch']);