var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var merge = require('merge-stream');
var zip = require('gulp-zip');

var dist = 'dist';

gulp.task('default', ['js', 'css']);

gulp.task('js', function () {

  var accPack = gulp.src('src/*.js')
    .pipe(concat('core-acc-pack.js'))
    .pipe(gulp.dest(dist));

  var min = gulp.src('dist/core-acc-pack.js')
    .pipe(uglify().on('error', function (e) {
      console.log(e);
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest(dist));

  return merge(accPack, min);
});

gulp.task('zip', function () {
  return gulp.src(
    [
      'dist/core-acc-pack.js'
    ], { base: 'dist/' })
  .pipe(zip('opentok-core-accelerator-1.0.0.zip'))
  .pipe(gulp.dest(dist));
});

gulp.task('dist', ['js', 'zip']);
