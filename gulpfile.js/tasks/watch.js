// ==== WATCH ==== //

const gulp = require('gulp');
const config = require('../../gulpconfig').watch;

// Start browsersync task and then watch files for changes.
gulp.task('watch', ['browsersync'], () => {
  gulp.watch(config.jekyll, ['jekyll']);
  gulp.watch(config.styles, ['styles']);
  gulp.watch(config.scripts, ['scripts']);
  gulp.watch(config.images, ['images']);
});
