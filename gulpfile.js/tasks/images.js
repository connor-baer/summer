// ==== IMAGES ==== //

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')({ camelize: true });
const config = require('../../gulpconfig').images;

// Optimize and resize images.
gulp.task('image-resize', () =>
  gulp
    .src(config.resize.src)
    .pipe(plugins.responsive(config.resize.responsive, config.resize.options))
    .pipe(gulp.dest(config.resize.dest))
);

gulp.task('images', ['image-resize']);
