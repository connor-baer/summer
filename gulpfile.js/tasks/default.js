// ==== DEFAULT ==== //

var gulp      = require('gulp'),
  runSequence = require('run-sequence')
;

// Default task chain: build -> (livereload or browsersync) -> watch
gulp.task('default', function(callback) {
  runSequence('update',
  [
    'watch'
  ],
  callback);
});
