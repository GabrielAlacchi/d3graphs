
var gulp = require('gulp'),
    webpack = require('webpack-stream');

function onError(err) {
  console.error(err);
  
  //End the stream
  this.emit('end');
}

gulp.task('bundle-min', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(webpack( require('./webpack.config')(true) ))
    .on('error', onError)
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle', function() {
  return gulp.src('./lib/**/*.js')
    .pipe(webpack( require('./webpack.config')(false) ))
    .on('error', onError)
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function() {
  return gulp.src('./css/**/*.css')
    .pipe(gulp.dest('dist/css'));
});

gulp.task('watch', function() {
  gulp.watch('./lib/**/*.js', ['bundle', 'bundle-min']);
  gulp.watch('./css/**/*.js', ['styles']);
});

gulp.task('default', ['bundle', 'bundle-min', 'styles', 'watch']);