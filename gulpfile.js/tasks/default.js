// ==== DEFAULT ==== //

const gulp = require('gulp');
const runSequence = require('run-sequence');

// 1. Default
// 2. Setup
// 3. Build

// 1. Default //

// Default task chain: build -> (livereload or browsersync) -> watch
gulp.task('default', ['watch']);

// 2. Setup //

// Setup task chain: update -> icons.
gulp.task('setup', callback => {
  runSequence('update', 'icons', ['default'], callback);
});

// 3. Build //

// Run all tasks needed for a build in defined order.
gulp.task('build', callback => {
  runSequence('clean', ['styles', 'scripts', 'images', 'jekyll'], callback);
});
