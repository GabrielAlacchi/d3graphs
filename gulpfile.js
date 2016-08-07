
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    del = require('del');

gulp.task('minify', function() {
    gulp.src('public/lib/*.js')
        .pipe(concat('d3graphs.concat.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('d3graphs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('route-src', function() {
   gulp.src('public/lib/*.js')
       .pipe(gulp.dest('dist'));
});

gulp.task('default', ['route-src', 'minify']);