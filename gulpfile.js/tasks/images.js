// ==== IMAGES ==== //

var gulp  = require('gulp'),
  plugins = require('gulp-load-plugins')({ camelize: true }),
  config  = require('../../gulpconfig').images;


// Optimize images.
gulp.task('images', ['image-resize'], function () {
  return gulp.src(config.optimize.src)
  .pipe(plugins.imagemin(config.optimize.imagemin))
  .pipe(gulp.dest(config.optimize.dest));
});

gulp.task('image-resize', function () {
  return gulp.src(config.resize.src)
    .pipe(plugins.responsive(config.resize.responsive))
    .pipe(gulp.dest(config.resize.dest));
});
