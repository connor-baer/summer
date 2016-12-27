// ==== IMAGES ==== //

var gulp    = require('gulp'),
    plugins = require('gulp-load-plugins')({ camelize: true }),
    config  = require('../../gulpconfig').images
;


// Optimize and resize images.
gulp.task('image-resize', function () {
  return gulp.src(config.resize.src)
    .pipe(plugins.responsive(config.resize.responsive, config.resize.options ))
    .pipe(gulp.dest(config.resize.dest));
});


gulp.task('images', ['image-resize']);
